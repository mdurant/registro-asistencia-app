export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return rut;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  const reversed = body.split('').reverse();
  const parts: string[] = [];

  for (let i = 0; i < reversed.length; i++) {
    if (i > 0 && i % 3 === 0) parts.push('.');
    parts.push(reversed[i]);
  }

  return `${parts.reverse().join('')}-${dv}`;
}

export function computeRutDv(body: string): string {
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

export function validateRut(rut: string): boolean {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  if (!/^\d+$/.test(body)) return false;

  return computeRutDv(body) === dv;
}

export function getRutBodyLast4(rut: string): string {
  const body = cleanRut(rut).slice(0, -1);
  return body.slice(-4).padStart(4, '0');
}
