export function formatIndianMobileInput(value: string): string {
  const digits = String(value || '').replace(/\D/g, '');
  const tenDigits = digits.length > 10 ? digits.slice(-10) : digits;
  return `+91 ${tenDigits}`;
}

export function normalizeIndianMobileValue(value: string): string {
  return formatIndianMobileInput(value);
}
