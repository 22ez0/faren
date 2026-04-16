import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PublicProfile } from "@workspace/api-client-react";
import {
  SiDiscord, SiSpotify, SiLastdotfm, SiGithub, SiX, SiYoutube, SiTwitch,
  SiInstagram, SiTiktok, SiSteam, SiKick, SiPatreon, SiSnapchat, SiReddit,
  SiPinterest, SiThreads, SiBluesky, SiSoundcloud, SiBandcamp,
  SiTelegram, SiPaypal, SiGitlab, SiFacebook, SiLinktree,
  SiLetterboxd, SiVk, SiKofi, SiBitcoin, SiEthereum, SiSolana, SiRoblox,
  SiVenmo, SiCashapp,
} from "react-icons/si";
import { FaPlaystation, FaLinkedin } from "react-icons/fa";
import {
  Link as LinkIcon, Music, BadgeCheck, Code, Gamepad2,
  Mic, Palette, Headphones, Star, Zap, Crown, Globe, Heart, Eye,
  Users, Mail, Gem, Play, Pause, SkipBack, SkipForward,
} from "lucide-react";
import ParticleCanvas from "./ParticleCanvas";
import ClickEffect from "./ClickEffect";
import TypewriterText from "./TypewriterText";

interface ProfileViewProps {
  profile: Partial<PublicProfile>;
  isOwner?: boolean;
  onFollow?: () => void;
  onLike?: () => void;
  isFollowing?: boolean;
  hasLiked?: boolean;
}

const BADGE_MAP: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  verified:    { icon: BadgeCheck, label: "Verificado",          color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
  creator:     { icon: Palette,    label: "Criador",             color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  "music-head":{ icon: Headphones, label: "Amante de Música",    color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  gamer:       { icon: Gamepad2,   label: "Gamer",               color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  developer:   { icon: Code,       label: "Desenvolvedor",        color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  streamer:    { icon: Mic,        label: "Streamer",             color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  artist:      { icon: Palette,    label: "Artista",              color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  star:        { icon: Star,       label: "Estrela em Ascensão",  color: "#fde68a", bg: "rgba(253,230,138,0.12)" },
  og:          { icon: Crown,      label: "Membro OG",            color: "#c4b5fd", bg: "rgba(196,181,253,0.12)" },
  vip:         { icon: Zap,        label: "VIP",                  color: "#f9a8d4", bg: "rgba(249,168,212,0.12)" },
};

function isVideoMedia(url?: string | null) {
  if (!url) return false;
  return url.startsWith("data:video/") || /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url);
}

function isGifMedia(url?: string | null) {
  if (!url) return false;
  return url.startsWith("data:image/gif") || /\.gif(\?|#|$)/i.test(url);
}

function MediaFill({ src, alt, className = "" }: { src: string; alt?: string; className?: string }) {
  if (isVideoMedia(src)) {
    return (
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }
  return <img src={src} alt={alt || ""} className={`w-full h-full object-cover ${className}`} />;
}

function parseCustomBadge(badgeId: string) {
  if (!badgeId.startsWith("custom|")) return null;
  const [, rawEmoji = "✨", color = "#ffffff", rawLabel = "Personalizado"] = badgeId.split("|");
  const decode = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  return { emoji: decode(rawEmoji), color, label: decode(rawLabel) };
}

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  github: SiGithub, twitter: SiX, x: SiX, youtube: SiYoutube,
  twitch: SiTwitch, instagram: SiInstagram, discord: SiDiscord,
  spotify: SiSpotify, tiktok: SiTiktok, linkedin: FaLinkedin,
  steam: SiSteam, kick: SiKick, patreon: SiPatreon,
  snapchat: SiSnapchat, reddit: SiReddit, pinterest: SiPinterest,
  threads: SiThreads, bluesky: SiBluesky,
  soundcloud: SiSoundcloud, bandcamp: SiBandcamp,
  telegram: SiTelegram, paypal: SiPaypal, gitlab: SiGitlab,
  facebook: SiFacebook, linktree: SiLinktree, letterboxd: SiLetterboxd,
  vk: SiVk, kofi: SiKofi, bitcoin: SiBitcoin, ethereum: SiEthereum,
  solana: SiSolana, roblox: SiRoblox, venmo: SiVenmo, cashapp: SiCashapp,
  playstation: FaPlaystation, lastfm: SiLastdotfm,
  email: Mail, website: Globe,
};

const FONT_CLASSES: Record<string, string> = {
  default: "font-profile-default",
  mono: "font-profile-mono",
  cursive: "font-profile-cursive",
  serif: "font-profile-serif",
  pixel: "font-profile-pixel",
};

const STATUS_COLORS: Record<string, string> = {
  online: "#22c55e",
  idle: "#eab308",
  dnd: "#ef4444",
  offline: "#6b7280",
};

function DiscordStatus({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.offline;
  const label = status === 'dnd' ? 'Não Perturbe' : status === 'online' ? 'Online' : status === 'idle' ? 'Ausente' : 'Offline';
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="text-xs opacity-60">{label}</span>
    </div>
  );
}

function MusicPlayer({ musicUrl, musicTitle, musicIconUrl }: { musicUrl: string; musicTitle?: string | null; musicIconUrl?: string | null }) {
  const isSpotify = musicUrl.includes('spotify.com') || musicUrl.startsWith('spotify:');
  const isSoundCloud = musicUrl.includes('soundcloud.com');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }
    audio.pause();
  };

  const seekBy = (amount: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + amount));
  };

  const seekTo = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setProgress(value);
  };

  if (isSpotify) {
    const trackMatch = musicUrl.match(/track\/([a-zA-Z0-9]+)/);
    const trackId = trackMatch?.[1];
    if (!trackId) return null;
    return (
      <div className="w-full glass-card rounded-lg overflow-hidden">
        <iframe
          src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="block"
        />
      </div>
    );
  }

  if (isSoundCloud) {
    return (
      <div className="w-full glass-card rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="80"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(musicUrl)}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
          className="block"
        />
      </div>
    );
  }

  return (
    <div className="w-full glass-card rounded-2xl px-3 py-2.5">
      <div className="flex items-center gap-3">
        {musicIconUrl ? (
          <img src={musicIconUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-white/10 flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0 bg-white/[0.03]">
            <Music className="w-6 h-6 text-white/45" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-white font-semibold truncate mb-1">{musicTitle || "Áudio"}</p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/65 tabular-nums w-8">{formatTime(progress)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={Math.min(progress, duration || progress)}
              onChange={(event) => seekTo(Number(event.target.value))}
              className="profile-audio-range flex-1"
              aria-label="Progresso da música"
            />
            <span className="text-[11px] text-white/65 tabular-nums w-8 text-right">{formatTime(duration)}</span>
            <button type="button" onClick={() => seekBy(-10)} className="text-white/55 hover:text-white transition-colors" aria-label="Voltar">
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={togglePlay} className="text-white hover:text-white/80 transition-colors" aria-label={isPlaying ? "Pausar" : "Tocar"}>
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <button type="button" onClick={() => seekBy(10)} className="text-white/55 hover:text-white transition-colors" aria-label="Avançar">
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      <audio
        ref={audioRef}
        controlsList="nodownload noplaybackrate"
        disableRemotePlayback
        autoPlay
        loop
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onContextMenu={(event) => event.preventDefault()}
        className="hidden"
      >
        <source src={musicUrl} />
      </audio>
    </div>
  );
}

export default function ProfileView({ profile, isOwner, onFollow, onLike, isFollowing, hasLiked }: ProfileViewProps) {
  const [likePulse, setLikePulse] = useState(false);
  const [lanyardData, setLanyardData] = useState<any>(null);

  const discordUserId = (profile as any).discordUserId as string | undefined;

  useEffect(() => {
    if (!discordUserId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${discordUserId}`);
        if (!res.ok || cancelled) return;
        const body = await res.json() as any;
        if (body.success && !cancelled) setLanyardData(body.data);
      } catch { }
    };
    poll();
    const interval = setInterval(poll, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [discordUserId]);

  const liveDiscordStatus: string = lanyardData?.discord_status || (profile as any).discordStatus || "offline";
  const liveDiscordActivity: string | null = lanyardData?.activities?.[0]?.name || (profile as any).discordActivity || null;
  const liveDiscordUsername: string | null = lanyardData?.discord_user?.global_name || lanyardData?.discord_user?.username || (profile as any).discordUsername || null;
  const liveAvatarHash = lanyardData?.discord_user?.avatar;
  const liveDiscordAvatarUrl: string | null = liveAvatarHash && discordUserId
    ? `https://cdn.discordapp.com/avatars/${discordUserId}/${liveAvatarHash}.${liveAvatarHash.startsWith("a_") ? "gif" : "png"}?size=128`
    : (profile as any).discordAvatarUrl || null;

  const accent = profile.accentColor || "#ffffff";
  const glow = profile.glowColor || accent;
  const fontClass = FONT_CLASSES[profile.fontFamily || "default"] || FONT_CLASSES.default;
  const layout = profile.layoutStyle || "centered";
  const particleEffect = profile.particleEffect || "none";
  const clickEffect = profile.clickEffect || "none";
  const showViews = profile.showViews !== false;
  const bgBlur = profile.backgroundBlur || 0;
  const bgOpacity = (profile.backgroundOpacity ?? 60) / 100;
  const typewriterTexts = profile.typewriterTexts || [];
  const musicUrl = profile.musicUrl || '';
  const musicTitle = (profile as any).musicTitle || null;
  const musicIconUrl = (profile as any).musicIconUrl || null;
  const musicPrivate = (profile as any).musicPrivate === true;
  const showDiscordAvatar = (profile as any).showDiscordAvatar !== false;
  const showDiscordPresence = (profile as any).showDiscordPresence !== false;
  const backgroundType = (profile as any).backgroundType || 'image';

  const cursorStyle = profile.cursorStyle || 'auto';
  const isCustomCursor = cursorStyle?.startsWith('url:');
  const cursorDataUrl = isCustomCursor ? cursorStyle.replace('url:', '') : null;

  const cursorClass =
    isCustomCursor ? '' :
    cursorStyle === "crosshair" ? "cursor-crosshair" :
    cursorStyle === "none" ? "cursor-none" :
    cursorStyle === "pointer" ? "cursor-pointer" :
    cursorStyle === "cell" ? "cursor-cell" :
    cursorStyle === "grab" ? "cursor-grab" :
    cursorStyle === "zoom-in" ? "cursor-zoom-in" :
    cursorStyle === "text" ? "cursor-text" :
    "cursor-auto";

  useEffect(() => {
    if (!isCustomCursor || !cursorDataUrl) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'custom-cursor-style';
    styleEl.textContent = `* { cursor: url("${cursorDataUrl}") 16 16, auto !important; }`;
    document.head.appendChild(styleEl);
    return () => { styleEl.remove(); };
  }, [isCustomCursor, cursorDataUrl]);

  const isLeft = layout === "left";
  const alignClass = isLeft ? "items-start text-left" : "items-center text-center";

  const handleLike = () => {
    setLikePulse(true);
    setTimeout(() => setLikePulse(false), 500);
    onLike?.();
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden ${fontClass} ${cursorClass}`}>
      {/* Particle Effects */}
      <ParticleCanvas effect={particleEffect} accentColor={accent} />

      {/* Click Effects */}
      {clickEffect !== 'none' && <ClickEffect effect={clickEffect} />}

      {/* Background */}
      {profile.backgroundUrl && backgroundType === 'color' ? (
        <div
          className="fixed inset-0 z-0"
          style={{ backgroundColor: profile.backgroundUrl, opacity: bgOpacity }}
        />
      ) : profile.backgroundUrl && backgroundType === 'video' && !isGifMedia(profile.backgroundUrl) ? (
        <video
          autoPlay muted loop playsInline
          className="fixed inset-0 w-full h-full object-cover z-0"
          style={{ opacity: bgOpacity, filter: bgBlur > 0 ? `blur(${bgBlur}px)` : 'none' }}
        >
          <source src={profile.backgroundUrl} />
        </video>
      ) : profile.backgroundUrl ? (
        <div
          className="fixed inset-0 z-0 overflow-hidden"
          style={{
            opacity: bgOpacity,
            filter: bgBlur > 0 ? `blur(${bgBlur}px)` : 'none',
          }}
        >
          <MediaFill src={profile.backgroundUrl} alt="" />
        </div>
      ) : null}

      {/* Overlay */}
      <div
        className="fixed inset-0 z-0"
        style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)` }}
      />

      {/* Ambient glow blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full opacity-[0.08] animate-pulse"
          style={{ backgroundColor: glow, filter: 'blur(120px)' }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full opacity-[0.08] animate-pulse"
          style={{ backgroundColor: glow, filter: 'blur(120px)', animationDelay: '2s' }}
        />
      </div>

      {/* Content */}
      <div className={`relative z-10 max-w-2xl mx-auto px-4 py-16 flex flex-col ${alignClass} gap-0`}>

        {/* Banner */}
        {profile.bannerUrl && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-40 md:h-52 mb-12 rounded-xl overflow-hidden relative"
            style={{ border: `1px solid ${accent}22` }}
          >
            <MediaFill src={profile.bannerUrl} alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </motion.div>
        )}

        {/* Avatar + Name */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className={`flex flex-col ${alignClass} mb-6`}
        >
          <div className="relative mb-5">
            <div
              className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 relative"
              style={{
                borderColor: `${accent}80`,
                boxShadow: `0 0 0 4px ${accent}18, 0 0 40px ${glow}30`,
              }}
            >
              {profile.avatarUrl ? (
                <MediaFill src={profile.avatarUrl} alt={profile.username} />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  {profile.username?.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {profile.discordConnected && showDiscordPresence && (
              <div
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-black"
                style={{
                  backgroundColor: STATUS_COLORS[liveDiscordStatus] || STATUS_COLORS.offline,
                  boxShadow: `0 0 8px ${STATUS_COLORS[liveDiscordStatus] || STATUS_COLORS.offline}`,
                }}
              />
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-0.5">
            {profile.displayName || profile.username}
          </h1>

          <p className="text-sm mb-3 font-medium" style={{ color: accent }}>
            @{profile.username}
          </p>

          {typewriterTexts.length > 0 && (
            <p className="text-sm opacity-60 mb-3">
              <TypewriterText texts={typewriterTexts} speed={70} />
            </p>
          )}

          {profile.bio && (
            <p className="max-w-sm text-sm leading-relaxed opacity-70 mb-4 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-5 ${isLeft ? '' : 'justify-center'}`}>
              {profile.badges.slice(0, 6).map((badgeId) => {
                const customBadge = parseCustomBadge(badgeId);
                if (customBadge) {
                  return (
                    <motion.div
                      key={badgeId}
                      whileHover={{ scale: 1.08 }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${customBadge.color}18`,
                        color: customBadge.color,
                        border: `1px solid ${customBadge.color}40`,
                        boxShadow: `0 0 18px ${customBadge.color}22`,
                      }}
                      title={customBadge.label}
                    >
                      <span className="text-base leading-none">{customBadge.emoji}</span>
                      <span>{customBadge.label}</span>
                    </motion.div>
                  );
                }
                const badge = BADGE_MAP[badgeId];
                if (!badge) return null;
                const Icon = badge.icon;
                return (
                  <motion.div
                    key={badgeId}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: badge.bg, color: badge.color, border: `1px solid ${badge.color}30` }}
                  >
                    <Icon className="w-3 h-3" />
                    {badge.label}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div className={`flex items-center gap-5 mb-5 ${isLeft ? '' : 'justify-center'}`}>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{(profile.followersCount || 0).toLocaleString()}</span>
              <span className="label-caps">Seguidores</span>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: `${accent}30` }} />
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{(profile.likesCount || 0).toLocaleString()}</span>
              <span className="label-caps">Curtidas</span>
            </div>
            {showViews && (
              <>
                <div className="w-px h-8" style={{ backgroundColor: `${accent}30` }} />
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{(profile.viewsCount || 0).toLocaleString()}</span>
                  <span className="label-caps">Visitas</span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {!isOwner && onFollow && onLike && (
            <div className="flex gap-3 mb-6">
              <motion.button
                onClick={onFollow}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-7 py-2.5 text-sm font-semibold tracking-wider uppercase rounded-sm transition-all duration-200"
                style={isFollowing ? {
                  border: `1px solid ${accent}80`,
                  color: accent,
                  background: 'transparent',
                } : {
                  background: accent,
                  color: '#000',
                  boxShadow: `0 0 20px ${glow}40`,
                }}
              >
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </motion.button>

              <motion.button
                onClick={handleLike}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                className={`w-11 h-11 flex items-center justify-center rounded-sm border transition-all duration-200 ${likePulse ? 'scale-125' : ''}`}
                style={{
                  borderColor: hasLiked ? accent : 'rgba(255,255,255,0.15)',
                  background: hasLiked ? `${accent}18` : 'transparent',
                }}
              >
                <Heart
                  className="w-5 h-5 transition-all"
                  style={{ color: hasLiked ? accent : 'rgba(255,255,255,0.5)', fill: hasLiked ? accent : 'none' }}
                />
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Widgets */}
        <div className="w-full flex flex-col gap-3 mb-3">

          {/* Discord */}
          {profile.discordConnected && liveDiscordUsername && showDiscordPresence && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={`glass-card rounded-2xl px-3 py-2 flex items-center gap-2.5 w-fit max-w-[270px] ${isLeft ? '' : 'mx-auto'}`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-indigo-900/30 flex items-center justify-center">
                  {showDiscordAvatar && liveDiscordAvatarUrl ? (
                    <img src={liveDiscordAvatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <SiDiscord className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black"
                  style={{
                    backgroundColor: STATUS_COLORS[liveDiscordStatus] || STATUS_COLORS.offline,
                    boxShadow: `0 0 6px ${STATUS_COLORS[liveDiscordStatus] || STATUS_COLORS.offline}`,
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-semibold text-sm truncate">{liveDiscordUsername}</span>
                  {(profile as any).discordNitro && <Gem className="w-3.5 h-3.5 text-pink-400" />}
                  {(profile as any).discordBoost && <Crown className="w-3.5 h-3.5 text-fuchsia-400" />}
                </div>
                <p className="text-[11px] italic text-white/55 truncate mt-0.5">
                  {liveDiscordStatus === 'online' ? 'online now' :
                    liveDiscordStatus === 'idle' ? 'ausente' :
                    liveDiscordStatus === 'dnd' ? 'não perturbe' :
                    'offline'}
                </p>
                {liveDiscordActivity && (
                  <p className="text-[11px] opacity-45 truncate">{liveDiscordActivity}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Now Playing */}
          {!musicPrivate && profile.nowPlaying?.isPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-lg p-4 flex items-center gap-3 relative overflow-hidden"
            >
              {profile.nowPlaying.albumArt && (
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: `url(${profile.nowPlaying.albumArt})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(20px)',
                  }}
                />
              )}
              <div className="relative z-10 flex-shrink-0">
                {profile.nowPlaying.albumArt && (
                  <div className="relative">
                    <img src={profile.nowPlaying.albumArt} alt="" className="w-12 h-12 rounded object-cover" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black flex items-center justify-center border border-white/10">
                      {profile.musicService === 'spotify' ? (
                        <SiSpotify className="w-3 h-3 text-[#1DB954]" />
                      ) : (
                        <SiLastdotfm className="w-3 h-3 text-[#D51007]" />
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4].map(i => (
                      <span key={i} className="music-bar" style={{ color: '#1DB954', animationDelay: `${(i-1)*0.15}s` }} />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Tocando Agora</span>
                </div>
                <p className="font-bold text-sm truncate">{profile.nowPlaying.title}</p>
                <p className="text-xs opacity-50 truncate">{profile.nowPlaying.artist}</p>
                {profile.nowPlaying.progress != null && profile.nowPlaying.duration != null && (
                  <div className="mt-2 h-0.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-green-400/80 rounded-full"
                      style={{ width: `${(profile.nowPlaying.progress / profile.nowPlaying.duration) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Music Player (for musicUrl) */}
          {musicUrl && !profile.nowPlaying?.isPlaying && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <MusicPlayer musicUrl={musicUrl} musicTitle={musicTitle} musicIconUrl={musicIconUrl} />
            </motion.div>
          )}
        </div>

        {/* Links */}
        {profile.links && profile.links.length > 0 && (
          <div className={`w-full flex flex-wrap gap-3 mt-1 ${isLeft ? '' : 'justify-center'}`}>
            {[...profile.links].sort((a, b) => a.sortOrder - b.sortOrder).map((link, i) => {
              const Icon = PLATFORM_ICONS[link.platform.toLowerCase()] || LinkIcon;
              return (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  whileHover={{ y: -2, scale: 1.08 }}
                  className="group w-12 h-12 flex items-center justify-center rounded-full relative overflow-hidden transition-all duration-300"
                  style={{ color: accent, background: "transparent", border: `1px solid ${accent}22` }}
                  aria-label={link.label || link.platform}
                  title={link.label || link.platform}
                >
                  {link.iconUrl ? (
                    <img src={link.iconUrl} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </motion.a>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <a
            href="https://keefnow.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="label-caps hover:text-white/70 transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Feito com Faren · Keefnow
          </a>
        </div>
      </div>
    </div>
  );
}
