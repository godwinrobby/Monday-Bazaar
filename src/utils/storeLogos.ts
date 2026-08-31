const STORAGE_KEY = 'googleStoreImages';

export function getStoreLogos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch {
    return {};
  }
}

export function getStoreLogoUrl(store: string): string {
  return getStoreLogos()[store] || '';
}

export function setStoreLogoUrl(store: string, url: string): void {
  const all: Record<string, string> = { ...getStoreLogos() };
  if (url) all[store] = url;
  else delete all[store];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}
