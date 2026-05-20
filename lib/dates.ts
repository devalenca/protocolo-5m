/** YYYY-MM-DD em horário local */
export function todayStr(): string {
  return dateStr(new Date());
}

export function dateStr(date: Date): string {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

export function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateBR(s: string): string {
  const d = parseDate(s);
  return (
    String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0")
  );
}

const DOW_LONG = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
const DOW_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export function dayOfWeek(s: string, short = false): string {
  const arr = short ? DOW_SHORT : DOW_LONG;
  return arr[parseDate(s).getDay()];
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return dateStr(d);
}

export function greetingFor(hour: number): string {
  if (hour < 6) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
