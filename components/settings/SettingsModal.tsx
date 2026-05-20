"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import {
  CloudUpload,
  Database,
  LogOut,
  Trash2,
  UserPlus,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { CONVEX_ENABLED } from "@/components/providers/ConvexClientProvider";
import { ensureDeviceId } from "@/lib/deviceId";
import { loadData, resetData } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Configurações">
      <div className="space-y-5">
        {CONVEX_ENABLED ? <CloudSection onClose={onClose} /> : <LocalOnlySection />}
        <DangerSection onClose={onClose} />
      </div>
    </Modal>
  );
}

/* ============================================================
   Cloud mode (Convex habilitado)
   ============================================================ */

function CloudSection({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuthActions();
  const me = useQuery(api.profiles.me);
  const importMutation = useMutation(api.migrations.importLocalStorage);
  const toast = useToast();

  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    const blob = loadData();
    const hasData =
      Object.keys(blob.checklist).length > 0 ||
      blob.workouts.length > 0 ||
      blob.achievements.length > 0;
    if (!hasData) {
      toast.push("Nenhum dado local pra importar", "info");
      return;
    }
    setImporting(true);
    try {
      const deviceId = ensureDeviceId();
      const result = await importMutation({
        deviceId,
        blob: {
          checklist: blob.checklist,
          workouts: blob.workouts,
          achievements: blob.achievements,
          startDate: blob.startDate,
        },
      });
      toast.push(
        `${result.daysImported} dias, ${result.workoutsImported} treinos importados`,
        "success",
      );
    } catch {
      toast.push("Falha ao importar dados", "danger");
    } finally {
      setImporting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.push("Sessão encerrada", "info");
    onClose();
  };

  return (
    <>
      <Section title="Conta">
        {me === undefined ? (
          <SectionRow label="Carregando…" />
        ) : me ? (
          <>
            <SectionRow label="Logado como" value={me.email ?? "sem email"} />
            <Button variant="ghost" size="sm" onClick={handleSignOut} block>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </>
        ) : (
          <>
            <SectionRow
              label="Modo anônimo"
              value="Dados só neste dispositivo"
            />
            <Link href="/login" onClick={onClose} className="block">
              <Button variant="primary" size="sm" block>
                <UserPlus className="h-4 w-4" />
                Criar conta ou entrar
              </Button>
            </Link>
          </>
        )}
      </Section>

      <Section title="Sincronização">
        <p className="text-text-dim text-xs leading-relaxed">
          Importa o que estiver salvo no localStorage deste navegador
          (legado) pra sua conta na nuvem. Idempotente — pode rodar várias vezes.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleImport}
          disabled={importing}
          block
        >
          <CloudUpload className="h-4 w-4" />
          {importing ? "Importando…" : "Importar dados locais"}
        </Button>
      </Section>
    </>
  );
}

/* ============================================================
   Local-only mode (sem Convex)
   ============================================================ */

function LocalOnlySection() {
  return (
    <Section title="Modo local">
      <p className="text-text-dim text-xs leading-relaxed">
        Convex backend não configurado nesta build. Dados ficam só neste
        navegador. Para ativar sincronia entre dispositivos, defina{" "}
        <code className="font-mono text-[11px]">NEXT_PUBLIC_CONVEX_URL</code>{" "}
        e faça redeploy.
      </p>
    </Section>
  );
}

/* ============================================================
   Danger zone (sempre disponível)
   ============================================================ */

function DangerSection({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  const handleReset = () => {
    resetData();
    toast.push("Dados locais apagados", "info");
    setConfirming(false);
    onClose();
    if (typeof window !== "undefined") setTimeout(() => location.reload(), 500);
  };

  return (
    <Section title="Dados locais" tone="danger">
      <p className="text-text-dim text-xs leading-relaxed">
        Apaga o localStorage deste navegador. Não afeta sua conta na nuvem
        (se houver). Útil pra testar o fluxo do zero.
      </p>
      {!confirming ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(true)}
          block
        >
          <Database className="h-4 w-4" />
          Resetar dados locais
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} block>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" onClick={handleReset} block>
            <Trash2 className="h-4 w-4" />
            Confirmar
          </Button>
        </div>
      )}
    </Section>
  );
}

/* ============================================================
   Section
   ============================================================ */

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h4
        className={cn(
          "font-sans text-[10px] tracking-[0.18em] uppercase",
          tone === "danger" ? "text-danger" : "text-text-mute",
        )}
      >
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function SectionRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border-line-faint bg-bg-elev rounded-[var(--radius)] border px-3 py-2.5">
      <div className="text-text-mute font-sans text-[10px] tracking-[0.18em] uppercase">
        {label}
      </div>
      {value && (
        <div className="text-text mt-0.5 font-serif text-sm">{value}</div>
      )}
    </div>
  );
}
