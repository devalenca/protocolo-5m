export type NavItem = {
  href: string;
  label: string;
  /** Icon as glyph (used in mobile tab bar) */
  glyph: string;
  /** Lucide icon name (used in desktop sidebar) */
  lucide:
    | "Home"
    | "CheckCircle2"
    | "Dumbbell"
    | "BookOpen"
    | "LineChart"
    | "Apple";
  match: (pathname: string) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Hoje",
    glyph: "⌂",
    lucide: "Home",
    match: (p) => p === "/",
  },
  {
    href: "/dieta",
    label: "Dieta",
    glyph: "◐",
    lucide: "Apple",
    match: (p) => p.startsWith("/dieta"),
  },
  {
    href: "/treino",
    label: "Treino",
    glyph: "⊿",
    lucide: "Dumbbell",
    match: (p) => p.startsWith("/treino"),
  },
  {
    href: "/corpo",
    label: "Corpo",
    glyph: "◌",
    lucide: "LineChart",
    match: (p) => p.startsWith("/corpo"),
  },
  {
    href: "/checklist",
    label: "Hábitos",
    glyph: "✓",
    lucide: "CheckCircle2",
    match: (p) => p.startsWith("/checklist"),
  },
  {
    href: "/protocolo",
    label: "Plano",
    glyph: "≡",
    lucide: "BookOpen",
    match: (p) => p.startsWith("/protocolo"),
  },
];
