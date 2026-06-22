import * as Crypto from 'expo-crypto';

export function generateId(): string {
  return Crypto.randomUUID();
}

export async function hashPayload(payload: Record<string, unknown>): Promise<string> {
  const str = JSON.stringify(payload);
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, str);
}
