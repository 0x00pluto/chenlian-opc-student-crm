export function normalizePhone(phone: string): string {
  let p = phone.trim().replace(/\s+/g, "");
  if (p.startsWith("+86")) p = p.slice(3);
  if (p.startsWith("86") && p.length === 13) p = p.slice(2);
  return p;
}
