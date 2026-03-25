export function formatIndianMobileInput(value: string): string {
  const raw = String(value || '');
  const digits = raw.replace(/\D/g, '');
  const hasCountryPrefix = raw.trim().startsWith('+91') || raw.trim().startsWith('91');

  let normalized = digits;
  if (hasCountryPrefix && normalized.startsWith('91')) {
    normalized = normalized.slice(2);
  }

  if (normalized.length > 10) {
    normalized = normalized.slice(-10);
  }

  if (normalized.length === 0) return '';
  return `+91 ${normalized}`;
}

export function normalizeIndianMobileValue(value: string): string {
  return formatIndianMobileInput(value);
}
