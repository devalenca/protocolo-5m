/* =================================================================
   Seed de alimentos PT-BR — valores por 100g
   ----------------------------------------------------------------
   Fonte: TACO (Tabela Brasileira de Composição de Alimentos) +
   rótulos comerciais aproximados pros suplementos.
   Cobre ~70% do que aparece nas refeições do protocolo (Seções 02-03).
   ================================================================= */

export type SeedFood = {
  name: string;
  brand?: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  defaultPortionGrams?: number;
  defaultPortionLabel?: string;
};

export const FOOD_SEED: SeedFood[] = [
  // ── Proteínas ──────────────────────────────────────────────
  { name: "Ovo de galinha inteiro", kcal: 143, protein: 13, carbs: 0.6, fat: 9.5, defaultPortionGrams: 50, defaultPortionLabel: "1 ovo (50g)" },
  { name: "Clara de ovo", kcal: 52, protein: 11, carbs: 0.7, fat: 0.2, defaultPortionGrams: 33, defaultPortionLabel: "1 clara (33g)" },
  { name: "Peito de frango grelhado", kcal: 159, protein: 32, carbs: 0, fat: 3.2, defaultPortionGrams: 150, defaultPortionLabel: "1 filé (150g)" },
  { name: "Coxa de frango sem pele", kcal: 161, protein: 26, carbs: 0, fat: 5.7, defaultPortionGrams: 120 },
  { name: "Carne moída magra", kcal: 192, protein: 26, carbs: 0, fat: 9, defaultPortionGrams: 120 },
  { name: "Patinho grelhado", kcal: 219, protein: 35, carbs: 0, fat: 8, defaultPortionGrams: 150 },
  { name: "Contrafilé grelhado", kcal: 241, protein: 32, carbs: 0, fat: 12, defaultPortionGrams: 150 },
  { name: "Salmão grelhado", kcal: 208, protein: 22, carbs: 0, fat: 13, defaultPortionGrams: 150 },
  { name: "Atum em água (lata)", kcal: 116, protein: 26, carbs: 0, fat: 1, defaultPortionGrams: 80, defaultPortionLabel: "1 lata (170g, drenada ~80g)" },
  { name: "Tilápia grelhada", kcal: 128, protein: 26, carbs: 0, fat: 2.6, defaultPortionGrams: 150 },
  { name: "Whey protein concentrado", kcal: 400, protein: 75, carbs: 8, fat: 6, defaultPortionGrams: 30, defaultPortionLabel: "1 scoop (30g)" },

  // ── Carboidratos ───────────────────────────────────────────
  { name: "Arroz branco cozido", kcal: 128, protein: 2.5, carbs: 28, fat: 0.2, fiber: 1.6, defaultPortionGrams: 100 },
  { name: "Arroz integral cozido", kcal: 124, protein: 2.6, carbs: 26, fat: 1, fiber: 2.7, defaultPortionGrams: 100 },
  { name: "Feijão preto cozido", kcal: 77, protein: 4.5, carbs: 14, fat: 0.5, fiber: 8.4, defaultPortionGrams: 100, defaultPortionLabel: "1 concha (100g)" },
  { name: "Batata-doce cozida", kcal: 76, protein: 1.6, carbs: 18, fat: 0.1, fiber: 2.2, defaultPortionGrams: 150 },
  { name: "Batata inglesa cozida", kcal: 52, protein: 1.2, carbs: 12, fat: 0, fiber: 1.3, defaultPortionGrams: 150 },
  { name: "Pão integral", kcal: 247, protein: 9.4, carbs: 44, fat: 3.7, fiber: 6, defaultPortionGrams: 50, defaultPortionLabel: "2 fatias (50g)" },
  { name: "Pão francês", kcal: 300, protein: 8, carbs: 58.6, fat: 3.1, defaultPortionGrams: 50, defaultPortionLabel: "1 unidade (50g)" },
  { name: "Aveia em flocos", kcal: 394, protein: 14, carbs: 67, fat: 8.5, fiber: 9.1, defaultPortionGrams: 30, defaultPortionLabel: "3 col. sopa (30g)" },
  { name: "Tapioca", kcal: 240, protein: 0.2, carbs: 59, fat: 0, defaultPortionGrams: 50 },
  { name: "Banana prata", kcal: 89, protein: 1.3, carbs: 23, fat: 0.1, fiber: 2, defaultPortionGrams: 100, defaultPortionLabel: "1 unidade (100g)" },
  { name: "Maçã", kcal: 56, protein: 0.3, carbs: 15, fat: 0, fiber: 1.3, defaultPortionGrams: 130, defaultPortionLabel: "1 unidade (130g)" },
  { name: "Mamão formosa", kcal: 45, protein: 0.8, carbs: 11, fat: 0.1, fiber: 1.8, defaultPortionGrams: 150 },
  { name: "Mel de abelha", kcal: 309, protein: 0.4, carbs: 84, fat: 0, defaultPortionGrams: 20, defaultPortionLabel: "1 col. sopa (20g)" },

  // ── Gorduras ───────────────────────────────────────────────
  { name: "Azeite de oliva extra virgem", kcal: 884, protein: 0, carbs: 0, fat: 100, defaultPortionGrams: 10, defaultPortionLabel: "1 col. sopa (10g)" },
  { name: "Abacate", kcal: 96, protein: 1.2, carbs: 6, fat: 8.4, fiber: 6.3, defaultPortionGrams: 100 },
  { name: "Castanha-do-pará", kcal: 643, protein: 14, carbs: 15, fat: 63, fiber: 7.9, defaultPortionGrams: 15, defaultPortionLabel: "3 unidades (15g)" },
  { name: "Amêndoa", kcal: 581, protein: 18, carbs: 30, fat: 47, fiber: 11.6, defaultPortionGrams: 20 },
  { name: "Pasta de amendoim integral", kcal: 590, protein: 24, carbs: 18, fat: 50, defaultPortionGrams: 15, defaultPortionLabel: "1 col. sopa (15g)" },

  // ── Lácteos ────────────────────────────────────────────────
  { name: "Leite integral", kcal: 58, protein: 2.9, carbs: 4.3, fat: 3.2, defaultPortionGrams: 200, defaultPortionLabel: "1 copo (200ml)" },
  { name: "Leite desnatado", kcal: 35, protein: 3.3, carbs: 4.9, fat: 0.1, defaultPortionGrams: 200 },
  { name: "Iogurte natural integral", kcal: 51, protein: 4.1, carbs: 1.9, fat: 3, defaultPortionGrams: 170, defaultPortionLabel: "1 pote (170g)" },
  { name: "Queijo cottage", kcal: 88, protein: 17, carbs: 3, fat: 1, defaultPortionGrams: 100 },
  { name: "Queijo minas frescal", kcal: 240, protein: 17, carbs: 3, fat: 18, defaultPortionGrams: 50 },
  { name: "Requeijão light", kcal: 175, protein: 11, carbs: 4, fat: 12, defaultPortionGrams: 15, defaultPortionLabel: "1 col. sopa (15g)" },

  // ── Vegetais ───────────────────────────────────────────────
  { name: "Brócolis cozido", kcal: 25, protein: 2.1, carbs: 4.4, fat: 0.4, fiber: 3.4, defaultPortionGrams: 100 },
  { name: "Alface", kcal: 11, protein: 1.4, carbs: 1.7, fat: 0.2, fiber: 2, defaultPortionGrams: 30 },
  { name: "Tomate", kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, defaultPortionGrams: 100 },
  { name: "Cenoura crua", kcal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, defaultPortionGrams: 80 },
  { name: "Espinafre refogado", kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, defaultPortionGrams: 80 },

  // ── Bebidas ────────────────────────────────────────────────
  { name: "Café puro (sem açúcar)", kcal: 2, protein: 0.1, carbs: 0, fat: 0, defaultPortionGrams: 100 },
  { name: "Chá verde", kcal: 1, protein: 0, carbs: 0, fat: 0, defaultPortionGrams: 200 },
];
