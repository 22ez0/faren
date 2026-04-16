import { useAuth } from "@/lib/auth";
import { useGetProfileAnalytics, useGetMyProfile } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, Settings, LogOut, Eye, Users, Heart, MousePointerClick, ArrowRight, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: analytics, isLoading: analyticsLoading } = useGetProfileAnalytics({
    query: { queryKey: [] as any, enabled: isAuthenticated },
  });

  const { data: profile } = useGetMyProfile({
    query: { queryKey: [] as any, enabled: isAuthenticated },
  });

  if (authLoading || !isAuthenticated) return null;

  const copyProfileLink = () => {
    const url = `${window.location.origin}/${user?.username}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copiado!", description: "Seu link de perfil está na área de transferência." });
  };

  const stats = [
    { label: "Total de Visitas", value: analytics?.totalViews, icon: Eye, delta: analytics?.viewsThisWeek },
    { label: "Seguidores", value: analytics?.followers, icon: Users, delta: null },
    { label: "Curtidas", value: analytics?.likes, icon: Heart, delta: null },
    { label: "Cliques em Links", value: analytics?.linkClicks, icon: MousePointerClick, delta: null },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar-style nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <Link href="/">
          <span className="text-sm font-bold tracking-[0.25em] uppercase text-white hover:opacity-70 transition-opacity">FAREN</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href={`/${user?.username}`} className="nav-link flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3" /> Perfil
          </Link>
          <Link href="/dashboard/edit" className="nav-link flex items-center gap-1.5">
            <Settings className="w-3 h-3" /> Editar
          </Link>
          <button
            onClick={copyProfileLink}
            className="nav-link flex items-center gap-1.5"
          >
            <Copy className="w-3 h-3" /> Copiar Link
          </button>
          <button
            onClick={() => logout()}
            className="nav-link flex items-center gap-1.5 text-red-400/60 hover:text-red-400"
          >
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
            className="mb-16"
          >
            <p className="label-caps mb-4">Seu Espaço</p>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight uppercase leading-none mb-2">
              {user?.displayName || user?.username}
            </h1>
            <p className="label-caps" style={{ color: 'rgba(255,255,255,0.3)' }}>
              faren.com/{user?.username}
            </p>
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
                  className="p-6 bg-background flex flex-col gap-3"
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
                  { label: "Ver Perfil", icon: ExternalLink, href: `/${user?.username}`, desc: "Veja como os outros te veem" },
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
                          <div
                            className="h-full bg-white/40 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
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
