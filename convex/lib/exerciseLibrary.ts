/* =================================================================
   Biblioteca de exercícios — PT-BR, classificados
   ----------------------------------------------------------------
   Padrão internacional de musculação (NSCA, ACSM):
   - primaryMuscle: alvo principal
   - equipment: barbell/dumbbell/cable/machine/bodyweight/kettlebell/cardio
   - type: peso_livre/maquinario/funcional/cardio/hiit
   - difficulty: facil (máquinas guiadas) · medio (halteres em pé) ·
     dificil (compound livre, exige técnica)
   - hasImpact: true se carrega articulações (corrida, salto, búlgaro)
   - isCompound: true se multi-articular (recruta vários grupos)
   ================================================================= */

export type ExerciseSeed = {
  name: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  equipment: string;
  type: string;
  difficulty: "facil" | "medio" | "dificil";
  hasImpact: boolean;
  isCompound: boolean;
  defaultSets: number;
  defaultRepsLow: number;
  defaultRepsHigh: number;
  defaultRest: number;
  useBar?: boolean;
  cue?: string;
};

export const EXERCISE_LIBRARY: ExerciseSeed[] = [
  // ── PEITO ──────────────────────────────────────────────────
  { name: "Supino reto barra", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "barbell", type: "peso_livre", difficulty: "dificil", hasImpact: false, isCompound: true, defaultSets: 4, defaultRepsLow: 6, defaultRepsHigh: 8, defaultRest: 150, useBar: true, cue: "Escápulas retraídas, barra desce no esterno" },
  { name: "Supino reto halteres", primaryMuscle: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "dumbbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 120 },
  { name: "Supino inclinado halteres", primaryMuscle: "chest", secondaryMuscles: ["shoulders"], equipment: "dumbbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 120, cue: "Inclinação 30-45° pra peitoral superior" },
  { name: "Supino máquina", primaryMuscle: "chest", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 75 },
  { name: "Crucifixo halteres", primaryMuscle: "chest", equipment: "dumbbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 60 },
  { name: "Crucifixo máquina (voador)", primaryMuscle: "chest", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60 },
  { name: "Crossover polia alta", primaryMuscle: "chest", equipment: "cable", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60 },
  { name: "Flexão de braço", primaryMuscle: "chest", secondaryMuscles: ["triceps", "core"], equipment: "bodyweight", type: "funcional", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 15, defaultRest: 60 },

  // ── COSTAS ─────────────────────────────────────────────────
  { name: "Barra fixa", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "bodyweight", type: "funcional", difficulty: "dificil", hasImpact: false, isCompound: true, defaultSets: 4, defaultRepsLow: 6, defaultRepsHigh: 10, defaultRest: 150, cue: "Puxa com cotovelo, não com mão" },
  { name: "Puxada alta pegada aberta", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 90 },
  { name: "Puxada baixa pegada neutra", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 90 },
  { name: "Remada curvada barra", primaryMuscle: "back", secondaryMuscles: ["biceps", "core"], equipment: "barbell", type: "peso_livre", difficulty: "dificil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 120, useBar: true, cue: "Costas neutras, puxa contra o quadril" },
  { name: "Remada cavalinho", primaryMuscle: "back", equipment: "machine", type: "maquinario", difficulty: "medio", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 90 },
  { name: "Remada serrote halter", primaryMuscle: "back", equipment: "dumbbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 75 },
  { name: "Pulldown pegada fechada", primaryMuscle: "back", secondaryMuscles: ["biceps"], equipment: "cable", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 75 },

  // ── OMBROS ─────────────────────────────────────────────────
  { name: "Desenvolvimento militar barra", primaryMuscle: "shoulders", secondaryMuscles: ["triceps"], equipment: "barbell", type: "peso_livre", difficulty: "dificil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 6, defaultRepsHigh: 8, defaultRest: 120, useBar: true },
  { name: "Desenvolvimento halteres sentado", primaryMuscle: "shoulders", equipment: "dumbbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 90 },
  { name: "Desenvolvimento máquina", primaryMuscle: "shoulders", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 75 },
  { name: "Elevação lateral halteres", primaryMuscle: "shoulders", equipment: "dumbbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60, cue: "Cotovelo um pouco flexionado, sobe até linha do ombro" },
  { name: "Elevação lateral cabo", primaryMuscle: "shoulders", equipment: "cable", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60 },
  { name: "Elevação frontal halteres", primaryMuscle: "shoulders", equipment: "dumbbell", type: "peso_livre", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 60 },
  { name: "Crucifixo invertido (peck deck)", primaryMuscle: "shoulders", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60 },
  { name: "Encolhimento halteres", primaryMuscle: "shoulders", equipment: "dumbbell", type: "peso_livre", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 60 },

  // ── BÍCEPS ─────────────────────────────────────────────────
  { name: "Rosca direta barra", primaryMuscle: "biceps", equipment: "barbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 60, useBar: true },
  { name: "Rosca alternada halteres", primaryMuscle: "biceps", equipment: "dumbbell", type: "peso_livre", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 60 },
  { name: "Rosca martelo", primaryMuscle: "biceps", equipment: "dumbbell", type: "peso_livre", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 60 },
  { name: "Rosca scott máquina", primaryMuscle: "biceps", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60 },
  { name: "Rosca cabo", primaryMuscle: "biceps", equipment: "cable", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60 },

  // ── TRÍCEPS ────────────────────────────────────────────────
  { name: "Tríceps testa barra W", primaryMuscle: "triceps", equipment: "barbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 60 },
  { name: "Tríceps corda", primaryMuscle: "triceps", equipment: "cable", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 60 },
  { name: "Tríceps francês halter", primaryMuscle: "triceps", equipment: "dumbbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 60 },
  { name: "Mergulho em paralelas", primaryMuscle: "triceps", secondaryMuscles: ["chest"], equipment: "bodyweight", type: "funcional", difficulty: "dificil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 90 },
  { name: "Tríceps coice cabo", primaryMuscle: "triceps", equipment: "cable", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 45 },

  // ── QUADRÍCEPS ─────────────────────────────────────────────
  { name: "Agachamento livre", primaryMuscle: "quads", secondaryMuscles: ["glutes", "core"], equipment: "barbell", type: "peso_livre", difficulty: "dificil", hasImpact: false, isCompound: true, defaultSets: 4, defaultRepsLow: 6, defaultRepsHigh: 8, defaultRest: 180, useBar: true, cue: "Peito aberto, desce até paralelo ou abaixo" },
  { name: "Leg press 45°", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "machine", type: "maquinario", difficulty: "medio", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 120 },
  { name: "Hack squat máquina", primaryMuscle: "quads", equipment: "machine", type: "maquinario", difficulty: "medio", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 120 },
  { name: "Cadeira extensora", primaryMuscle: "quads", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 75 },
  { name: "Avanço com halteres", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "dumbbell", type: "peso_livre", difficulty: "medio", hasImpact: true, isCompound: true, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 90 },
  { name: "Búlgaro com halteres", primaryMuscle: "quads", secondaryMuscles: ["glutes"], equipment: "dumbbell", type: "peso_livre", difficulty: "dificil", hasImpact: true, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 120, cue: "Pé traseiro elevado, joelho da frente sobre o pé" },
  { name: "Agachamento goblet", primaryMuscle: "quads", secondaryMuscles: ["glutes", "core"], equipment: "dumbbell", type: "funcional", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 15, defaultRest: 75 },

  // ── HAMSTRINGS / GLÚTEO ───────────────────────────────────
  { name: "Levantamento terra romeno", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes", "back"], equipment: "barbell", type: "peso_livre", difficulty: "dificil", hasImpact: false, isCompound: true, defaultSets: 4, defaultRepsLow: 5, defaultRepsHigh: 6, defaultRest: 180, useBar: true, cue: "Quadril pra trás, costas neutras, sente o estiramento" },
  { name: "Stiff com barra", primaryMuscle: "hamstrings", secondaryMuscles: ["glutes"], equipment: "barbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 120, useBar: true },
  { name: "Mesa flexora", primaryMuscle: "hamstrings", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 75 },
  { name: "Cadeira flexora em pé", primaryMuscle: "hamstrings", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 10, defaultRepsHigh: 12, defaultRest: 60 },
  { name: "Elevação pélvica (hip thrust)", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings"], equipment: "barbell", type: "peso_livre", difficulty: "medio", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 8, defaultRepsHigh: 10, defaultRest: 90, useBar: true },
  { name: "Glúteo na máquina", primaryMuscle: "glutes", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60 },
  { name: "Cadeira abdutora", primaryMuscle: "glutes", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60 },

  // ── PANTURRILHA ────────────────────────────────────────────
  { name: "Panturrilha em pé máquina", primaryMuscle: "calves", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60 },
  { name: "Panturrilha sentado", primaryMuscle: "calves", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 15, defaultRepsHigh: 20, defaultRest: 45 },

  // ── CORE ───────────────────────────────────────────────────
  { name: "Prancha", primaryMuscle: "core", equipment: "bodyweight", type: "funcional", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 3, defaultRepsLow: 30, defaultRepsHigh: 60, defaultRest: 45, cue: "Linha reta do calcanhar à cabeça" },
  { name: "Abdominal infra", primaryMuscle: "core", equipment: "bodyweight", type: "funcional", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 15, defaultRepsHigh: 20, defaultRest: 45 },
  { name: "Crunch máquina", primaryMuscle: "core", equipment: "machine", type: "maquinario", difficulty: "facil", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 12, defaultRepsHigh: 15, defaultRest: 60 },
  { name: "Russian twist com peso", primaryMuscle: "core", equipment: "dumbbell", type: "funcional", difficulty: "medio", hasImpact: false, isCompound: false, defaultSets: 3, defaultRepsLow: 20, defaultRepsHigh: 30, defaultRest: 45 },

  // ── CARDIO ─────────────────────────────────────────────────
  { name: "Corrida na esteira", primaryMuscle: "full_body", equipment: "cardio", type: "cardio", difficulty: "facil", hasImpact: true, isCompound: true, defaultSets: 1, defaultRepsLow: 20, defaultRepsHigh: 30, defaultRest: 0, cue: "Reps = minutos. Ritmo de conversa." },
  { name: "Bike ergométrica", primaryMuscle: "full_body", equipment: "cardio", type: "cardio", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 1, defaultRepsLow: 20, defaultRepsHigh: 40, defaultRest: 0 },
  { name: "Elíptico", primaryMuscle: "full_body", equipment: "cardio", type: "cardio", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 1, defaultRepsLow: 20, defaultRepsHigh: 40, defaultRest: 0 },
  { name: "Caminhada inclinada", primaryMuscle: "full_body", equipment: "cardio", type: "cardio", difficulty: "facil", hasImpact: false, isCompound: true, defaultSets: 1, defaultRepsLow: 30, defaultRepsHigh: 45, defaultRest: 0, cue: "Inclinação 8-12%, 5-6 km/h" },

  // ── HIIT ───────────────────────────────────────────────────
  { name: "Burpees", primaryMuscle: "full_body", equipment: "bodyweight", type: "hiit", difficulty: "dificil", hasImpact: true, isCompound: true, defaultSets: 4, defaultRepsLow: 30, defaultRepsHigh: 45, defaultRest: 30, cue: "Reps = segundos. 30s on, 30s off." },
  { name: "Mountain climber", primaryMuscle: "core", secondaryMuscles: ["full_body"], equipment: "bodyweight", type: "hiit", difficulty: "medio", hasImpact: true, isCompound: true, defaultSets: 4, defaultRepsLow: 30, defaultRepsHigh: 45, defaultRest: 30 },
  { name: "Jump rope (pular corda)", primaryMuscle: "full_body", equipment: "cardio", type: "hiit", difficulty: "medio", hasImpact: true, isCompound: true, defaultSets: 5, defaultRepsLow: 60, defaultRepsHigh: 90, defaultRest: 30 },
  { name: "Kettlebell swing", primaryMuscle: "glutes", secondaryMuscles: ["hamstrings", "core"], equipment: "kettlebell", type: "funcional", difficulty: "medio", hasImpact: false, isCompound: true, defaultSets: 4, defaultRepsLow: 15, defaultRepsHigh: 20, defaultRest: 60, cue: "Quadril propulsiona, não os braços" },
];
