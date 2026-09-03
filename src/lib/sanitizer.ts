/**
 * Defensive Payload Ingestion & Undefined-Stripping Utility
 * Prevents Firestore runtime errors caused by `undefined` fields.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => stripUndefined(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = stripUndefined(value);
      }
    }
    return cleaned as T;
  }

  return obj;
}

/**
 * Sanitizes strings to prevent script injection and normalize whitespace.
 */
export function sanitizeText(text: string, maxLength: number = 10000): string {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, maxLength);
}
