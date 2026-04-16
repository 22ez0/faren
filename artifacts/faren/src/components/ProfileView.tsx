import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PublicProfile } from "@workspace/api-client-react";
import {
  SiDiscord, SiSpotify, SiLastdotfm, SiGithub, SiX, SiYoutube,
  SiTwitch, SiInstagram, SiTiktok, SiSteam, SiKick,
  SiPatreon, SiSnapchat, SiReddit, SiPinterest, SiMastodon,
  SiThreads, SiBluesky, SiSoundcloud, SiBandcamp, SiItchdotio,
} from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import {
  ExternalLink, Link as LinkIcon, Music, BadgeCheck, Code, Gamepad2,
  Mic, Palette, Headphones, Star, Zap, Crown, Globe, Heart, Eye,
  Users, ChevronRight,
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
  verified:    { icon: BadgeCheck, label: "Verified",     color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
  creator:     { icon: Palette,    label: "Creator",      color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  "music-head":{ icon: Headphones, label: "Music Head",   color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  gamer:       { icon: Gamepad2,   label: "Gamer",        color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  developer:   { icon: Code,       label: "Developer",    color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  streamer:    { icon: Mic,        label: "Streamer",     color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  artist:      { icon: Palette,    label: "Artist",       color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  star:        { icon: Star,       label: "Rising Star",  color: "#fde68a", bg: "rgba(253,230,138,0.12)" },
  og:          { icon: Crown,      label: "OG Member",    color: "#c4b5fd", bg: "rgba(196,181,253,0.12)" },
  vip:         { icon: Zap,        label: "VIP",          color: "#f9a8d4", bg: "rgba(249,168,212,0.12)" },
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  github: SiGithub, twitter: SiX, x: SiX, youtube: SiYoutube,
  twitch: SiTwitch, instagram: SiInstagram, discord: SiDiscord,
  spotify: SiSpotify, tiktok: SiTiktok, linkedin: FaLinkedin,
  steam: SiSteam, kick: SiKick, patreon: SiPatreon,
  snapchat: SiSnapchat, reddit: SiReddit, pinterest: SiPinterest,
  mastodon: SiMastodon, threads: SiThreads, bluesky: SiBluesky,
  soundcloud: SiSoundcloud, bandcamp: SiBandcamp, itch: SiItchdotio,
  website: Globe,
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
  const label = status === 'dnd' ? 'Do Not Disturb' : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="text-xs opacity-60">{label}</span>
    </div>
  );
}

export default function ProfileView({ profile, isOwner, onFollow, onLike, isFollowing, hasLiked }: ProfileViewProps) {
  const [likePulse, setLikePulse] = useState(false);

  const accent = profile.accentColor || "#8b5cf6";
  const glow = profile.glowColor || accent;
  const fontClass = FONT_CLASSES[profile.fontFamily || "default"] || FONT_CLASSES.default;
  const layout = profile.layoutStyle || "centered";
  const particleEffect = profile.particleEffect || "none";
  const clickEffect = profile.clickEffect || "none";
  const showViews = profile.showViews !== false;
  const bgBlur = profile.backgroundBlur || 0;
  const bgOpacity = (profile.backgroundOpacity ?? 60) / 100;
  const typewriterTexts = profile.typewriterTexts || [];

  const cursorClass =
    profile.cursorStyle === "crosshair" ? "cursor-crosshair" :
    profile.cursorStyle === "none" ? "cursor-none" :
    "cursor-auto";

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
      {profile.backgroundUrl && (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${profile.backgroundUrl})`,
            opacity: bgOpacity,
            filter: bgBlur > 0 ? `blur(${bgBlur}px)` : 'none',
          }}
        />
      )}

      {/* Overlay */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)`,
        }}
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
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.bannerUrl})` }}
            />
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
                <img src={profile.avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold"
                  style={{ backgroundColor: `${accent}20`, color: accent }}
                >
                  {profile.username?.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Discord status dot on avatar */}
            {profile.discordConnected && profile.discordStatus && (
              <div
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] border-black"
                style={{
                  backgroundColor: STATUS_COLORS[profile.discordStatus] || STATUS_COLORS.offline,
                  boxShadow: `0 0 8px ${STATUS_COLORS[profile.discordStatus] || STATUS_COLORS.offline}`,
                }}
              />
            )}
          </div>

          {/* Display name */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-0.5">
            {profile.displayName || profile.username}
          </h1>

          {/* Username */}
          <p className="text-sm mb-3 font-medium" style={{ color: accent }}>
            @{profile.username}
          </p>

          {/* Typewriter bio */}
          {typewriterTexts.length > 0 && (
            <p className="text-sm opacity-60 mb-3">
              <TypewriterText texts={typewriterTexts} speed={70} />
            </p>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="max-w-sm text-sm leading-relaxed opacity-70 mb-4 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className={`flex flex-wrap gap-2 mb-5 ${isLeft ? '' : 'justify-center'}`}>
              {profile.badges.map((badgeId) => {
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
              <span className="label-caps">Followers</span>
            </div>
            <div className="w-px h-8" style={{ backgroundColor: `${accent}30` }} />
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{(profile.likesCount || 0).toLocaleString()}</span>
              <span className="label-caps">Likes</span>
            </div>
            {showViews && (
              <>
                <div className="w-px h-8" style={{ backgroundColor: `${accent}30` }} />
                <div className="flex flex-col items-center">
                  <span className="text-xl font-bold">{(profile.viewsCount || 0).toLocaleString()}</span>
                  <span className="label-caps">Views</span>
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
                  color: '#fff',
                  boxShadow: `0 0 20px ${glow}40`,
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
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
          {profile.discordConnected && profile.discordUsername && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card rounded-lg p-4 flex items-center gap-3"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-indigo-900/30 flex items-center justify-center">
                  {profile.discordAvatarUrl ? (
                    <img src={profile.discordAvatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <SiDiscord className="w-5 h-5 text-indigo-400" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <SiDiscord className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span className="font-semibold text-sm truncate">{profile.discordUsername}</span>
                </div>
                {profile.discordStatus && <DiscordStatus status={profile.discordStatus} />}
                {profile.discordActivity && (
                  <p className="text-xs opacity-50 truncate mt-0.5">{profile.discordActivity}</p>
                )}
                {profile.discordStatusEmoji && (
                  <p className="text-xs opacity-50 mt-0.5">{profile.discordStatusEmoji}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Now Playing */}
          {profile.nowPlaying?.isPlaying && (
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
                    <img
                      src={profile.nowPlaying.albumArt}
                      alt=""
                      className="w-12 h-12 rounded object-cover"
                    />
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
                  <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Now Playing</span>
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
        </div>

        {/* Links */}
        {profile.links && profile.links.length > 0 && (
          <div className="w-full flex flex-col gap-2.5 mt-1">
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
                  whileHover={{ y: -2, boxShadow: `0 8px 30px ${glow}20` }}
                  className="group flex items-center p-4 glass-card rounded-lg relative overflow-hidden transition-all duration-300"
                  style={{ borderColor: `${accent}10` }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, ${accent}08, transparent)` }}
                  />
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 mr-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${accent}18`, color: accent }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 font-semibold text-sm relative z-10">{link.label}</span>
                  <ChevronRight
                    className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-all duration-300 -translate-x-2 group-hover:translate-x-0 relative z-10"
                  />
                </motion.a>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <a
            href="/"
            className="label-caps hover:text-white/70 transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Powered by Faren
          </a>
        </div>
      </div>
    </div>
  );
}
