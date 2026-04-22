import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useGetTrendingProfiles } from "@workspace/api-client-react";
import { ArrowRight, Users, Heart, Volume2, VolumeX } from "lucide-react";
import heroVideo from "@assets/pinterest_884112970592536960_1776809417801.mp4";
import heroAudioSrc from "@assets/Download_1776810133370.mp4";

const PT = {
  nav: { discover: "Descobrir", login: "Entrar", cta: "Criar Seu Link" },
  hero: { tag: "Plataforma de Perfil Personalizado", h1a: "SEU", h1b: "PERFIL", h1c: "EM TODO LUGAR", sub: "A plataforma de link na bio mais poderosa e personalizada. Status do Discord, música ao vivo, efeitos de partículas, fontes customizadas — totalmente seu.", btn1: "Criar seu perfil", btn2: "Explorar perfis" },
  features: [
    { title: "Discord ao Vivo", sub: "Status, atividade e avatar — tudo sincronizado em tempo real.", stat: "Rich Presence" },
    { title: "Widget de Música", sub: "Spotify, SoundCloud & Last.fm tocando agora, barra de progresso ao vivo.", stat: "Tocando Agora" },
    { title: "Efeitos Completos", sub: "Raios, chuva de partículas, sakura, estrelas, efeitos de clique.", stat: "15+ Efeitos" },
    { title: "Fontes Personalizadas", sub: "Mono, pixel, cursiva, serifada — seu estilo, sua fonte.", stat: "5 Fontes" },
    { title: "Análises", sub: "Visualizações, seguidores, curtidas, países — tudo para você.", stat: "Painel Completo" },
    { title: "Redes Sociais", sub: "Conecte +40 plataformas: Instagram, TikTok, Spotify, GitHub e muito mais.", stat: "40+ Plataformas" },
  ],
  community: "Comunidade", trending: "Em Alta", viewAll: "Ver todos",
  cta: { tag: "Pronto?", h1: "DEIXE", h2: "SUA MARCA", btn: "Comece agora — é grátis" },
  footer: { discover: "Descobrir", login: "Entrar", register: "Registrar", support: "Suporte" },
};

const EN = {
  nav: { discover: "Discover", login: "Login", cta: "Create Your Link" },
  hero: { tag: "Custom Profile Platform", h1a: "YOUR", h1b: "PROFILE", h1c: "EVERYWHERE", sub: "The most powerful and customizable link-in-bio platform. Discord status, live music, particle effects, custom fonts — totally yours.", btn1: "Create your profile", btn2: "Explore profiles" },
  features: [
    { title: "Live Discord", sub: "Status, activity, and avatar — everything synced in real time.", stat: "Rich Presence" },
    { title: "Music Widget", sub: "Spotify, SoundCloud & Last.fm playing now, live progress bar.", stat: "Now Playing" },
    { title: "Full Effects", sub: "Lightning, particle rain, sakura, stars, click effects.", stat: "15+ Effects" },
    { title: "Custom Fonts", sub: "Mono, pixel, cursive, serif — your style, your font.", stat: "5 Fonts" },
    { title: "Analytics", sub: "Views, followers, likes, countries — everything for you.", stat: "Full Dashboard" },
    { title: "Social Networks", sub: "Connect 40+ platforms: Instagram, TikTok, Spotify, GitHub and more.", stat: "40+ Platforms" },
  ],
  community: "Community", trending: "Trending", viewAll: "View all",
  cta: { tag: "Ready?", h1: "LEAVE", h2: "YOUR MARK", btn: "Start now — it's free" },
  footer: { discover: "Discover", login: "Login", register: "Register", support: "Support" },
};

export default function Home() {
  const { data: trendingProfiles, isLoading } = useGetTrendingProfiles({ limit: 6 }, { query: { staleTime: 120_000, gcTime: 300_000 } });
  const [lang, setLang] = useState<'PT' | 'EN'>(() => (localStorage.getItem('faren_lang') as any) || 'PT');
  const heroVideoARef = useRef<HTMLVideoElement>(null);
  const heroVideoBRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);
  const [muted, setMuted] = useState(false);
  const [showB, setShowB] = useState(false);
  const [claimUsername, setClaimUsername] = useState('');
  const [, navigate] = useLocation();

  const handleClaim = (e?: React.FormEvent) => {
    e?.preventDefault();
    const u = claimUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!u) return;
    navigate(`/register?username=${encodeURIComponent(u)}`);
  };

  // Seamless loop: two stacked <video> elements, one starts a tiny moment before the other ends, fading between them
  useEffect(() => {
    const a = heroVideoARef.current;
    const b = heroVideoBRef.current;
    if (!a || !b) return;
    const FADE = 0.45; // seconds before end to start swap
    let active: "A" | "B" = "A";
    let rafId = 0;

    const startBoth = async () => {
      try { a.currentTime = 0; await a.play(); } catch {}
      try { b.currentTime = 0; b.pause(); } catch {}
    };

    const tick = () => {
      const cur = active === "A" ? a : b;
      const other = active === "A" ? b : a;
      if (cur.duration && cur.currentTime >= cur.duration - FADE && other.paused) {
        other.currentTime = 0;
        other.play().catch(() => {});
      }
      if (cur.duration && cur.currentTime >= cur.duration - 0.05) {
        active = active === "A" ? "B" : "A";
        setShowB(active === "B");
        cur.pause();
        cur.currentTime = 0;
      }
      rafId = requestAnimationFrame(tick);
    };

    if (a.readyState >= 1) startBoth();
    else a.addEventListener("loadedmetadata", startBoth, { once: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      a.removeEventListener("loadedmetadata", startBoth);
    };
  }, []);

  // Gapless audio: pre-create context+source, start playing immediately. Use gesture fallback if autoplay blocked.
  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  useEffect(() => {
    let cancelled = false;
    let removeGestureListeners: (() => void) | null = null;

    (async () => {
      try {
        const Ctx: typeof AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const gain = ctx.createGain();
        gain.gain.value = mutedRef.current ? 0 : 1.8;
        gain.connect(ctx.destination);
        audioGainRef.current = gain;

        const res = await fetch(heroAudioSrc);
        const arrBuf = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrBuf);
        if (cancelled) { ctx.close(); return; }
        audioBufferRef.current = decoded;

        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.loop = true;
        src.connect(gain);
        src.start(0);
        audioSourceRef.current = src;

        const tryResume = () => ctx.resume().catch(() => {});
        await tryResume();

        if (ctx.state !== "running") {
          const events: (keyof DocumentEventMap)[] = ["pointerdown", "touchstart", "keydown", "click", "scroll"];
          const onGesture = () => {
            tryResume();
            if (ctx.state === "running") removeGestureListeners?.();
          };
          events.forEach(e => document.addEventListener(e, onGesture, { passive: true, capture: true }));
          removeGestureListeners = () => events.forEach(e => document.removeEventListener(e, onGesture, { capture: true } as any));
        }
      } catch (e) {
        console.warn("Audio init failed:", e);
      }
    })();

    return () => {
      cancelled = true;
      removeGestureListeners?.();
      try { audioSourceRef.current?.stop(); } catch {}
      audioSourceRef.current?.disconnect();
      audioCtxRef.current?.close();
    };
  }, []);

  const toggleMute = () => {
    const ctx = audioCtxRef.current;
    const gain = audioGainRef.current;
    const newMuted = !muted;
    setMuted(newMuted);
    if (!ctx || !gain) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(newMuted ? 0 : 1.8, now + 0.08);
  };

  const t = lang === 'PT' ? PT : EN;

  const toggleLang = () => {
    const next = lang === 'PT' ? 'EN' : 'PT';
    setLang(next);
    localStorage.setItem('faren_lang', next);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-12 py-5">
        <Link href="/">
          <span className="text-sm font-bold tracking-[0.25em] uppercase text-white hover:opacity-70 transition-opacity">
            FAREN
          </span>
        </Link>
        <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-end">
          <Link href="/discover" className="nav-link">{t.nav.discover}</Link>
          <Link href="/login" className="nav-link">{t.nav.login}</Link>
          <button
            onClick={toggleLang}
            className="nav-link flex items-center gap-1.5 text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-2 py-1 rounded-sm text-xs transition-all"
            title="Mudar idioma / Change language"
          >
            <img
              src={lang === 'PT' ? 'https://flagcdn.com/20x15/br.png' : 'https://flagcdn.com/20x15/us.png'}
              alt={lang === 'PT' ? 'Brasil' : 'USA'}
              width={20} height={15}
              className="rounded-[2px] flex-shrink-0"
            />
            {lang === 'PT' ? 'PT' : 'EN'}
          </button>
          <Link href="/register">
            <span className="btn-outline-white text-xs">{t.nav.cta}</span>
          </Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden" style={{ background: "#050a14" }}>

        {/* Hero video background — two stacked videos crossfading for seamless loop */}
        <video
          ref={heroVideoARef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[450ms]"
          style={{ zIndex: 0, opacity: showB ? 0 : 0.35 }}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <video
          ref={heroVideoBRef}
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[450ms]"
          style={{ zIndex: 0, opacity: showB ? 0.35 : 0 }}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black pointer-events-none" style={{ zIndex: 2 }} />

        <button
          onClick={toggleMute}
          aria-label={muted ? "Ativar som" : "Silenciar"}
          className="absolute bottom-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/70 border border-white/15 text-white/70 hover:text-white backdrop-blur-sm transition-all"
          style={{ zIndex: 4 }}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <div className="relative flex flex-col items-center text-center max-w-5xl mx-auto" style={{ zIndex: 3 }}>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="label-caps mb-8" style={{ textShadow: '0 0 20px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)' }}>
            {t.hero.tag}
          </motion.p>

          <div className="overflow-hidden">
            <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
              <h1 className="display-heading text-white leading-none" style={{ textShadow: '0 0 40px rgba(0,0,0,1), 0 0 80px rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.6)' }}>{t.hero.h1a}</h1>
              <h1 className="display-heading-outline leading-none" style={{ textShadow: '0 0 40px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.8)', filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.9))' }}>{t.hero.h1b}</h1>
              <h1 className="display-heading text-white leading-none" style={{ textShadow: '0 0 40px rgba(0,0,0,1), 0 0 80px rgba(0,0,0,0.9), 2px 2px 0 rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.6)' }}>{t.hero.h1c}</h1>
            </motion.div>
          </div>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mt-10 max-w-md text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', textShadow: '0 1px 12px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.7)' }}>
            {t.hero.sub}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/register">
              <button className="btn-solid-white">{t.hero.btn1} <ArrowRight className="ml-2 w-4 h-4 inline" /></button>
            </Link>
            <Link href="/discover">
              <button className="btn-outline-white">{t.hero.btn2}</button>
            </Link>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 scroll-indicator" style={{ zIndex: 3 }} />
      </section>

      {/* ── CLAIM YOUR URL ────────────────────────────────────── */}
      <section className="pt-24 pb-8 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="label-caps mb-4"
          >
            {lang === 'PT' ? 'Reserve Seu Link' : 'Claim Your Link'}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="text-3xl md:text-4xl font-bold tracking-tight uppercase mb-8"
          >
            {lang === 'PT' ? 'Garanta Seu Username' : 'Get Your Username'}
          </motion.h2>
          <motion.form
            onSubmit={handleClaim}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-lg mx-auto"
          >
            <div className="flex items-stretch h-14 rounded-sm overflow-hidden border border-white/15 bg-white/[0.03] backdrop-blur-sm focus-within:border-white/40 transition-colors">
              <span className="flex items-center pl-5 pr-1 text-sm select-none" style={{ color: 'rgba(255,255,255,0.45)' }}>
                faren.com.br/
              </span>
              <input
                type="text"
                value={claimUsername}
                onChange={(e) => setClaimUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="seu_user"
                maxLength={20}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none border-none px-1 min-w-0"
                aria-label="Escolha seu username"
              />
              <button
                type="submit"
                disabled={!claimUsername.trim()}
                className="px-6 bg-white text-black text-xs font-bold uppercase tracking-[0.15em] hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {lang === 'PT' ? 'Reservar' : 'Claim'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="mt-4 text-[11px] tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {lang === 'PT' ? 'Garanta seu link antes que alguém pegue' : 'Claim your link before someone else does'}
            </p>
          </motion.form>
        </div>
      </section>

      {/* ── FEATURES ROW ──────────────────────────────────────── */}
      <section className="pt-8 pb-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="glow-line mb-16" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-white/5">
            {t.features.map((feat, i) => (
              <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="p-8 bg-background hover:bg-white/[0.03] transition-colors duration-300">
                <p className="label-caps mb-3">{feat.stat}</p>
                <h3 className="text-lg font-bold tracking-tight mb-2">{feat.title}</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{feat.sub}</p>
              </motion.div>
            ))}
          </div>
          <div className="glow-line mt-16" />
        </div>
      </section>

      {/* ── TRENDING PROFILES ──────────────────────────────────── */}
      <section className="py-16 px-6 md:px-12 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
            <div>
              <p className="label-caps mb-3">{t.community}</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight uppercase">{t.trending}</h2>
            </div>
            <Link href="/discover" className="nav-link flex items-center gap-2">
              {t.viewAll} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {isLoading
              ? Array(6).fill(0).map((_, i) => <div key={i} className="aspect-[3/4] rounded-sm bg-white/5 animate-pulse" />)
              : trendingProfiles?.map((profile, i) => (
                  <motion.div key={profile.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                    <Link href={`/${profile.username}`}>
                      <div className="group aspect-[3/4] relative overflow-hidden rounded-sm cursor-pointer hover-lift">
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: profile.backgroundUrl ? `url(${profile.backgroundUrl})` : `linear-gradient(135deg, #1a1a2e, #16213e)`, opacity: profile.backgroundUrl ? (profile.backgroundOpacity || 60) / 100 : 1 }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20 mb-2">
                            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-white/10 text-xs font-bold">{profile.username.substring(0, 2).toUpperCase()}</div>}
                            {profile.discordConnected && profile.discordStatus === 'online' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />}
                          </div>
                          <p className="text-sm font-bold truncate">{profile.displayName || profile.username}</p>
                          <p className="label-caps mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>@{profile.username}</p>
                          <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}><Users className="w-2.5 h-2.5" />{profile.followersCount}</span>
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}><Heart className="w-2.5 h-2.5" />{profile.likesCount}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-32 px-6 relative overflow-hidden border-t border-white/5">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="label-caps mb-6">{t.cta.tag}</p>
            <h2 className="display-heading text-white mb-4 leading-none">{t.cta.h1}</h2>
            <h2 className="display-heading-outline mb-12 leading-none">{t.cta.h2}</h2>
            <Link href="/register">
              <button className="btn-solid-white">{t.cta.btn} <ArrowRight className="ml-2 w-4 h-4 inline" /></button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-6 md:px-12 py-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs font-bold tracking-[0.25em] uppercase">
          <span className="text-white/30">FAREN</span>
          <a href="https://keefnow.com.br" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">KEEFNOW</a>
        </div>
        <div className="flex gap-6 flex-wrap">
          <Link href="/discover" className="nav-link">{t.footer.discover}</Link>
          <Link href="/login" className="nav-link">{t.footer.login}</Link>
          <Link href="/register" className="nav-link">{t.footer.register}</Link>
          <Link href="/suporte" className="nav-link">{t.footer.support}</Link>
          <button onClick={toggleLang} className="nav-link text-white/40 flex items-center gap-1.5">
            <img
              src={lang === 'PT' ? 'https://flagcdn.com/20x15/us.png' : 'https://flagcdn.com/20x15/br.png'}
              alt={lang === 'PT' ? 'USA' : 'Brasil'}
              width={20} height={15}
              className="rounded-[2px] flex-shrink-0"
            />
            {lang === 'PT' ? 'EN' : 'PT'}
          </button>
        </div>
      </footer>
    </div>
  );
}
