/* =================================================================
   Theme types e constantes — compartilhados entre script inline e
   provider client. Fonte única de verdade pra evitar drift.
   ================================================================= */

export const THEME_STORAGE_KEY = "protocolo-theme";

export type ThemePref = "light" | "dark" | "system";
export type Resolved = "light" | "dark";

export const DEFAULT_THEME: ThemePref = "dark";

/** Script inline injetado no <head> antes da hidratação pra evitar FOUC.
 *  Lê localStorage, aplica `.dark` no <html>, deixa React assumir. */
export function buildThemeScript(): string {
  // mantém minificado — vai ser exatamente o que será emitido no HTML
  return `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k)||'${DEFAULT_THEME}';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;var c=document.documentElement.classList;c.toggle('dark',r==='dark');c.toggle('light',r==='light');document.documentElement.style.colorScheme=r;}catch(e){}})();`;
}
