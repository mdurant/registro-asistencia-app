export function stringifyJson(value: Record<string, unknown>): string {
  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val === undefined) continue;
    if (
      val === null ||
      typeof val === 'string' ||
      typeof val === 'number' ||
      typeof val === 'boolean'
    ) {
      sanitized[key] = val;
    }
  }
  return JSON.stringify(sanitized);
}

export function parseJsonColumn(
  value: unknown,
): Record<string, unknown> | null {
  if (value == null || value === '') return null;

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== 'string') return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}
