const pad = (n: number) => String(n).padStart(2, "0");

export function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

function parse(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(s: string, n: number) {
  const t = new Date(parse(s) + n * 86400000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function diffDays(a: string, b: string) {
  return Math.round((parse(b) - parse(a)) / 86400000);
}

/** Day number in the challenge (1 = start date). */
export function dayNumber(start: string, date: string) {
  return diffDays(start, date) + 1;
}

export function isValidDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function frDate(s: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", opts);
}
