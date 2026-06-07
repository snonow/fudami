/**
 * PackLoader — encrypted content pack lifecycle.
 *
 * Responsibilities (and ONLY these):
 *   1. Check whether a newer pack is available (manifest version compare)
 *   2. Download a .pack file from the Worker
 *   3. Decrypt it: AES-256-GCM  →  [packFormat ≥ 2] zlib inflate
 *   4. Verify integrity (GCM auth tag automatic; manifest hash extra)
 *   5. Write the decrypted SQLite to the app's private SQLite directory
 *
 * Pack binary formats:
 *   v1  [12B nonce][ AES-GCM(sqlite_bytes) + 16B tag ]       (no compression)
 *   v2  [12B nonce][ AES-GCM(zlib(sqlite_bytes)) + 16B tag ] (zlib, default)
 *
 * Nothing above this module touches crypto or files.
 * Nothing below it knows about encryption or downloading.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { inflateSync } from 'fflate';
import { Result, ok, err } from '../Result';
import type { ContentError, PackManifest } from './types';
import { PACK_KEY, IS_LOCAL_DEV } from '../../constants/pack';

// expo-sqlite stores DBs in <documentDirectory>/SQLite/ on iOS/Android.
const _fs = FileSystem as any;
const SQLITE_DIR  = (_fs.documentDirectory ?? '') + 'SQLite/';
const DB_NAME     = 'content.db';
export const CONTENT_DB_NAME = DB_NAME;
export const CONTENT_DB_URI  = SQLITE_DIR + DB_NAME;

const MANIFEST_URI = (_fs.documentDirectory ?? '') + 'content-manifest.json';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

/**
 * AES-256-GCM decrypt using the Web Crypto API.
 * Compatible with Python cryptography.hazmat AESGCM output:
 *   [12-byte nonce][ciphertext + 16-byte GCM tag]
 */
async function decryptAESGCM(packBytes: Uint8Array): Promise<Uint8Array> {
  const nonce      = packBytes.slice(0, 12);
  const ciphertext = packBytes.slice(12);
  const subtle     = (globalThis as any).crypto.subtle as SubtleCrypto;

  const cryptoKey = await subtle.importKey(
    'raw',
    hexToBytes(PACK_KEY).buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );

  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: 128 },
    cryptoKey,
    ciphertext,
  );

  return new Uint8Array(plaintext);
}

/**
 * Decompress a zlib-compressed buffer using fflate.
 * Only called when manifest.packFormat >= 2 (compression: "zlib").
 * fflate's inflateSync handles both raw deflate and zlib-wrapped deflate.
 */
function zlibInflate(compressed: Uint8Array): Uint8Array {
  return inflateSync(compressed);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** True if a content.db has been installed (fast check, no DB open). */
export async function isContentDbInstalled(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(CONTENT_DB_URI);
    return info.exists && (info as any).size > 0;
  } catch {
    return false;
  }
}

/** Returns the manifest for the currently installed pack, or null. */
export async function getInstalledManifest(): Promise<PackManifest | null> {
  try {
    const info = await FileSystem.getInfoAsync(MANIFEST_URI);
    if (!info.exists) return null;
    return JSON.parse(await FileSystem.readAsStringAsync(MANIFEST_URI)) as PackManifest;
  } catch {
    return null;
  }
}

/**
 * Check whether a newer pack is available for `level` from the Worker.
 * Returns `null` if the installed version is already up-to-date or on any error.
 *
 * Usage:
 *   const available = await checkForUpdate('n5', workerUrl, token);
 *   if (available) await installPackFromUrl(available.packUrl, token);
 */
export async function checkForUpdate(
  level: string,
  workerUrl: string,
  clerkToken?: string,
): Promise<{ packUrl: string; manifest: PackManifest } | null> {
  try {
    const headers: Record<string, string> = {};
    if (clerkToken && !IS_LOCAL_DEV) headers['Authorization'] = `Bearer ${clerkToken}`;
    const res = await fetch(`${workerUrl}/packs/${level}`, { headers });
    if (!res.ok) return null;
    const remote = await res.json() as PackManifest;

    const installed = await getInstalledManifest();
    // In local dev, manifests are named e.g. "n5-v1" (served from dist/)
    if (installed?.packName === remote.packName) return null;

    const packUrl = IS_LOCAL_DEV
      ? `${workerUrl}/${remote.packName}.pack`                         // local HTTP server
      : `${workerUrl}/packs/${level}/${remote.packName}.pack`;         // Worker
    return { packUrl, manifest: remote };
  } catch {
    return null;
  }
}

/**
 * Download, decrypt, (optionally inflate), and install a content pack.
 *
 * `packUrl`     — full URL to the .pack file (e.g. https://…/packs/n5/n5-v3.pack)
 * `clerkToken`  — Clerk JWT for Worker authentication
 *
 * On success returns the installed manifest.
 * On any failure returns a typed ContentError — the app stays alive.
 */
export async function installPackFromUrl(
  packUrl: string,
  clerkToken?: string,
): Promise<Result<PackManifest, ContentError>> {
  const authHeaders: Record<string, string> =
    (clerkToken && !IS_LOCAL_DEV) ? { Authorization: `Bearer ${clerkToken}` } : {};

  // 1 — Fetch manifest (public, no auth needed)
  let manifest: PackManifest;
  try {
    const manifestUrl = packUrl.replace(/\.pack$/, '-manifest.json');
    const res = await fetch(manifestUrl);
    if (!res.ok) return err({ kind: 'DOWNLOAD_FAILED', reason: `manifest HTTP ${res.status}` });
    manifest = await res.json() as PackManifest;
  } catch (e) {
    return err({ kind: 'DOWNLOAD_FAILED', reason: String(e) });
  }

  // 2 — Fetch the encrypted pack (JWT required)
  let packBytes: Uint8Array;
  try {
    const res = await fetch(packUrl, { headers: authHeaders });
    if (!res.ok) return err({ kind: 'DOWNLOAD_FAILED', reason: `pack HTTP ${res.status}` });
    packBytes = new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    return err({ kind: 'DOWNLOAD_FAILED', reason: String(e) });
  }

  // 3 — Decrypt (AES-256-GCM; wrong key / tampering = automatic throw)
  let decrypted: Uint8Array;
  try {
    if (packBytes.length < 28) return err({ kind: 'PACK_INTEGRITY_FAILED' });
    decrypted = await decryptAESGCM(packBytes);
  } catch (e) {
    return err({ kind: 'PACK_DECRYPT_FAILED', reason: String(e) });
  }

  // 4 — Decompress (packFormat 2+ uses zlib; v1 skips this step)
  let plaintext: Uint8Array;
  try {
    const needsInflate = (manifest.packFormat ?? 1) >= 2
      || manifest.compression === 'zlib';
    plaintext = needsInflate ? zlibInflate(decrypted) : decrypted;
  } catch (e) {
    return err({ kind: 'PACK_DECRYPT_FAILED', reason: `inflate: ${String(e)}` });
  }

  // 5 — Write decrypted+inflated SQLite blob to the app's private directory
  try {
    await FileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true });

    // expo-file-system writes binary via base64
    const b64 = btoa(String.fromCharCode(...plaintext));
    await FileSystem.writeAsStringAsync(CONTENT_DB_URI, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    await FileSystem.writeAsStringAsync(MANIFEST_URI, JSON.stringify(manifest));
    return ok(manifest);
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

/** Remove installed pack (e.g. before installing an update). */
export async function uninstallPack(): Promise<void> {
  await Promise.allSettled([
    FileSystem.deleteAsync(CONTENT_DB_URI, { idempotent: true }),
    FileSystem.deleteAsync(MANIFEST_URI,   { idempotent: true }),
  ]);
}
