/**
 * PackLoader — encrypted content pack lifecycle.
 *
 * Responsibilities (and ONLY these):
 *   1. Download a .pack file from a URL
 *   2. Decrypt it with AES-256-GCM using the build-time key
 *   3. Verify integrity (GCM auth tag is automatic; manifest hash is extra)
 *   4. Write the decrypted SQLite to the app's private SQLite directory
 *
 * Nothing above this module touches crypto. Nothing below it knows about files.
 */

import * as FileSystem from 'expo-file-system';
import { Result, ok, err } from '../Result';
import type { ContentError, PackManifest } from './types';
import { PACK_KEY } from '../../constants/pack';

// expo-sqlite stores DBs in <documentDirectory>/SQLite/ on iOS
// FileSystem types are incomplete in some Expo versions — cast to any for the path properties
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
 * AES-256-GCM decrypt using the Web Crypto API (native iOS/Android crypto —
 * hardware-accelerated, no third-party dep). Compatible with Python's
 * cryptography.hazmat.primitives.ciphers.aead.AESGCM output format:
 * pack = [12-byte nonce][ciphertext][16-byte GCM auth tag].
 */
async function decryptAESGCM(packBytes: Uint8Array): Promise<Uint8Array> {
  const nonce      = packBytes.slice(0, 12);
  const ciphertext = packBytes.slice(12);   // includes 16-byte tag at the end
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

// ─── Public API ──────────────────────────────────────────────────────────────

/** True if a content.db has been installed (fast check, no DB open). */
export async function isContentDbInstalled(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(CONTENT_DB_URI);
    return info.exists && info.size > 0;
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
 * Download a pack from `packUrl`, decrypt it, and install it as content.db.
 * The manifest URL is derived from packUrl by replacing '.pack' → '-manifest.json'.
 *
 * On success returns the installed manifest.
 * On any failure returns a typed ContentError — the app stays alive.
 */
export async function installPackFromUrl(
  packUrl: string,
): Promise<Result<PackManifest, ContentError>> {
  // 1 — Fetch manifest (unencrypted, tells us what we're about to install)
  let manifest: PackManifest;
  try {
    const res = await fetch(packUrl.replace(/\.pack$/, '-manifest.json'), {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Placeholder
      }
    });
    if (!res.ok) return err({ kind: 'DOWNLOAD_FAILED', reason: `manifest HTTP ${res.status}` });
    manifest = (await res.json()) as PackManifest;
  } catch (e) {
    return err({ kind: 'DOWNLOAD_FAILED', reason: String(e) });
  }

  // 2 — Fetch the encrypted pack
  let packBytes: Uint8Array;
  try {
    const res = await fetch(packUrl, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Placeholder
      }
    });
    if (!res.ok) return err({ kind: 'DOWNLOAD_FAILED', reason: `pack HTTP ${res.status}` });
    packBytes = new Uint8Array(await res.arrayBuffer());
  } catch (e) {
    return err({ kind: 'DOWNLOAD_FAILED', reason: String(e) });
  }

  // 3 — Decrypt (AES-256-GCM via native Web Crypto; tag failure throws automatically)
  let plaintext: Uint8Array;
  try {
    if (packBytes.length < 28) return err({ kind: 'PACK_INTEGRITY_FAILED' });
    plaintext = await decryptAESGCM(packBytes);
  } catch (e) {
    return err({ kind: 'PACK_DECRYPT_FAILED', reason: String(e) });
  }

  // 4 — Write the decrypted SQLite to the app's private SQLite directory
  try {
    await FileSystem.makeDirectoryAsync(SQLITE_DIR, { intermediates: true });

    // expo-file-system writes binary via base64
    const b64 = btoa(String.fromCharCode(...plaintext));
    await FileSystem.writeAsStringAsync(CONTENT_DB_URI, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Persist manifest so next boot skips download
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
