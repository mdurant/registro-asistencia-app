const PREFIX = 'mi_asistencia_';

function storageKey(key: string): string {
  return `${PREFIX}${key}`;
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return localStorage.getItem(storageKey(key));
  } catch {
    return null;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    localStorage.setItem(storageKey(key), value);
  } catch {
    // Sin almacenamiento persistente en este entorno
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    localStorage.removeItem(storageKey(key));
  } catch {
    // noop
  }
}
