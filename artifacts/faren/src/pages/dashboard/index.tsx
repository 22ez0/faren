import { useAuth } from "@/lib/auth";
import { useGetProfileAnalytics, useGetMyProfile, useUpdateProfile } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, Settings, LogOut, Eye, Users, Heart, MousePointerClick, ArrowRight, TrendingUp, Globe, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const DASHBOARD_BG_COLORS = [
  { label: 'Preto', value: '#000000' },
  { label: 'Escuro', value: '#0d0d0d' },
  { label: 'Cinza Escuro', value: '#111827' },
  { label: 'Azul Noite', value: '#0f172a' },
  { label: 'Roxo Escuro', value: '#1a0a2e' },
  { label: 'Verde Escuro', value: '#052e16' },
  { label: 'Vermelho Escuro', value: '#1c0a0a' },
  { label: 'Rosa Escuro', value: '#1a0714' },
  { label: 'Cinza Médio', value: '#1f2937' },
  { label: 'Azul Médio', value: '#1e3a5f' },
  { label: 'Roxo Médio', value: '#2d1b69' },
  { label: 'Rosa', value: '#831843' },
  { label: 'Verde', value: '#14532d' },
  { label: 'Azul', value: '#1e40af' },
  { label: 'Âmbar Escuro', value: '#1c1200' },
  { label: 'Índigo', value: '#1e1b4b' },
];

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgColor, setBgColor] = useState('#000000');

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
    const color = (profile as any)?.dashboardBgColor || '#000000';
    setBgColor(color);
    document.body.style.backgroundColor = color;
    return () => { document.body.style.backgroundColor = ''; };
  }, [(profile as any)?.dashboardBgColor]);

  if (authLoading || !isAuthenticated) return null;

  const profileUsername = profile?.username || user?.username || "";
  const profileHref = profileUsername ? `/${profileUsername}` : "/dashboard/edit";

  const copyProfileLink = () => {
    if (!profileUsername) {
      toast({ title: "Perfil carregando", description: "Aguarde alguns segundos e tente novamente." });
      return;
    }
    const url = `${window.location.origin}/${profileUsername}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: "Seu link de perfil está na área de transferência." });
  };

  const handleBgColor = async (color: string) => {
    setBgColor(color);
    document.body.style.backgroundColor = color;
    await updateProfile.mutateAsync({ data: { dashboardBgColor: color } as any });
    toast({ title: 'Cor de fundo salva!' });
    setShowBgPicker(false);
  };

  const stats = [
    { label: "Total de Visitas", value: analytics?.totalViews, icon: Eye, delta: analytics?.viewsThisWeek },
    { label: "Seguidores", value: analytics?.followers, icon: Users, delta: null },
    { label: "Curtidas", value: analytics?.likes, icon: Heart, delta: null },
    { label: "Cliques em Links", value: analytics?.linkClicks, icon: MousePointerClick, delta: null },
  ];

  return (
    <div className="min-h-screen text-foreground" style={{ backgroundColor: bgColor, transition: 'background-color 0.4s' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-12 py-5 border-b border-white/5" style={{ backgroundColor: bgColor, transition: 'background-color 0.4s' }}>
        <Link href="/">
          <span className="text-sm font-bold tracking-[0.25em] uppercase text-white hover:opacity-70 transition-opacity">FAREN</span>
        </Link>
        <div className="flex items-center gap-3 md:gap-6 flex-wrap justify-end">
          <Link href="/dashboard/comunidade" className="nav-link flex items-center gap-1 text-white/60 hover:text-white">
            <Globe className="w-3 h-3" /> Comunidade
          </Link>
          <Link href={profileHref} className="nav-link flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3" /> Perfil
          </Link>
          <Link href="/dashboard/edit" className="nav-link flex items-center gap-1.5">
            <Settings className="w-3 h-3" /> Editar
          </Link>
          <button onClick={copyProfileLink} className="nav-link flex items-center gap-1.5">
            <Copy className="w-3 h-3" /> Copiar Link
          </button>
          <button onClick={() => logout()} className="nav-link flex items-center gap-1.5 text-red-400/60 hover:text-red-400">
            <LogOut className="w-3 h-3" /> Sair
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="label-caps mb-4">Seu Espaço</p>
                <h1 className="text-4xl md:text-7xl font-bold tracking-tight uppercase leading-none mb-2">
                  {user?.displayName || user?.username}
                </h1>
                <p className="label-caps" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  faren.com/{profileUsername || "..."}
                </p>
              </div>
              <button
                onClick={() => setShowBgPicker(s => !s)}
                className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/25 text-white/40 hover:text-white/70 transition-all rounded-sm text-xs mt-4"
                title="Personalizar cor de fundo"
              >
                <Palette className="w-3.5 h-3.5" />
                Cor de fundo
              </button>
            </div>

            {showBgPicker && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 border border-white/10 bg-white/[0.03] rounded-sm"
              >
                <p className="label-caps mb-3">Escolha a cor de fundo do seu dashboard</p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {DASHBOARD_BG_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => handleBgColor(c.value)}
                      className={`w-full aspect-square rounded-sm border-2 transition-all ${bgColor === c.value ? 'border-white scale-110' : 'border-white/20 hover:border-white/50'}`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <label className="text-xs text-white/40">Cor personalizada:</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    onBlur={e => handleBgColor(e.target.value)}
                    className="w-10 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                </div>
              </motion.div>
            )}
          </motion.div>

          <div className="glow-line mb-16" />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 mb-16">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="p-6 flex flex-col gap-3"
                  style={{ backgroundColor: bgColor }}
                >
                  <div className="flex items-center justify-between">
                    <p className="label-caps">{stat.label}</p>
                    <Icon className="w-4 h-4 text-white/20" />
                  </div>
                  {analyticsLoading ? (
                    <Skeleton className="h-9 w-20 bg-white/5" />
                  ) : (
                    <span className="text-4xl font-bold tracking-tight">
                      {stat.value?.toLocaleString() || 0}
                    </span>
                  )}
                  {stat.delta != null && !analyticsLoading && (
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {stat.delta} esta semana
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Bottom grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Quick actions */}
            <div className="lg:col-span-1">
              <p className="label-caps mb-6">Ações Rápidas</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Editar Perfil", icon: Settings, href: "/dashboard/edit", desc: "Personalize sua página" },
                  { label: "Ver Perfil", icon: ExternalLink, href: profileHref, desc: "Veja como os outros te veem" },
                  { label: "Comunidade", icon: Globe, href: "/dashboard/comunidade", desc: "Feed social da plataforma" },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} href={action.href}>
                      <div className="group flex items-center gap-4 p-4 bg-white/[0.03] border border-white/5 hover:border-white/15 hover:bg-white/[0.06] transition-all duration-200 cursor-pointer rounded-sm">
                        <Icon className="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{action.label}</p>
                          <p className="label-caps">{action.desc}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 -translate-x-1 group-hover:translate-x-0 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Top countries */}
            <div className="lg:col-span-2">
              <p className="label-caps mb-6">Principais Países</p>
              {analyticsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 bg-white/5 rounded-sm" />)}
                </div>
              ) : analytics?.topCountries && analytics.topCountries.length > 0 ? (
                <div className="space-y-2">
                  {analytics.topCountries.map((country, idx) => {
                    const max = analytics.topCountries[0].count;
                    const pct = Math.round((country.count / max) * 100);
                    return (
                      <div key={idx} className="p-3 bg-white/[0.03] border border-white/5 rounded-sm">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold">{country.country || 'Desconhecido'}</span>
                          <span className="label-caps">{country.count} visitas</span>
                        </div>
                        <div className="h-px bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-white/40 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center border border-white/5 rounded-sm">
                  <p className="label-caps">Sem dados de localização ainda</p>
                  <p className="text-xs text-white/25 mt-2">Compartilhe seu perfil para começar a coletar análises</p>
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
