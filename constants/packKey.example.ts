/**
 * SETUP INSTRUCTIONS
 * ──────────────────
 * 1. Copy this file to  constants/packKey.ts  (gitignored).
 * 2. Replace the placeholder with the value of FUDAMI_PACK_KEY from fudami-studio/.env.
 * 3. Generate a key if you don't have one yet:
 *      python -c "import os; print(os.urandom(32).hex())"
 *
 * NEVER commit constants/packKey.ts to git.
 */
export const PACK_KEY = 'REPLACE_WITH_64_HEX_CHARS_MATCHING_STUDIO_ENV';
