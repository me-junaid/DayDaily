export function normalizePhoneNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10);
}
