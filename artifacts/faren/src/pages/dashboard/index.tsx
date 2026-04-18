import { useAuth } from "@/lib/auth";
import { useGetProfileAnalytics, useGetMyProfile, useUpdateProfile } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, Settings, LogOut, Eye, Users, Heart, MousePointerClick, ArrowRight, TrendingUp, Globe, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ─── Opções de fundo do dashboard ───────────────────────────── */
const BG_OPTIONS = [
  {
    id: 'black',
    label: 'Preto',
    value: '#000000',
    emoji: 'https://cdn.discordapp.com/emojis/1488985739755786422.webp?size=22&animated=true',
    gradient: false,
  },
  {
    id: 'white',
    label: 'Branco',
    value: '#ffffff',
    emoji: 'https://cdn.discordapp.com/emojis/1482872769350860840.webp?size=22&animated=true',
    gradient: false,
  },
  {
    id: 'rosa',
    label: 'Rosa Claro',
    value: 'gradient:rosa',
    emoji: 'https://cdn.discordapp.com/emojis/1483022927782739978.webp?size=22&animated=true',
    gradient: true,
  },
];

/* ─── Helpers ─────────────────────────────────────────────────── */
function parseStoredBg(val: string | null | undefined): { bgId: string } {
  if (!val) return { bgId: 'black' };
  if (val === 'gradient:rosa') return { bgId: 'rosa' };
  if (val === '#ffffff') return { bgId: 'white' };
  return { bgId: 'black' };
}

function getBgStyle(bgId: string): React.CSSProperties {
  if (bgId === 'rosa') {
    return { background: 'linear-gradient(to bottom, #ffffff, #ff0055)' };
  }
  if (bgId === 'white') {
    return { backgroundColor: '#ffffff' };
  }
  return { backgroundColor: '#000000' };
}

function getTextColor(bgId: string): string {
  return bgId === 'white' ? '#000000' : '#ffffff';
}

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgId, setBgId] = useState('black');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: analytics, isLoading: analyticsLoading } = useGetProfileAnalytics({
    query: { queryKey: [] as any, enabled: isAuthenticated },
  });

  const { data: profile } = useGetMyProfile({
    query: { queryKey: [] as any, enabled: isAuthenticated },
  });

  const updateProfile = useUpdateProfile();

  useEffect(() => {
    const stored = (profile as any)?.dashboardBgColor;
    const { bgId: id } = parseStoredBg(stored);
    setBgId(id);
  }, [(profile as any)?.dashboardBgColor]);

  if (authLoading || !isAuthenticated) return null;

  const profileUsername = profile?.username || user?.username || "";
  const profileSiteUrl = profileUsername ? `https://faren.com.br/${profileUsername}` : null;

  const copyProfileLink = () => {
    if (!profileUsername) { toast({ title: "Perfil carregando", description: "Aguarde alguns segundos e tente novamente." }); return; }
    const url = `https://faren.com.br/${profileUsername}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: "Seu link de perfil está na área de transferência." });
  };

  const applyBg = async (option: typeof BG_OPTIONS[0]) => {
    setBgId(option.id);
    await updateProfile.mutateAsync({ data: { dashboardBgColor: option.value } as any });
    toast({ title: `Fundo: ${option.label}` });
    setShowBgPicker(false);
  };

  const activeBg = BG_OPTIONS.find(o => o.id === bgId) || BG_OPTIONS[0];
  const bgStyle = getBgStyle(bgId);
  const textColor = getTextColor(bgId);

  const stats = [
    { label: "Total de Visitas", value: analytics?.totalViews, icon: Eye, delta: analytics?.viewsThisWeek },
    { label: "Seguidores", value: analytics?.followers, icon: Users, delta: null },
    { label: "Curtidas", value: analytics?.likes, icon: Heart, delta: null },
    { label: "Cliques em Links", value: analytics?.linkClicks, icon: MousePointerClick, delta: null },
  ];

  const dimText = bgId === 'white' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)';
  const borderColor = bgId === 'white' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)';

  return (
    <div className="min-h-screen relative" style={{ ...bgStyle, color: textColor, transition: 'all 0.4s' }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 md:px-12 py-3 md:py-5 border-b" style={{ ...bgStyle, borderColor, transition: 'all 0.4s' }}>
        <Link href="/">
          <span className="text-sm font-bold tracking-[0.25em] uppercase hover:opacity-70 transition-opacity" style={{ color: textColor }}>FAREN</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
          <Link href="/dashboard/comunidade" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity" style={{ color: textColor }}>
            <Globe className="w-3 h-3" /> <span className="hidden sm:inline">Comunidade</span>
          </Link>
          {profileSiteUrl && (
            <a href={profileSiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity" style={{ color: textColor }}>
              <ExternalLink className="w-3 h-3" /> <span className="hidden sm:inline">Perfil</span>
            </a>
          )}
          <Link href="/dashboard/edit" className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity" style={{ color: textColor }}>
            <Settings className="w-3 h-3" /> <span className="hidden sm:inline">Editar</span>
          </Link>
          <button onClick={copyProfileLink} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity" style={{ color: textColor }}>
            <Copy className="w-3 h-3" /> <span className="hidden sm:inline">Copiar Link</span>
          </button>
          <button onClick={() => logout()} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-red-400/60 hover:text-red-400 transition-opacity">
            <LogOut className="w-3 h-3" /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </nav>

      <div className="relative z-10 pt-20 md:pt-24 pb-24 px-4 md:px-12">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: dimText }}>Seu Espaço</p>
                <h1 className="text-3xl md:text-7xl font-bold tracking-tight uppercase leading-none mb-2" style={{ color: textColor }}>
                  {profile?.displayName || profile?.username || user?.displayName || user?.username || "..."}
                </h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: dimText }}>
                  faren.com.br/{profileUsername || "..."}
                </p>
              </div>
              <button
                onClick={() => setShowBgPicker(s => !s)}
                className="flex items-center gap-2 px-3 py-2 border hover:opacity-80 transition-all rounded-sm text-xs mt-4"
                style={{ borderColor, color: textColor, opacity: 0.6 }}
              >
                <Palette className="w-3.5 h-3.5" />
                <img src={activeBg.emoji} alt={activeBg.label} className="w-4 h-4" />
                {activeBg.label}
              </button>
            </div>

            {showBgPicker && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-5 border bg-black/60 backdrop-blur-sm rounded-sm" style={{ borderColor }}>
                <p className="text-xs mb-4 font-bold uppercase tracking-wider" style={{ color: dimText }}>Escolha o fundo do dashboard</p>
                <div className="flex gap-3 flex-wrap">
                  {BG_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => applyBg(opt)}
                      className="flex items-center gap-2 px-4 py-3 rounded-sm border-2 transition-all"
                      style={{
                        background: opt.gradient ? 'linear-gradient(to bottom, #ffffff, #ff0055)' : opt.value,
                        borderColor: bgId === opt.id ? (opt.value === '#ffffff' ? '#000' : '#fff') : 'rgba(255,255,255,0.2)',
                        color: opt.value === '#ffffff' ? '#000' : '#fff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      <img src={opt.emoji} alt={opt.label} className="w-5 h-5" />
                      {opt.label}
                      {bgId === opt.id && <span className="ml-1">✓</span>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>

          <div className="glow-line mb-16" />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-16" style={{ backgroundColor: borderColor }}>
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="p-6 flex flex-col gap-3" style={bgStyle}>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: dimText }}>{stat.label}</p>
                    <Icon className="w-4 h-4" style={{ color: dimText }} />
                  </div>
                  {analyticsLoading ? (
                    <Skeleton className="h-9 w-20 bg-white/5" />
                  ) : (
                    <span className="text-4xl font-bold tracking-tight" style={{ color: textColor }}>{stat.value?.toLocaleString() || 0}</span>
                  )}
                  {stat.delta != null && !analyticsLoading && (
                    <p className="text-xs" style={{ color: dimText }}>
                      <TrendingUp className="w-3 h-3 inline mr-1" />{stat.delta} esta semana
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6" style={{ color: dimText }}>Ações Rápidas</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Editar Perfil", icon: Settings, href: "/dashboard/edit", desc: "Personalize sua página", external: false },
                  { label: "Ver Perfil", icon: ExternalLink, href: profileSiteUrl || "#", desc: "Veja como os outros te veem", external: true },
                  { label: "Comunidade", icon: Globe, href: "/dashboard/comunidade", desc: "Feed social da plataforma", external: false },
                ].map((action) => {
                  const Icon = action.icon;
                  const inner = (
                    <div className="group flex items-center gap-4 p-4 border hover:opacity-80 transition-all duration-200 cursor-pointer rounded-sm" style={{ borderColor, backgroundColor: bgId === 'rosa' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)' }}>
                      <Icon className="w-4 h-4 transition-colors" style={{ color: dimText }} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: textColor }}>{action.label}</p>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: dimText }}>{action.desc}</p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 -translate-x-1 group-hover:translate-x-0 transition-all" style={{ color: dimText }} />
                    </div>
                  );
                  if (action.external && action.href !== "#") {
                    return (
                      <a key={action.label} href={action.href} target="_blank" rel="noopener noreferrer">
                        {inner}
                      </a>
                    );
                  }
                  return (
                    <Link key={action.label} href={action.href}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6" style={{ color: dimText }}>Principais Países</p>
              {analyticsLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 bg-white/5 rounded-sm" />)}</div>
              ) : analytics?.topCountries && analytics.topCountries.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topCountries.map((country, idx) => {
                    const max = analytics.topCountries[0].count;
                    const pct = Math.round((country.count / max) * 100);
                    return (
                      <div key={idx} className="p-3 border rounded-sm" style={{ borderColor, backgroundColor: bgId === 'rosa' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold" style={{ color: textColor }}>{country.country || 'Desconhecido'}</span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: dimText }}>{country.count} visitas</span>
                        </div>
                        <div className="h-px rounded-full overflow-hidden" style={{ backgroundColor: borderColor }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: textColor, opacity: 0.4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center border rounded-sm" style={{ borderColor }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: dimText }}>Sem dados de localização ainda</p>
                  <p className="text-xs mt-2" style={{ color: dimText }}>Compartilhe seu perfil para começar a coletar análises</p>
                </div>
              )}
            </div>
          </div>

          <div className="glow-line mt-16" />
        </div>
      </div>
    </div>
  );
}
