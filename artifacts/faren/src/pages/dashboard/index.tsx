import { useAuth } from "@/lib/auth";
import { useGetProfileAnalytics, useGetMyProfile } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Pencil,
  AtSign,
  Hash,
  Check,
  Circle,
  ArrowRight,
  UserPen,
  Sparkles,
  Settings as SettingsIcon,
  Smartphone,
  Monitor,
  Tablet,
  Globe2,
} from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: analytics, isLoading: analyticsLoading } = useGetProfileAnalytics({
    query: { enabled: isAuthenticated },
  });
  const { data: profile } = useGetMyProfile({ query: { enabled: isAuthenticated } });

  if (authLoading || !isAuthenticated) return null;

  const username = profile?.username || user?.username || "—";
  const uid = user?.id ?? "—";
  const totalViews = analytics?.totalViews ?? 0;
  const viewsThisWeek = analytics?.viewsThisWeek ?? 0;

  /* ── Profile completion ─────────────────────────────────── */
  const steps = useMemo(() => {
    const p: any = profile || {};
    return [
      { key: "avatar", label: "Enviar um avatar", done: !!p.avatarUrl },
      { key: "bio", label: "Adicionar uma descrição", done: !!(p.bio && p.bio.trim().length > 0) },
      { key: "discord", label: "Vincular conta do Discord", done: !!p.discordConnected },
      { key: "links", label: "Adicionar redes sociais", done: Array.isArray(p.links) && p.links.length > 0 },
      { key: "views", label: "Alcance 10 visualizações de perfil", done: totalViews >= 10 },
    ];
  }, [profile, totalViews]);
  const completionPct = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  /* ── Sparkline data (views per day) ─────────────────────── */
  const viewsByDay = analytics?.viewsByDay ?? [];
  const spark = useMemo(() => {
    if (!viewsByDay.length) return null;
    const w = 600;
    const h = 110;
    const maxV = Math.max(1, ...viewsByDay.map((d) => d.count));
    const stepX = viewsByDay.length > 1 ? w / (viewsByDay.length - 1) : 0;
    const points = viewsByDay.map((d, i) => {
      const x = i * stepX;
      const y = h - (d.count / maxV) * (h - 10) - 4;
      return [x, y] as const;
    });
    const path =
      "M " +
      points.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
    const area =
      `M 0 ${h} L ` +
      points.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") +
      ` L ${w} ${h} Z`;
    return { w, h, path, area };
  }, [viewsByDay]);

  return (
    <DashboardLayout active="overview">
      {/* ── Title ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-[0.04em] uppercase">Visão geral da conta</h1>
          <p className="mt-1 text-[10px] tracking-[0.25em] uppercase text-white/40 font-semibold">
            faren.com.br/{username}
          </p>
        </div>
      </div>

      {/* ── Top cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
        <OverviewCard
          icon={<UserPen className="w-3.5 h-3.5" />}
          label="Nome de usuário"
          value={username}
          subtitle="Alteração disponível agora"
        />
        <OverviewCard
          icon={<AtSign className="w-3.5 h-3.5" />}
          label="Aliases"
          value={<span className="text-white/40">0 Aliases</span>}
          subtitle="0 slots de alias restantes"
        />
        <OverviewCard
          icon={<Hash className="w-3.5 h-3.5" />}
          label="UID"
          value={String(uid)}
          subtitle="Entre os primeiros usuários"
        />
        <OverviewCard
          icon={<Eye className="w-3.5 h-3.5" />}
          label="Visualizações do perfil"
          value={analyticsLoading ? <Skeleton className="h-7 w-16 bg-white/5" /> : totalViews.toLocaleString()}
          subtitle={`+${viewsThisWeek} visualizações nos últimos 7 dias`}
        />
      </div>

      {/* ── Middle: completion + manage account ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <div className="lg:col-span-2 border border-white/10 p-5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">Conclusão do perfil</h2>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white">{completionPct}% concluído</span>
          </div>
          <div className="h-1.5 bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-white"
            />
          </div>

          {completionPct < 100 && (
            <p className="mt-4 text-[11px] tracking-[0.18em] uppercase text-white/50 font-semibold">
              Seu perfil ainda não está completo
            </p>
          )}
          <p className="text-[11px] text-white/40 mt-1">
            Complete seu perfil para deixá-lo mais visível e atrativo.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {steps.map((s) => (
              <Link
                key={s.key}
                href="/dashboard/edit"
                className={`flex items-center gap-3 px-3 py-2 border transition-colors ${
                  s.done
                    ? "border-white/15 bg-white/[0.04] text-white"
                    : "border-white/10 hover:border-white/30 text-white/70 hover:text-white"
                }`}
              >
                {s.done ? (
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-white/40" />
                )}
                <span className="text-[12px] font-semibold tracking-[0.08em] uppercase">{s.label}</span>
                <ArrowRight className="w-3 h-3 ml-auto text-white/30" />
              </Link>
            ))}
          </div>
        </div>

        {/* Manage account */}
        <div className="border border-white/10 p-5 bg-white/[0.02] flex flex-col">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">Gerencie sua conta</h2>
          <p className="text-[11px] text-white/40 mt-1">Altere seu e-mail, nome de usuário e mais.</p>
          <div className="mt-4 flex flex-col gap-2">
            <ManageButton href="/dashboard/edit" icon={<UserPen className="w-3.5 h-3.5" />} label="Alterar nome de usuário" />
            <ManageButton href="/dashboard/edit" icon={<Pencil className="w-3.5 h-3.5" />} label="Alterar nome exibido" />
            <ManageButton href="/dashboard/edit" icon={<Sparkles className="w-3.5 h-3.5" />} label="Gerenciar aliases" />
            <ManageButton href="/dashboard/edit" icon={<SettingsIcon className="w-3.5 h-3.5" />} label="Configurações da conta" />
          </div>

          <div className="mt-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">Conexões</h3>
            <p className="text-[11px] text-white/40 mt-1">Vincule sua conta do Discord à Faren.</p>
            <div className="mt-3">
              {profile?.discordConnected ? (
                <div className="flex items-center justify-between px-3 py-2 border border-white/15 bg-white/[0.04]">
                  <span className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.08em] uppercase">
                    <SiDiscord className="w-4 h-4" />
                    Discord conectado
                  </span>
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <Link
                  href="/dashboard/edit"
                  className="flex items-center gap-2 px-3 py-2 border border-white/15 hover:border-white/40 text-[12px] font-semibold tracking-[0.08em] uppercase"
                >
                  <SiDiscord className="w-4 h-4" />
                  Vincular Discord
                  <ArrowRight className="w-3 h-3 ml-auto" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats: views chart + top countries ──────────────── */}
      <div id="stats" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-white/10 p-5 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
              Visualizações nos últimos 7 dias
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white">
              {viewsThisWeek.toLocaleString()}
            </span>
          </div>
          {analyticsLoading ? (
            <Skeleton className="h-32 w-full bg-white/5" />
          ) : spark && viewsByDay.length > 0 ? (
            <svg viewBox={`0 0 ${spark.w} ${spark.h}`} className="w-full h-32" preserveAspectRatio="none">
              <defs>
                <linearGradient id="vSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>
              <path d={spark.area} fill="url(#vSpark)" />
              <path d={spark.path} fill="none" stroke="white" strokeWidth={1.4} />
            </svg>
          ) : (
            <div className="h-32 flex items-center justify-center text-[11px] tracking-[0.2em] uppercase text-white/30">
              Sem dados ainda
            </div>
          )}
          <div className="mt-3 flex items-center justify-between text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold">
            <span className="flex items-center gap-1.5"><Smartphone className="w-3 h-3" /> Mobile</span>
            <span className="flex items-center gap-1.5"><Tablet className="w-3 h-3" /> Tablet</span>
            <span className="flex items-center gap-1.5"><Monitor className="w-3 h-3" /> Desktop</span>
          </div>
        </div>

        <div className="border border-white/10 p-5 bg-white/[0.02]">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70 mb-3">Principais países</h2>
          {analyticsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-9 bg-white/5" />
              ))}
            </div>
          ) : analytics?.topCountries && analytics.topCountries.length > 0 ? (
            <div className="space-y-2">
              {analytics.topCountries.slice(0, 5).map((c, i) => {
                const max = analytics.topCountries[0].count;
                const pct = Math.round((c.count / max) * 100);
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white/80">
                        <Globe2 className="w-3 h-3 text-white/30" /> {c.country || "Desconhecido"}
                      </span>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-semibold">
                        {c.count}
                      </span>
                    </div>
                    <div className="h-px bg-white/5">
                      <div className="h-full bg-white/60" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-[10px] tracking-[0.22em] uppercase text-white/30 font-semibold">
                Sem dados de localização
              </p>
              <p className="text-[11px] text-white/40 mt-2">Compartilhe seu perfil para começar a coletar dados.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function OverviewCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="border border-white/10 p-5 bg-white/[0.02] flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">{label}</p>
        <span className="text-white/30">{icon}</span>
      </div>
      <div className="text-2xl md:text-3xl font-bold tracking-tight text-white">{value}</div>
      <p className="text-[10px] tracking-[0.18em] uppercase text-white/30 font-semibold">{subtitle}</p>
    </div>
  );
}

function ManageButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-3 py-2 border border-white/10 hover:border-white/30 hover:bg-white/[0.04] text-[12px] font-semibold tracking-[0.08em] uppercase text-white/80 hover:text-white transition-colors"
    >
      <span className="text-white/40 group-hover:text-white">{icon}</span>
      {label}
      <ArrowRight className="w-3 h-3 ml-auto text-white/30 group-hover:text-white" />
    </Link>
  );
}
