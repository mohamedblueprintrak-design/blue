/**
 * Input Sanitization Utilities
 * أدوات تنظيف المدخلات للحماية من XSS وحقن الأكواد
 */

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"]/g, (char) => {
      const entities: Record<string, string> = { '<': '&lt;', '>': '&gt;', "'": '&#x27;', '"': '&quot;' };
      return entities[char] || char;
    })
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      );
    }
  }
  return sanitized;
}

export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  return email.toLowerCase().trim().replace(/[^a-z0-9@._+-]/g, '');
}

export function removeControlChars(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[\x00-\x1F\x7F]/g, '');
}

export function escapeSqlLike(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[%_\\]/g, '\\$&');
}

export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return '';
  return filename.replace(/\.\./g, '').replace(/[/\\]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_').trim();
}
