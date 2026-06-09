/**
 * Build-time constants for the content pack.
 *
 * PACK_KEY       — AES-256 key (hex). From constants/packKey.ts (gitignored).
 *                  Must match FUDAMI_PACK_KEY in fudami-studio/.env.
 *
 * WORKER_URL     — Fudami Gateway (Cloudflare Worker). Used by PackLoader to:
 *                    GET /packs/versions.json          → public version index
 *                    GET /packs/{level}                → latest manifest
 *                    GET /packs/{level}/{file}.pack    → encrypted pack (JWT)
 *
 * LOCAL_WORKER   — For local dev: run `uv run python scripts/release.py --local`
 *                  in fudami-studio to build + serve packs on port 8765.
 *                  Then set EXPO_PUBLIC_API_URL=http://localhost:8765 in .env.local.
 */

// Use environment variable for the AES-256 key (hex) with a safe fallback
export const PACK_KEY = process.env.EXPO_PUBLIC_FUDAMI_PACK_KEY || null;

const _apiUrl = process.env.EXPO_PUBLIC_API_URL;

/**
 * Fudami Gateway base URL.
 * Dev: override with EXPO_PUBLIC_API_URL=http://localhost:8765 in .env.local
 * Prod: https://fudami-gateway.workers.dev
 */
export const WORKER_URL: string =
  _apiUrl ?? 'https://fudami-gateway.workers.dev';

/**
 * @deprecated Use WORKER_URL instead. Pack URLs are now constructed dynamically
 * per level: `${WORKER_URL}/packs/{level}`.
 * Kept for backward compatibility with ContentRepository.
 */
export const PACK_URL: string | null = _apiUrl ?? null;

/**
 * True when the app is pointing at the local HTTP server (for dev/testing).
 * PackLoader will skip auth when this is true.
 */
export const IS_LOCAL_DEV = Boolean(_apiUrl?.includes('localhost'));
