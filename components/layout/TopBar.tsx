import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { SettingsButton } from "./SettingsButton";

export function TopBar() {
  return (
    <header
      className="border-line-faint bg-bg/80 fixed top-0 right-0 left-0 z-40 border-b backdrop-blur-md lg:hidden"
      style={{
        paddingTop: "var(--safe-top)",
        paddingLeft: "calc(var(--safe-left) + 16px)",
        paddingRight: "calc(var(--safe-right) + 16px)",
      }}
    >
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="border-brand/40 bg-brand/10 text-brand flex h-9 w-9 items-center justify-center rounded-xl border font-serif text-sm font-semibold">
            5M
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-base font-semibold">Protocolo</span>
            <span className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
              Recomposição
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeTogglerButton
            variant="outline"
            size="default"
            aria-label="Alternar tema"
          />
          <SettingsButton />
        </div>
      </div>
    </header>
  );
}
