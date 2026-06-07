/**
 * Build-time constants for the content pack.
 *
 * PACK_KEY  — AES-256 key (hex). Comes from constants/packKey.ts (gitignored).
 *             Must match the FUDAMI_PACK_KEY used by fudami-studio.
 *
 * PACK_URL  — Where to download content packs. Set to null for offline-only / dev mode.
 *             The app works without it (falls back to the bundled seed vocab).
 */

export { PACK_KEY } from './packKey';

export const PACK_URL: string | null = null;
// Future: 'https://cdn.fudami.app/packs/n5-v1.pack'
