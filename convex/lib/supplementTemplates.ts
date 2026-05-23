/* =================================================================
   Suplementação por objetivo — protocolo 5M
   ----------------------------------------------------------------
   Templates conservadores, evidence-based. Suplementos com benefício
   comprovado pra atletas naturais. Evita ergogênicos sem evidência
   (BCAA isolado, glutamina, testo boosters, etc.).
   ================================================================= */

export type SupplementSeed = {
  suppId: string;
  name: string;
  dose: string;
  timing: string;
  why?: string;
  priority: "essencial" | "recomendado" | "opcional";
};

/* Itens comuns a todos os objetivos. */
const BASE: SupplementSeed[] = [
  {
    suppId: "creatina",
    name: "Creatina monohidratada",
    dose: "5g",
    timing: "Qualquer horário · todo dia",
    why: "Aumenta força, volume, e ATP — único suplemento universal com evidência sólida",
    priority: "essencial",
  },
  {
    suppId: "vitamina_d3",
    name: "Vitamina D3",
    dose: "2.000–4.000 UI",
    timing: "Manhã com refeição que tenha gordura",
    why: "Quase todo brasileiro tem deficiência. Hormonal + imune + osso",
    priority: "essencial",
  },
  {
    suppId: "omega3",
    name: "Ômega 3 (EPA + DHA)",
    dose: "2g EPA+DHA",
    timing: "Almoço",
    why: "Anti-inflamatório sistêmico, saúde cardiovascular, recuperação muscular",
    priority: "essencial",
  },
  {
    suppId: "magnesio",
    name: "Magnésio bisglicinato",
    dose: "400mg",
    timing: "30min antes de dormir",
    why: "Qualidade do sono, recuperação neuromuscular, deficiência comum",
    priority: "recomendado",
  },
];

const PROTEIN_2X: SupplementSeed = {
  suppId: "whey",
  name: "Whey protein concentrado",
  dose: "30g",
  timing: "Pós-treino + 1× ao longo do dia (se não bater proteína)",
  why: "Praticidade pra atingir 1.6-2.2g/kg de proteína",
  priority: "essencial",
};

const PROTEIN_POS: SupplementSeed = {
  suppId: "whey",
  name: "Whey protein concentrado",
  dose: "30g",
  timing: "Pós-treino",
  why: "Praticidade pra fechar a proteína do dia",
  priority: "recomendado",
};

/* Específicos por objetivo */
export const SUPPLEMENT_TEMPLATES: Record<
  "cut" | "recomp" | "maintain" | "bulk",
  SupplementSeed[]
> = {
  cut: [
    ...BASE,
    PROTEIN_2X,
    {
      suppId: "cafeina",
      name: "Cafeína",
      dose: "150–200mg",
      timing: "Pré-treino · nunca depois das 14h",
      why: "Aumenta performance e gasto energético. Cuidado com sono.",
      priority: "recomendado",
    },
    {
      suppId: "multivitaminico",
      name: "Multivitamínico",
      dose: "1 cápsula",
      timing: "Manhã com café",
      why: "Compensa déficit calórico — micros tendem a faltar em cut",
      priority: "recomendado",
    },
    {
      suppId: "fibra",
      name: "Psyllium ou fibra solúvel",
      dose: "5–10g",
      timing: "Junto da maior refeição",
      why: "Saciedade + saúde intestinal em déficit",
      priority: "opcional",
    },
  ],

  recomp: [
    ...BASE,
    PROTEIN_2X,
    {
      suppId: "zinco",
      name: "Zinco quelato",
      dose: "15mg",
      timing: "Junto com jantar",
      why: "Suporte hormonal (testosterona), imunidade",
      priority: "recomendado",
    },
    {
      suppId: "ashwagandha",
      name: "Ashwagandha KSM-66",
      dose: "600mg",
      timing: "Manhã ou noite · 12 semanas on / 4 off",
      why: "Reduz cortisol, melhora sono e composição corporal",
      priority: "opcional",
    },
    {
      suppId: "beta_alanina",
      name: "Beta-alanina",
      dose: "3–5g",
      timing: "Dividido ao longo do dia · evita formigamento",
      why: "Endurance muscular (8-15 reps). Útil em treino de hipertrofia.",
      priority: "opcional",
    },
  ],

  maintain: [
    ...BASE,
    PROTEIN_POS,
    {
      suppId: "zinco",
      name: "Zinco quelato",
      dose: "15mg",
      timing: "Junto com jantar",
      why: "Suporte hormonal e imune",
      priority: "opcional",
    },
  ],

  bulk: [
    ...BASE,
    PROTEIN_2X,
    {
      suppId: "creatina_loading",
      name: "Carb pós-treino (dextrose ou waxy maize)",
      dose: "30–50g",
      timing: "Junto com whey pós-treino",
      why: "Ajuda a fechar superávit calórico, repõe glicogênio",
      priority: "opcional",
    },
    {
      suppId: "zinco",
      name: "Zinco quelato",
      dose: "15mg",
      timing: "Junto com jantar",
      why: "Suporte hormonal anabólico",
      priority: "recomendado",
    },
    {
      suppId: "beta_alanina",
      name: "Beta-alanina",
      dose: "3–5g",
      timing: "Dividido ao longo do dia",
      why: "Endurance muscular pra séries longas",
      priority: "opcional",
    },
  ],
};
