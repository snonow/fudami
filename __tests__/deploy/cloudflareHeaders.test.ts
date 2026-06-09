import * as fs from 'fs';
import * as path from 'path';

// Guards the fix for the infinite-spinner regression on https://fudami.pages.dev/.
// expo-sqlite (web) uses wa-sqlite, which requires SharedArrayBuffer — only
// available when the response carries COOP/COEP that enable crossOriginIsolated.
// Without these headers, initDb() never resolves and the splash spinner is forever.

const ROOT = path.resolve(__dirname, '..', '..');
const HEADERS_PATH = path.join(ROOT, 'public', '_headers');
const REDIRECTS_PATH = path.join(ROOT, 'public', '_redirects');
const WORKFLOW_PATH = path.join(ROOT, '.github', 'workflows', 'production-deploy.yml');

function parseHeaders(src: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  let current: string | null = null;
  for (const rawLine of src.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!line.startsWith(' ') && !line.startsWith('\t')) {
      current = line.trim();
      out[current] = {};
      continue;
    }
    if (!current) continue;
    const m = line.trim().match(/^([A-Za-z0-9-]+)\s*:\s*(.+)$/);
    if (m) out[current][m[1].toLowerCase()] = m[2].trim();
  }
  return out;
}

describe('Cloudflare Pages deployment safety net', () => {
  it('public/_headers exists', () => {
    expect(fs.existsSync(HEADERS_PATH)).toBe(true);
  });

  it('public/_headers enables crossOriginIsolated for the whole site', () => {
    const parsed = parseHeaders(fs.readFileSync(HEADERS_PATH, 'utf8'));
    const rule = parsed['/*'];
    expect(rule).toBeDefined();

    // COOP must be same-origin (or stricter) — required pair for crossOriginIsolated.
    expect(rule['cross-origin-opener-policy']).toMatch(/^same-origin(-allow-popups)?$/);

    // COEP must be require-corp OR credentialless — both unlock SharedArrayBuffer.
    // credentialless is preferred here because Clerk OAuth popups would break
    // under require-corp without explicit CORP on every third-party resource.
    expect(rule['cross-origin-embedder-policy']).toMatch(/^(require-corp|credentialless)$/);
  });

  it('production workflow copies public/_headers and public/_redirects into dist/', () => {
    expect(fs.existsSync(WORKFLOW_PATH)).toBe(true);
    expect(fs.existsSync(REDIRECTS_PATH)).toBe(true);

    const yml = fs.readFileSync(WORKFLOW_PATH, 'utf8');
    // Without these copies, `expo export` outputs into dist/ but the Cloudflare
    // control files (_headers, _redirects) are dropped — reintroducing the bug.
    expect(yml).toMatch(/cp\s+public\/_headers\s+dist\/_headers/);
    expect(yml).toMatch(/cp\s+public\/_redirects\s+dist\/_redirects/);
  });
});
