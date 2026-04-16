import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PublicProfile } from "@workspace/api-client-react";
import { SiDiscord, SiSpotify, SiLastdotfm, SiGithub, SiX, SiYoutube, SiTwitch, SiInstagram } from "react-icons/si";
import { ExternalLink, Link as LinkIcon, Music, BadgeCheck, Code, Gamepad2, Mic, Palette, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileViewProps {
  profile: Partial<PublicProfile>;
  isOwner?: boolean;
  onFollow?: () => void;
  onLike?: () => void;
  isFollowing?: boolean;
  hasLiked?: boolean;
}

const BADGE_MAP: Record<string, { icon: React.ElementType, label: string, color: string }> = {
  "verified": { icon: BadgeCheck, label: "Verified", color: "text-blue-400" },
  "creator": { icon: Palette, label: "Creator", color: "text-pink-400" },
  "music-head": { icon: Headphones, label: "Music Head", color: "text-green-400" },
  "gamer": { icon: Gamepad2, label: "Gamer", color: "text-purple-400" },
  "developer": { icon: Code, label: "Developer", color: "text-yellow-400" },
  "streamer": { icon: Mic, label: "Streamer", color: "text-red-400" },
  "artist": { icon: Palette, label: "Artist", color: "text-orange-400" },
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  "github": SiGithub,
  "twitter": SiX,
  "youtube": SiYoutube,
  "twitch": SiTwitch,
  "instagram": SiInstagram,
  "discord": SiDiscord,
  "spotify": SiSpotify,
};

export default function ProfileView({ profile, isOwner, onFollow, onLike, isFollowing, hasLiked }: ProfileViewProps) {
  const accentColor = profile.accentColor || "hsl(var(--primary))";
  const glowColor = profile.glowColor || accentColor;
  
  // Custom cursor styling if provided
  const cursorStyle = profile.cursorStyle === "crosshair" ? "cursor-crosshair" : 
                      profile.cursorStyle === "pointer" ? "cursor-pointer" : "cursor-default";

  return (
    <div 
      className={`min-h-screen relative overflow-x-hidden ${cursorStyle}`}
      style={{ 
        backgroundColor: "hsl(var(--background))",
        color: "hsl(var(--foreground))"
      }}
    >
      {/* Background Image & Overlay */}
      {profile.backgroundUrl && (
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{ 
            backgroundImage: `url(${profile.backgroundUrl})`,
            opacity: (profile.backgroundOpacity ?? 50) / 100
          }}
        />
      )}
      
      {/* Ambient Glow */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 animate-pulse"
          style={{ backgroundColor: glowColor }}
        />
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 animate-pulse"
          style={{ backgroundColor: glowColor, animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-24 max-w-3xl flex flex-col items-center">
        
        {/* Banner */}
        {profile.bannerUrl && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full h-48 md:h-64 rounded-3xl mb-16 relative overflow-hidden shadow-2xl border border-white/10"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.bannerUrl})` }}
            />
          </motion.div>
        )}

        {/* Profile Info */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className={`flex flex-col items-center text-center ${!profile.bannerUrl ? 'mt-12' : 'mt-[-8rem]'}`}
        >
          <div className="relative">
            <Avatar 
              className="w-32 h-32 md:w-40 md:h-40 border-4 shadow-2xl transition-all duration-300"
              style={{ borderColor: accentColor, boxShadow: `0 0 30px ${glowColor}40` }}
            >
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-4xl" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                {profile.username?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {profile.discordConnected && profile.discordStatus && profile.discordStatus !== 'offline' && (
              <div 
                className={`absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-background animate-pulse`}
                style={{ 
                  backgroundColor: 
                    profile.discordStatus === 'online' ? '#22c55e' : 
                    profile.discordStatus === 'idle' ? '#eab308' : 
                    profile.discordStatus === 'dnd' ? '#ef4444' : '#6b7280'
                }}
              />
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mt-6 mb-1 tracking-tight">
            {profile.displayName || profile.username}
          </h1>
          <p className="text-lg opacity-70 mb-4" style={{ color: accentColor }}>@{profile.username}</p>

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {profile.badges.map((badgeId) => {
                const badge = BADGE_MAP[badgeId];
                if (!badge) return null;
                const Icon = badge.icon;
                return (
                  <div 
                    key={badgeId}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-xs font-medium shadow-lg"
                  >
                    <Icon className={`w-3.5 h-3.5 ${badge.color}`} />
                    <span>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {profile.bio && (
            <p className="max-w-xl text-center text-lg leading-relaxed text-foreground/80 mb-8 whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Stats & Actions */}
          <div className="flex items-center gap-6 mb-10">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">{profile.followersCount || 0}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Followers</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">{profile.likesCount || 0}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Likes</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">{profile.viewsCount || 0}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Views</span>
            </div>
          </div>

          {!isOwner && onFollow && onLike && (
            <div className="flex gap-3 mb-10">
              <Button 
                onClick={onFollow}
                className="rounded-full px-8 h-12 font-bold transition-all shadow-lg"
                style={{ 
                  backgroundColor: isFollowing ? 'transparent' : accentColor,
                  border: isFollowing ? `2px solid ${accentColor}` : 'none',
                  color: isFollowing ? accentColor : '#fff',
                  boxShadow: isFollowing ? 'none' : `0 0 20px ${glowColor}60`
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button 
                onClick={onLike}
                variant="outline"
                className="rounded-full w-12 h-12 p-0 border-white/10 bg-black/20 backdrop-blur-md hover:bg-white/10"
              >
                <HeartIcon filled={hasLiked} color={accentColor} />
              </Button>
            </div>
          )}
        </motion.div>

        {/* Widgets Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          
          {/* Discord Widget */}
          {profile.discordConnected && profile.discordUsername && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-black/50 transition-colors"
            >
              <div className="relative">
                <Avatar className="w-14 h-14 border border-white/10">
                  <AvatarImage src={profile.discordAvatarUrl || undefined} />
                  <AvatarFallback className="bg-indigo-900/50 text-indigo-400">
                    <SiDiscord className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                {profile.discordStatus && profile.discordStatus !== 'offline' && (
                  <div 
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black"
                    style={{ 
                      backgroundColor: 
                        profile.discordStatus === 'online' ? '#22c55e' : 
                        profile.discordStatus === 'idle' ? '#eab308' : 
                        profile.discordStatus === 'dnd' ? '#ef4444' : '#6b7280'
                    }}
                  />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold truncate">{profile.discordUsername}</h3>
                  <SiDiscord className="text-indigo-400 w-4 h-4 flex-shrink-0" />
                </div>
                {profile.discordActivity ? (
                  <p className="text-sm text-muted-foreground truncate">{profile.discordActivity}</p>
                ) : (
                  <p className="text-sm text-muted-foreground capitalize">{profile.discordStatus || 'Offline'}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Now Playing Widget */}
          {profile.nowPlaying && profile.nowPlaying.isPlaying && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden group"
            >
              {profile.nowPlaying.albumArt && (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl transition-opacity group-hover:opacity-30"
                  style={{ backgroundImage: `url(${profile.nowPlaying.albumArt})` }}
                />
              )}
              <div className="relative z-10 flex-shrink-0">
                <img 
                  src={profile.nowPlaying.albumArt || ''} 
                  alt="Album Art" 
                  className="w-14 h-14 rounded-lg shadow-lg object-cover"
                />
                <div className="absolute -bottom-2 -right-2 bg-black rounded-full p-1 border border-white/10">
                  {profile.musicService === 'spotify' ? (
                    <SiSpotify className="w-4 h-4 text-[#1DB954]" />
                  ) : profile.musicService === 'lastfm' ? (
                    <SiLastdotfm className="w-4 h-4 text-[#D51007]" />
                  ) : (
                    <Music className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
              <div className="relative z-10 flex-1 overflow-hidden">
                <div className="text-xs font-medium text-green-400 mb-1 flex items-center gap-1.5 animate-pulse">
                  <Music className="w-3 h-3" /> Listening to
                </div>
                <h3 className="font-bold text-sm truncate">{profile.nowPlaying.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{profile.nowPlaying.artist}</p>
                
                {profile.nowPlaying.progress && profile.nowPlaying.duration && (
                  <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-white/80 rounded-full" 
                      style={{ width: `${(profile.nowPlaying.progress / profile.nowPlaying.duration) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Links Grid */}
        {profile.links && profile.links.length > 0 && (
          <div className="w-full flex flex-col gap-3">
            {profile.links.sort((a, b) => a.sortOrder - b.sortOrder).map((link, i) => {
              const Icon = PLATFORM_ICONS[link.platform.toLowerCase()] || LinkIcon;
              
              return (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.05) }}
                  className="group relative flex items-center p-4 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl hover:bg-black/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  style={{ boxShadow: `0 4px 20px ${glowColor}00`, hover: { boxShadow: `0 8px 30px ${glowColor}30`, borderColor: `${accentColor}80` } } as any}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
                  />
                  <div className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300" style={{ color: accentColor }}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 font-semibold text-lg">{link.label}</div>
                  <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-white/50 -translate-x-4 group-hover:translate-x-0 duration-300" />
                </motion.a>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

function HeartIcon({ filled, color }: { filled?: boolean, color: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill={filled ? color : "none"} 
      stroke={filled ? color : "currentColor"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-6 h-6 transition-all"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
