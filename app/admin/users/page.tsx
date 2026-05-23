"use client";

import { useMutation, useQuery } from "convex/react";
import { Crown, Shield, ShieldOff, Sparkles, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { formatDateBR } from "@/lib/dates";
import { useDeviceId } from "@/lib/deviceId";
import { cn } from "@/lib/utils";

/* =================================================================
   /admin/users — lista todos os profiles do sistema
   ----------------------------------------------------------------
   Acesso restrito a profile.isAdmin=true.
   Não-admin é silenciosamente impedido (query do Convex lança erro,
   tratamos como acesso negado).
   ================================================================= */

const GOAL_LABEL: Record<string, string> = {
  cut: "Cutting",
  recomp: "Recomposição",
  maintain: "Manutenção",
  bulk: "Bulking",
};

export default function AdminUsersPage() {
  const deviceId = useDeviceId();
  const isAdmin = useQuery(
    api.admin.isAdmin,
    deviceId ? { deviceId } : "skip",
  );
  const bootstrap = useMutation(api.admin.bootstrapFirstAdmin);
  const setAdmin = useMutation(api.admin.setAdmin);

  // Bootstrap só roda se a UI confirma que NÃO há admin ainda.
  // Pra evitar prompts intrusivos, expomos um botão dedicado.
  const [bootstrapResult, setBootstrapResult] = useState<string | null>(null);

  const users = useQuery(
    api.admin.listAllUsers,
    isAdmin && deviceId ? { deviceId } : "skip",
  );

  const [filter, setFilter] = useState("");
  const filtered = useMemo(() => {
    if (!users) return [];
    const f = filter.trim().toLowerCase();
    if (!f) return users;
    return users.filter(
      (u) =>
        (u.displayName ?? "").toLowerCase().includes(f) ||
        (u.email ?? "").toLowerCase().includes(f),
    );
  }, [users, filter]);

  if (isAdmin === undefined) {
    return (
      <>
        <ScreenHeader title="Administração" subtitle="Carregando…" />
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <ScreenHeader title="Administração" subtitle="Acesso restrito" />
        <Panel>
          <div className="flex items-start gap-3">
            <ShieldOff className="text-text-mute mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
            <div className="min-w-0">
              <div className="font-serif text-base font-semibold">
                Sem permissão
              </div>
              <p className="text-text-dim mt-1 text-sm">
                Essa página só está disponível para administradores. Se você
                está configurando o sistema pela primeira vez, pode promover
                seu próprio profile abaixo.
              </p>
              <Button
                className="mt-3"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!deviceId) return;
                  const ok = await bootstrap({ deviceId });
                  setBootstrapResult(
                    ok
                      ? "Pronto. Recarregue a página."
                      : "Já existe um admin — fale com ele.",
                  );
                }}
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Tornar-me admin (somente se ainda não há admin)
              </Button>
              {bootstrapResult && (
                <div
                  aria-live="polite"
                  className="text-text mt-2 font-sans text-xs"
                >
                  {bootstrapResult}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </>
    );
  }

  return (
    <>
      <ScreenHeader
        title="Administração"
        subtitle={`${users?.length ?? 0} ${(users?.length ?? 0) === 1 ? "usuário" : "usuários"} no sistema`}
      />

      <Panel className="mb-3">
        <label htmlFor="admin-user-filter" className="sr-only">
          Buscar usuários
        </label>
        <input
          id="admin-user-filter"
          type="search"
          autoComplete="off"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por nome ou email…"
          className="border-line bg-bg text-text focus-visible:border-brand focus-visible:ring-brand/30 placeholder:text-text-faint h-11 w-full rounded-[var(--radius)] border px-3 font-sans text-sm outline-none transition-colors focus-visible:ring-2"
        />
      </Panel>

      <div className="space-y-2">
        {filtered.map((u) => (
          <UserCard
            key={u.profileId}
            user={u}
            onToggleAdmin={async () => {
              if (!deviceId) return;
              const next = !u.isAdmin;
              if (
                next === false &&
                !confirm(
                  `Remover privilégios de admin de ${u.displayName ?? u.email ?? "este usuário"}?`,
                )
              ) {
                return;
              }
              await setAdmin({
                deviceId,
                targetProfileId: u.profileId,
                isAdmin: next,
              });
            }}
          />
        ))}
        {filtered.length === 0 && (
          <Panel>
            <div className="text-text-dim py-4 text-center text-sm">
              {filter
                ? "Nenhum usuário corresponde ao filtro."
                : "Nenhum usuário ainda."}
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}

type UserRow = {
  profileId: Id<"profiles">;
  startDate: string;
  displayName?: string;
  email?: string;
  age?: number;
  sex?: string;
  goal?: string;
  heightCm?: number;
  onboardedAt?: number;
  isAdmin?: boolean;
  latestWeight?: number;
  latestWeightDate?: string;
  workoutsCount: number;
  hasUserId: boolean;
};

function UserCard({
  user,
  onToggleAdmin,
}: {
  user: UserRow;
  onToggleAdmin: () => void;
}) {
  const onboarded = user.onboardedAt != null;
  const goalLabel = user.goal ? GOAL_LABEL[user.goal] : "—";
  const initials =
    user.displayName?.[0]?.toUpperCase() ??
    user.email?.[0]?.toUpperCase() ??
    "?";
  return (
    <article className="border-line bg-bg-card rounded-[var(--radius-lg)] border p-4">
      <header className="flex items-start gap-3">
        <div
          aria-hidden
          className={cn(
            "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-serif text-base font-semibold",
            user.isAdmin
              ? "bg-brand/20 text-brand"
              : "bg-bg-elev text-text-dim",
          )}
        >
          {user.isAdmin ? <Crown className="h-5 w-5" aria-hidden /> : initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="font-serif text-base font-semibold leading-tight">
              {user.displayName ?? user.email ?? "Sem identidade"}
            </h3>
            {user.isAdmin && (
              <span className="border-brand/40 text-brand inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-sans text-[9px] tracking-[0.16em] uppercase">
                <Shield className="h-3 w-3" aria-hidden /> Admin
              </span>
            )}
            {!onboarded && (
              <span className="border-warning/40 text-warning rounded-full border px-2 py-0.5 font-sans text-[9px] tracking-[0.16em] uppercase">
                Sem onboarding
              </span>
            )}
            {!user.hasUserId && (
              <span className="border-line text-text-mute rounded-full border px-2 py-0.5 font-sans text-[9px] tracking-[0.16em] uppercase">
                Anônimo
              </span>
            )}
          </div>
          {user.email && (
            <div className="text-text-dim mt-0.5 truncate font-sans text-xs">
              {user.email}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleAdmin}
          aria-label={
            user.isAdmin ? "Remover admin" : "Promover a admin"
          }
        >
          <UserRound className="h-3.5 w-3.5" aria-hidden />
          {user.isAdmin ? "Tirar admin" : "Tornar admin"}
        </Button>
      </header>

      <dl className="border-line-faint mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t pt-3 font-sans text-xs sm:grid-cols-3">
        <DataRow label="Objetivo" value={goalLabel} />
        <DataRow
          label="Idade · sexo"
          value={
            user.age != null && user.sex
              ? `${user.age} · ${user.sex}`
              : "—"
          }
        />
        <DataRow
          label="Altura"
          value={user.heightCm != null ? `${user.heightCm} cm` : "—"}
        />
        <DataRow
          label="Peso atual"
          value={
            user.latestWeight != null
              ? `${user.latestWeight.toFixed(1)} kg`
              : "—"
          }
          sub={
            user.latestWeightDate
              ? `medido ${formatDateBR(user.latestWeightDate)}`
              : undefined
          }
        />
        <DataRow
          label="Treinos"
          value={String(user.workoutsCount)}
          sub={user.workoutsCount === 1 ? "registro" : "registros"}
        />
        <DataRow
          label="Onboardou em"
          value={
            user.onboardedAt
              ? new Date(user.onboardedAt).toLocaleDateString("pt-BR")
              : "—"
          }
          sub={`começou em ${formatDateBR(user.startDate)}`}
        />
      </dl>
    </article>
  );
}

function DataRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-text-mute font-sans text-[9px] tracking-[0.16em] uppercase">
        {label}
      </dt>
      <dd className="text-text font-serif text-sm tabular truncate">
        {value}
      </dd>
      {sub && (
        <dd className="text-text-mute mt-0.5 font-sans text-[10px]">{sub}</dd>
      )}
    </div>
  );
}
