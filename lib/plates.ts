const STANDARD_PLATES = [20, 15, 10, 5, 2.5, 1.25];

/** Calcula anilhas por lado da barra. Retorna null se carga inválida ou não fechável. */
export function calcPlates(targetKg: number, barKg = 20): number[] | null {
  if (!targetKg || targetKg <= barKg) return null;
  const perSide = (targetKg - barKg) / 2;
  if (perSide < 0) return null;
  const result: number[] = [];
  let remaining = perSide;
  for (const p of STANDARD_PLATES) {
    while (remaining >= p - 0.001) {
      result.push(p);
      remaining = Math.round((remaining - p) * 1000) / 1000;
    }
  }
  if (remaining > 0.01) return null;
  return result;
}

/** "2×20kg + 1×10kg + 1×2.5kg" */
export function formatPlates(plates: number[] | null): string {
  if (!plates || plates.length === 0) return "";
  const counts: Record<string, number> = {};
  plates.forEach((p) => {
    counts[String(p)] = (counts[String(p)] ?? 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([p, c]) => `${c}×${p}kg`)
    .join(" + ");
}
