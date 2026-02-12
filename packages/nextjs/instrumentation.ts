export async function register() {
  if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.getItem !== 'function') {
    const store: Record<string, string> = {};
    (globalThis as any).localStorage = {
      getItem(key: string) { return store[key] ?? null; },
      setItem(key: string, value: string) { store[key] = String(value); },
      removeItem(key: string) { delete store[key]; },
      clear() { Object.keys(store).forEach(k => delete store[k]); },
      get length() { return Object.keys(store).length; },
      key(i: number) { return Object.keys(store)[i] ?? null; },
    };
  }
}
