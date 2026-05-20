import type { Achievement, ChecklistItem, WorkoutTemplate } from "./types";
import { countTotalPRs, getStreakFromData, hasPerfectDay } from "./domain";
import { daysBetween, todayStr } from "./dates";

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "agua", text: "3 litros de água", sub: "distribuídos ao longo do dia" },
  { id: "proteina", text: "170g de proteína", sub: "some as proteínas de cada refeição" },
  { id: "cafe", text: "Café da manhã feito", sub: "não pular sob hipótese alguma" },
  { id: "creatina", text: "Creatina 5g", sub: "qualquer horário" },
  { id: "d3-omega", text: "Vitamina D3 + Ômega 3", sub: "junto com almoço" },
  { id: "zinco", text: "Zinco", sub: "junto com jantar" },
  { id: "ashwa", text: "Ashwagandha", sub: "com qualquer refeição" },
  { id: "mag", text: "Magnésio bisglicinato 400mg", sub: "antes de dormir" },
  { id: "treino", text: "Treino feito (ou caminhada)", sub: "anotou cargas?" },
  { id: "sem-tela", text: "Sem tela 30min antes de dormir", sub: "modo noturno mínimo" },
  { id: "dormir-cedo", text: "Deitou até 22h30", sub: "meta de 7h+ de sono" },
  { id: "zero-cafe-tarde", text: "Zero cafeína depois das 14h", sub: "inclui chá preto, refri" },
];

export const WORKOUTS: Record<string, WorkoutTemplate> = {
  upperA: {
    id: "upperA",
    name: "Upper A",
    day: "Segunda · Treino 1",
    focus: "Peito · Tríceps · Costas (puxada)",
    order: 1,
    exercises: [
      { name: "Supino reto barra", sets: 4, reps: "6-8", rest: 150, useBar: true },
      { name: "Remada curvada barra", sets: 4, reps: "6-8", rest: 150, useBar: true },
      { name: "Supino inclinado halteres", sets: 3, reps: "8-10", rest: 90 },
      { name: "Puxada alta pegada aberta", sets: 3, reps: "8-10", rest: 90 },
      { name: "Desenvolvimento militar", sets: 3, reps: "8-10", rest: 90, useBar: true },
      { name: "Tríceps testa", sets: 3, reps: "10-12", rest: 60 },
      { name: "Rosca direta barra", sets: 3, reps: "10-12", rest: 60, useBar: true },
    ],
  },
  lowerA: {
    id: "lowerA",
    name: "Lower A",
    day: "Terça · Treino 2",
    focus: "Quadríceps · Panturrilha · Core",
    order: 2,
    exercises: [
      { name: "Agachamento livre", sets: 4, reps: "6-8", rest: 180, useBar: true },
      { name: "Leg press 45°", sets: 4, reps: "10-12", rest: 120 },
      { name: "Cadeira extensora", sets: 3, reps: "12-15", rest: 90 },
      { name: "Mesa flexora", sets: 3, reps: "10-12", rest: 90 },
      { name: "Panturrilha em pé", sets: 4, reps: "12-15", rest: 60 },
      { name: "Abdominal infra", sets: 3, reps: "15-20", rest: 45 },
      { name: "Prancha", sets: 3, reps: "30-60s", rest: 45 },
    ],
  },
  upperB: {
    id: "upperB",
    name: "Upper B",
    day: "Quinta · Treino 3",
    focus: "Costas (largura) · Ombros · Bíceps",
    order: 3,
    exercises: [
      { name: "Barra fixa (ou puxada)", sets: 4, reps: "até falha", rest: 120 },
      { name: "Supino reto halteres", sets: 4, reps: "8-10", rest: 120 },
      { name: "Remada cavalinho ou serrote", sets: 3, reps: "8-10", rest: 90 },
      { name: "Crucifixo máquina (voador)", sets: 3, reps: "10-12", rest: 60 },
      { name: "Elevação lateral halteres", sets: 4, reps: "12-15", rest: 60 },
      { name: "Rosca martelo", sets: 3, reps: "10-12", rest: 60 },
      { name: "Tríceps corda", sets: 3, reps: "10-12", rest: 60 },
    ],
  },
  lowerB: {
    id: "lowerB",
    name: "Lower B",
    day: "Sexta · Treino 4",
    focus: "Posterior · Glúteo · Panturrilha",
    order: 4,
    exercises: [
      { name: "Levantamento terra romeno", sets: 4, reps: "5-6", rest: 180, useBar: true },
      { name: "Afundo halteres (búlgaro)", sets: 3, reps: "10 cada", rest: 120 },
      { name: "Stiff barra", sets: 3, reps: "8-10", rest: 120, useBar: true },
      { name: "Cadeira abdutora", sets: 3, reps: "12-15", rest: 60 },
      { name: "Panturrilha sentado", sets: 4, reps: "15-20", rest: 45 },
      { name: "Abdominal supra com carga", sets: 3, reps: "12-15", rest: 45 },
    ],
  },
};

export const WORKOUT_ORDER = ["upperA", "lowerA", "upperB", "lowerB"] as const;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_check",
    icon: "⭐",
    name: "Primeiro check",
    desc: "Marcou seu primeiro item do checklist",
    test: (d) => Object.keys(d.checklist).length >= 1,
  },
  {
    id: "first_workout",
    icon: "💪",
    name: "Primeiro treino",
    desc: "Registrou seu primeiro treino",
    test: (d) => d.workouts.length >= 1,
  },
  {
    id: "first_pr",
    icon: "🏆",
    name: "Primeiro PR",
    desc: "Bateu um recorde pessoal",
    test: (d) => countTotalPRs(d) >= 1,
  },
  {
    id: "streak_3",
    icon: "🔥",
    name: "3 dias",
    desc: "3 dias consecutivos",
    test: (d) => getStreakFromData(d) >= 3,
  },
  {
    id: "streak_7",
    icon: "🌟",
    name: "Uma semana",
    desc: "7 dias consecutivos",
    test: (d) => getStreakFromData(d) >= 7,
  },
  {
    id: "streak_14",
    icon: "💎",
    name: "Duas semanas",
    desc: "14 dias consecutivos",
    test: (d) => getStreakFromData(d) >= 14,
  },
  {
    id: "streak_30",
    icon: "👑",
    name: "Um mês",
    desc: "30 dias consecutivos",
    test: (d) => getStreakFromData(d) >= 30,
  },
  {
    id: "workouts_10",
    icon: "🎯",
    name: "10 treinos",
    desc: "10 treinos registrados",
    test: (d) => d.workouts.length >= 10,
  },
  {
    id: "workouts_25",
    icon: "⚡",
    name: "25 treinos",
    desc: "25 treinos registrados",
    test: (d) => d.workouts.length >= 25,
  },
  {
    id: "workouts_50",
    icon: "🚀",
    name: "50 treinos",
    desc: "Metade do caminho",
    test: (d) => d.workouts.length >= 50,
  },
  {
    id: "perfect_day",
    icon: "✨",
    name: "Dia perfeito",
    desc: "Completou 100% do checklist",
    test: (d) => hasPerfectDay(d),
  },
  {
    id: "protocol_complete",
    icon: "🏅",
    name: "5 meses",
    desc: "Completou o protocolo",
    test: (d) => daysBetween(d.startDate, todayStr()) >= 150,
  },
];

export const PROTOCOL_DAYS = 150;
