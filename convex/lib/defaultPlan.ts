/* =================================================================
   Default 5M Plan — usado pra seed novos profiles
   ----------------------------------------------------------------
   Espelho dos defaults definidos em lib/constants.ts e lib/diet.ts.
   Mantemos uma cópia server-side porque os arquivos do convex/
   não importam do bundle client (lib/) — Convex isola runtimes.
   Se mudar o default, atualize aqui também.
   ================================================================= */

export const DEFAULT_DIET_GOALS = {
  kcal: 2350,
  protein: 170,
  carbs: 245,
  fat: 70,
};

export const DEFAULT_MEAL_SLOTS = [
  { id: "cafe", label: "Café da manhã", time: "06:30", hint: "primeira refeição" },
  { id: "lanche_manha", label: "Lanche da manhã", time: "10:00", hint: "snack proteico" },
  { id: "almoco", label: "Almoço", time: "12:30", hint: "refeição principal" },
  { id: "pre_treino", label: "Pré-treino", time: "16:30", hint: "energia rápida" },
  { id: "jantar", label: "Jantar", time: "21:00", hint: "refeição da noite" },
  { id: "pre_sono", label: "Pré-sono", time: "22:00", hint: "leve, calmante" },
];

export const DEFAULT_HABIT_ITEMS = [
  { itemId: "agua", text: "3 litros de água", sub: "distribuídos ao longo do dia" },
  { itemId: "proteina", text: "170g de proteína", sub: "some as proteínas de cada refeição" },
  { itemId: "cafe", text: "Café da manhã feito", sub: "não pular sob hipótese alguma" },
  { itemId: "creatina", text: "Creatina 5g", sub: "qualquer horário" },
  { itemId: "d3-omega", text: "Vitamina D3 + Ômega 3", sub: "junto com almoço" },
  { itemId: "zinco", text: "Zinco", sub: "junto com jantar" },
  { itemId: "ashwa", text: "Ashwagandha", sub: "com qualquer refeição" },
  { itemId: "mag", text: "Magnésio bisglicinato 400mg", sub: "antes de dormir" },
  { itemId: "treino", text: "Treino feito (ou caminhada)", sub: "anotou cargas?" },
  { itemId: "sem-tela", text: "Sem tela 30min antes de dormir", sub: "modo noturno mínimo" },
  { itemId: "dormir-cedo", text: "Deitou até 22h30", sub: "meta de 7h+ de sono" },
  { itemId: "zero-cafe-tarde", text: "Zero cafeína depois das 14h", sub: "inclui chá preto, refri" },
];

type DefaultExercise = {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  useBar?: boolean;
};

type DefaultTemplate = {
  templateId: string;
  name: string;
  day: string;
  focus: string;
  order: number;
  exercises: DefaultExercise[];
};

export const DEFAULT_WORKOUT_TEMPLATES: DefaultTemplate[] = [
  {
    templateId: "upperA",
    name: "Upper A · Push",
    day: "Dia 1 · ~40 min",
    focus: "Peito · Ombros · Tríceps",
    order: 1,
    exercises: [
      { name: "Supino reto barra", sets: 4, reps: "6-8", rest: 150, useBar: true },
      { name: "Supino inclinado halteres", sets: 3, reps: "8-10", rest: 120 },
      { name: "Desenvolvimento militar barra", sets: 3, reps: "8-10", rest: 120, useBar: true },
      { name: "Elevação lateral halteres", sets: 3, reps: "12-15", rest: 60 },
      { name: "Tríceps corda", sets: 3, reps: "10-12", rest: 60 },
    ],
  },
  {
    templateId: "lowerA",
    name: "Lower A · Quad",
    day: "Dia 2 · ~40 min",
    focus: "Quadríceps · Panturrilha · Core",
    order: 2,
    exercises: [
      { name: "Agachamento livre", sets: 4, reps: "6-8", rest: 180, useBar: true },
      { name: "Leg press 45°", sets: 3, reps: "10-12", rest: 120 },
      { name: "Cadeira extensora", sets: 3, reps: "12-15", rest: 75 },
      { name: "Panturrilha em pé", sets: 3, reps: "12-15", rest: 60 },
      { name: "Prancha", sets: 3, reps: "30-60s", rest: 45 },
    ],
  },
  {
    templateId: "upperB",
    name: "Upper B · Pull",
    day: "Dia 4 · ~40 min",
    focus: "Costas · Bíceps · Ombro posterior",
    order: 3,
    exercises: [
      { name: "Barra fixa (ou puxada)", sets: 4, reps: "6-10", rest: 150 },
      { name: "Remada curvada barra", sets: 3, reps: "8-10", rest: 120, useBar: true },
      { name: "Puxada baixa pegada neutra", sets: 3, reps: "10-12", rest: 90 },
      { name: "Rosca direta barra", sets: 3, reps: "10-12", rest: 60, useBar: true },
      { name: "Rosca martelo", sets: 3, reps: "10-12", rest: 60 },
    ],
  },
  {
    templateId: "lowerB",
    name: "Lower B · Hinge",
    day: "Dia 5 · ~40 min",
    focus: "Posterior · Glúteo · Panturrilha",
    order: 4,
    exercises: [
      { name: "Levantamento terra romeno", sets: 4, reps: "5-6", rest: 180, useBar: true },
      { name: "Búlgaro com halteres", sets: 3, reps: "8-10 cada", rest: 120 },
      { name: "Mesa flexora", sets: 3, reps: "10-12", rest: 75 },
      { name: "Elevação pélvica (hip thrust)", sets: 3, reps: "8-10", rest: 90, useBar: true },
      { name: "Panturrilha sentado", sets: 3, reps: "15-20", rest: 45 },
    ],
  },
];
