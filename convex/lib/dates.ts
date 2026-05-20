/* =================================================================
   Date helpers — runtime-agnostic (sem DOM, sem locale dependente).
   Convex roda no V8 isolate da edge.
   ================================================================= */

export function dateStr(date: Date): string {
  return (
    date.getUTCFullYear() +
    "-" +
    String(date.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getUTCDate()).padStart(2, "0")
  );
}

export function parseDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);
}

export function addDaysStr(s: string, n: number): string {
  const d = parseDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return dateStr(d);
}

/** Retorna "hoje" no fuso UTC. Não usamos timezone do server por estabilidade. */
export function todayStrUTC(): string {
  return dateStr(new Date());
}
