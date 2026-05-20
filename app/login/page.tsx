"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useToast } from "@/components/ui/Toast";
import { ensureDeviceId } from "@/lib/deviceId";
import { cn } from "@/lib/utils";

type Mode = "signIn" | "signUp";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const claim = useMutation(api.claims.claimDeviceProfile);
  const router = useRouter();
  const toast = useToast();

  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn("password", { email, password, flow: mode });
      const deviceId = ensureDeviceId();
      // Anexa/merge dados anônimos no profile do user
      const result = await claim({ deviceId });
      if (result.action === "merged") {
        toast.push("Dados locais mesclados com sua conta", "success");
      } else if (result.action === "attached") {
        toast.push("Seus dados foram conectados à conta", "success");
      } else if (mode === "signUp") {
        toast.push("Conta criada", "success");
      } else {
        toast.push("Bem-vindo de volta", "success");
      }
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao autenticar";
      setError(humanizeAuthError(message, mode));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ScreenHeader
        title={mode === "signIn" ? "Entrar" : "Criar conta"}
        subtitle="Sincronize entre dispositivos"
      />

      <Panel className="mb-4">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-[var(--radius)] bg-bg-elev p-1">
          {(["signIn", "signUp"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={cn(
                "rounded-[calc(var(--radius)-4px)] py-2 text-center font-sans text-xs tracking-wider uppercase transition-colors",
                mode === m
                  ? "bg-bg-card text-text shadow-[var(--shadow-sm)]"
                  : "text-text-dim hover:text-text",
              )}
            >
              {m === "signIn" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block font-sans text-[10px] tracking-[0.18em] text-text-mute uppercase">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-line bg-bg text-text placeholder:text-text-faint focus:border-brand/50 h-11 w-full rounded-[var(--radius)] border px-3 font-serif text-sm outline-none transition-colors"
              placeholder="seu@email.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-sans text-[10px] tracking-[0.18em] text-text-mute uppercase">
              Senha
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signUp" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-line bg-bg text-text placeholder:text-text-faint focus:border-brand/50 h-11 w-full rounded-[var(--radius)] border px-3 font-serif text-sm outline-none transition-colors"
              placeholder={mode === "signUp" ? "Mínimo 8 caracteres" : "••••••••"}
            />
          </label>

          {error && (
            <div className="border-danger/40 bg-danger/10 text-danger rounded-[var(--radius)] border px-3 py-2 font-sans text-xs">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" block disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === "signIn" ? "Entrar" : "Criar conta"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </Panel>

      <p className="text-text-mute text-center font-sans text-[11px]">
        Seus dados anônimos atuais ficam vinculados ao criar conta.
      </p>
    </>
  );
}

function humanizeAuthError(raw: string, mode: Mode): string {
  const lower = raw.toLowerCase();
  if (lower.includes("invalid") && lower.includes("password")) {
    return "Email ou senha incorretos.";
  }
  if (lower.includes("already exists") || lower.includes("uniqueness")) {
    return "Email já cadastrado. Use Entrar.";
  }
  if (lower.includes("password") && lower.includes("8")) {
    return "Senha deve ter no mínimo 8 caracteres.";
  }
  return mode === "signUp"
    ? "Não foi possível criar a conta. Tente novamente."
    : "Não foi possível entrar. Verifique os dados.";
}
