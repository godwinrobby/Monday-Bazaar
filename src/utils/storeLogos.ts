const STORAGE_KEY = 'googleStoreImages';

// Server-authoritative store logos loaded from the backend. These apply across the
// whole site for all users and take precedence over the per-browser local cache.
let serverLogos: Record<string, string> = {};

export function getStoreLogos(): Record<string, string> {
  let local: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') local = parsed;
    }
  } catch {}
  return { ...local, ...serverLogos };
}

export function getStoreLogoUrl(store: string): string {
  return getStoreLogos()[store] || '';
}

export function setStoreLogoUrl(store: string, url: string): void {
  const all: Record<string, string> = { ...getStoreLogos() };
  if (url) all[store] = url;
  else delete all[store];
  try {
    // Only persist entries that are not already served from the server cache,
    // so locally-stored values never override the site-wide ones.
    const localOnly: Record<string, string> = {};
    Object.keys(all).forEach((s) => {
      if (serverLogos[s] && serverLogos[s] === all[s]) return;
      localOnly[s] = all[s];
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localOnly));
  } catch {}
}

// Seed/refresh the server-authoritative store logos (store -> image URL).
export function applyServerStoreLogos(map: Record<string, string> | null | undefined): void {
  serverLogos = { ...(map && typeof map === 'object' ? map : {}) };
}
