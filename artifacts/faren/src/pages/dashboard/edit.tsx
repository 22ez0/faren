import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMyProfile, useUpdateProfile, useAddProfileLink, useDeleteProfileLink } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import ProfileView from "@/components/ProfileView";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Upload, X, Link as LinkIcon, Music, Image, ExternalLink, Eye } from "lucide-react";
import { VisualOptionCard, SectionHeader, SliderCard, FarenGlyph } from "@/components/edit/VisualOptionCard";
import {
  ParticlePreview,
  ClickPreview,
  CursorPreview,
  BackgroundTypePreview,
  ColorPreview,
  FontPreview,
  BadgePreview,
  SocialPlatformPreview,
  TogglePreview,
  ConnectionPreview,
} from "@/components/edit/Previews";
import {
  SiDiscord, SiSpotify, SiLastdotfm, SiGithub, SiX, SiYoutube, SiTwitch, SiInstagram,
  SiTiktok, SiSteam, SiKick, SiPatreon, SiSnapchat, SiReddit, SiPinterest, SiThreads,
  SiBluesky, SiSoundcloud, SiBandcamp, SiTelegram, SiPaypal, SiGitlab, SiFacebook,
  SiLinktree, SiLetterboxd, SiVk, SiKofi, SiBitcoin, SiEthereum, SiSolana,
  SiRoblox, SiVenmo, SiCashapp,
} from "react-icons/si";
import { FaPlaystation, FaLinkedin } from "react-icons/fa";
import { Mail, Globe } from "lucide-react";

interface ProfileFormState {
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  backgroundUrl: string;
  backgroundType: string;
  accentColor: string;
  glowColor: string;
  nameBorderOpacity: number;
  backgroundOpacity: number;
  backgroundBlur: number;
  cursorStyle: string;
  musicUrl: string;
  musicTitle: string;
  musicIconUrl: string;
  musicPrivate: boolean;
  particleEffect: string;
  clickEffect: string;
  fontFamily: string;
  layoutStyle: string;
  typewriterTexts: string[];
  profileTitle: string;
  showViews: boolean;
  showDiscordAvatar: boolean;
  showDiscordPresence: boolean;
  badges: string[];
}

const PARTICLE_OPTIONS = [
  { value: 'none', label: 'Nenhum' },
  { value: 'snow', label: '❄️ Neve' },
  { value: 'stars', label: '⭐ Estrelas' },
  { value: 'sakura', label: '🌸 Sakura' },
  { value: 'fireflies', label: '✨ Vagalumes' },
  { value: 'bubbles', label: '🫧 Bolhas' },
  { value: 'rain', label: '🌧️ Chuva' },
  { value: 'raio', label: '⚡ Raios' },
];

const CLICK_OPTIONS = [
  { value: 'none', label: 'Nenhum' },
  { value: 'hearts', label: '❤️ Corações' },
  { value: 'stars', label: '⭐ Estrelas' },
  { value: 'sparkles', label: '✦ Brilhos' },
  { value: 'explosions', label: '💥 Explosões' },
];

const CURSOR_OPTIONS = [
  { value: 'auto', label: 'Padrão' },
  { value: 'pointer', label: 'Ponteiro' },
  { value: 'crosshair', label: 'Mira' },
  { value: 'cell', label: 'Célula' },
  { value: 'grab', label: 'Mão' },
  { value: 'zoom-in', label: 'Zoom' },
  { value: 'text', label: 'Texto' },
  { value: 'none', label: 'Oculto' },
];

const FONT_OPTIONS = [
  { value: 'default', label: 'Inter (Padrão)' },
  { value: 'mono', label: 'Monoespaçada' },
  { value: 'cursive', label: 'Cursiva' },
  { value: 'serif', label: 'Serifada' },
  { value: 'pixel', label: 'Pixel 8-Bit' },
];

const LAYOUT_OPTIONS: { value: string; label: string; description: string; preview: 'centered' | 'left' }[] = [
  { value: 'centered', label: 'Centralizado', description: 'Avatar e textos no centro, ideal para destaque.', preview: 'centered' },
  { value: 'left', label: 'Alinhado à Esquerda', description: 'Avatar e infos à esquerda, estilo card lateral.', preview: 'left' },
];

function LayoutPreview({ variant, selected }: { variant: 'centered' | 'left'; selected: boolean }) {
  const stroke = selected ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)';
  const fill = selected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)';
  if (variant === 'centered') {
    return (
      <svg viewBox="0 0 120 80" className="w-full h-20" aria-hidden="true">
        <rect x="2" y="2" width="116" height="76" rx="6" fill="none" stroke={stroke} strokeWidth="1" />
        <rect x="6" y="6" width="108" height="18" rx="4" fill={fill} />
        <circle cx="60" cy="34" r="8" fill={fill} stroke={stroke} strokeWidth="0.5" />
        <rect x="44" y="46" width="32" height="4" rx="2" fill={stroke} />
        <rect x="38" y="54" width="44" height="2.5" rx="1" fill={fill} />
        <rect x="38" y="60" width="44" height="2.5" rx="1" fill={fill} />
        <rect x="48" y="68" width="6" height="6" rx="2" fill={fill} />
        <rect x="57" y="68" width="6" height="6" rx="2" fill={fill} />
        <rect x="66" y="68" width="6" height="6" rx="2" fill={fill} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 80" className="w-full h-20" aria-hidden="true">
      <rect x="2" y="2" width="116" height="76" rx="6" fill="none" stroke={stroke} strokeWidth="1" />
      <rect x="6" y="6" width="108" height="18" rx="4" fill={fill} />
      <circle cx="20" cy="36" r="8" fill={fill} stroke={stroke} strokeWidth="0.5" />
      <rect x="32" y="32" width="40" height="4" rx="2" fill={stroke} />
      <rect x="32" y="40" width="60" height="2.5" rx="1" fill={fill} />
      <rect x="32" y="46" width="48" height="2.5" rx="1" fill={fill} />
      <rect x="6" y="58" width="8" height="8" rx="2" fill={fill} />
      <rect x="16" y="58" width="8" height="8" rx="2" fill={fill} />
      <rect x="26" y="58" width="8" height="8" rx="2" fill={fill} />
      <rect x="36" y="58" width="8" height="8" rx="2" fill={fill} />
    </svg>
  );
}

const LAYOUT_DETAILS: Record<string, { tagline: string; bestFor: string[]; tradeoffs: string[] }> = {
  centered: {
    tagline: 'Foco visual no avatar e no nome — estilo cartão de apresentação.',
    bestFor: [
      'Perfis pessoais minimalistas',
      'Quando seu avatar é a peça principal',
      'Bio curta (até 1–2 linhas)',
      'Layout simétrico que respira',
    ],
    tradeoffs: [
      'Bios longas ficam apertadas',
      'Menos espaço útil em telas largas',
    ],
  },
  left: {
    tagline: 'Avatar e textos à esquerda — mais espaço para bio e links lado a lado.',
    bestFor: [
      'Bios longas e descrição detalhada',
      'Quem mostra muitos links e redes',
      'Visual de portfólio / dossiê',
      'Aproveita melhor telas largas',
    ],
    tradeoffs: [
      'Foco visual menos centrado no avatar',
      'Pode parecer pesado se a bio for curta',
    ],
  },
};

/* ── Real, data-driven layout previews ─────────────────────── */
function MiniPlatformIcon({ platform }: { platform: string }) {
  const plat = SOCIAL_PLATFORMS.find(p => p.value === platform);
  const Icon = plat?.icon || LinkIcon;
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: plat?.color ? `${plat.color}26` : 'rgba(255,255,255,0.08)',
        color: plat?.color || '#fff',
      }}
    >
      <Icon className="w-3 h-3" />
    </div>
  );
}

function RealLayoutPreview({
  variant,
  data,
}: {
  variant: 'centered' | 'left';
  data: { avatarUrl: string; displayName: string; username: string; bio: string; links: any[]; accentColor: string };
}) {
  const initials = (data.displayName || data.username || '?').slice(0, 2).toUpperCase();
  // Pick up to 5 link icons
  const socialLinks = (data.links || []).slice(0, 5);

  // Subtle background to evoke "this is your profile"
  const frame = (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-zinc-900 via-black to-zinc-950">
      <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_75%_85%,rgba(255,255,255,0.12),transparent_55%)]" />
      <div className="relative h-full p-4 flex flex-col">
        {variant === 'centered' ? (
          <>
            {/* Avatar centered */}
            <div className="flex flex-col items-center text-center mt-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-black/50">
                {data.avatarUrl ? (
                  <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <p className="mt-2.5 text-white text-[13px] font-bold tracking-wide truncate max-w-full px-2">
                {data.displayName || data.username}
              </p>
              <p className="mt-0.5 text-white/40 text-[10px] truncate max-w-full px-2">
                {data.bio || 'sua bio aqui'}
              </p>
              {socialLinks.length > 0 && (
                <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
                  {socialLinks.map((l, i) => <MiniPlatformIcon key={i} platform={l.platform} />)}
                </div>
              )}
            </div>
            {/* Link cards stack */}
            <div className="mt-auto flex flex-col gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="h-7 rounded-xl bg-white/[0.06] border border-white/10 flex items-center px-2 gap-2"
                >
                  <div className="w-3 h-3 rounded-full bg-white/30" />
                  <div className="h-1.5 rounded-full bg-white/15" style={{ width: `${50 + i * 10}%` }} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Avatar + name on the left */}
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-black/50">
                {data.avatarUrl ? (
                  <img src={data.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-bold tracking-wide truncate">
                  {data.displayName || data.username}
                </p>
                <p className="mt-0.5 text-white/40 text-[10px] line-clamp-2 leading-tight">
                  {data.bio || 'sua bio aqui'}
                </p>
                {socialLinks.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {socialLinks.map((l, i) => <MiniPlatformIcon key={i} platform={l.platform} />)}
                  </div>
                )}
              </div>
            </div>
            {/* Link cards stack */}
            <div className="mt-auto flex flex-col gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-6 rounded-xl bg-white/[0.06] border border-white/10 flex items-center px-2 gap-2"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                  <div className="h-1.5 rounded-full bg-white/15" style={{ width: `${40 + i * 12}%` }} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
  return frame;
}

function LayoutTabPanel({
  form,
  set,
  profile,
}: {
  form: ProfileFormState;
  set: (k: keyof ProfileFormState, v: any) => void;
  profile: any;
}) {
  const previewData = {
    avatarUrl: form.avatarUrl || (profile as any)?.avatarUrl || '',
    displayName: form.displayName || (profile as any)?.username || 'Seu nome',
    username: (profile as any)?.username || 'voce',
    bio: form.bio || (profile as any)?.bio || 'Adicione uma bio na aba Básico',
    links: (profile as any)?.links || [],
    accentColor: form.accentColor || '#ffffff',
  };

  const fontPreviewClass: Record<string, string> = {
    default: 'font-sans',
    mono: 'font-mono',
    cursive: 'italic',
    serif: 'font-serif',
    pixel: 'font-mono tracking-widest',
  };

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold uppercase tracking-[0.18em] text-white">Layout do perfil</h2>
        <p className="text-xs text-white/45 mt-1.5 leading-relaxed">
          Escolha como suas informações ficam organizadas na sua página pública.
          As prévias abaixo usam <span className="text-white">seu avatar, nome, bio e redes</span> reais —
          é exatamente o que seus visitantes vão ver.
        </p>
      </div>

      {/* Layout cards with REAL previews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LAYOUT_OPTIONS.map(opt => {
          const isSelected = form.layoutStyle === opt.value;
          const detail = LAYOUT_DETAILS[opt.value];
          return (
            <button
              key={opt.value}
              onClick={() => set('layoutStyle', opt.value)}
              className="group text-left rounded-2xl border transition-all overflow-hidden"
              style={{
                backgroundColor: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.015)',
                borderColor: isSelected ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.08)',
                boxShadow: isSelected ? '0 0 0 1px rgba(255,255,255,0.15)' : 'none',
              }}
            >
              {/* Real preview */}
              <div className="p-4 pb-3">
                <RealLayoutPreview variant={opt.preview} data={previewData} />
              </div>

              {/* Label + active badge */}
              <div className="px-4 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">{opt.label}</h3>
                {isSelected ? (
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-white text-black">
                    Em uso
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 rounded-full border border-white/15 text-white/40 group-hover:text-white group-hover:border-white/40 transition-colors">
                    Escolher
                  </span>
                )}
              </div>

              {/* Tagline */}
              <p className="px-4 mt-2 text-xs text-white/55 leading-relaxed">{detail?.tagline}</p>

              {/* Best for */}
              <div className="px-4 pt-4 pb-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/35 mb-2">Bom para</p>
                <ul className="space-y-1.5">
                  {detail?.bestFor.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-white/70">
                      <span className="mt-1 w-1 h-1 rounded-full bg-white/60 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {detail?.tradeoffs && detail.tradeoffs.length > 0 && (
                  <>
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/35 mt-3 mb-2">Atenção</p>
                    <ul className="space-y-1.5">
                      {detail.tradeoffs.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] text-white/45">
                          <span className="mt-1 w-1 h-1 rounded-full bg-white/30 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="glow-line" />

      {/* Font selector with real preview */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-bold uppercase tracking-[0.18em] text-white">Tipografia</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-semibold">
            Aplica em todo o seu perfil
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {FONT_OPTIONS.map(opt => {
            const isSelected = form.fontFamily === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => set('fontFamily', opt.value)}
                className="rounded-2xl border p-4 transition-all text-left"
                style={{
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                  borderColor: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <p className={`text-2xl text-white ${fontPreviewClass[opt.value] || ''}`}>
                  {previewData.displayName.slice(0, 8) || 'Faren'}
                </p>
                <p className={`text-xs text-white/45 mt-1 ${fontPreviewClass[opt.value] || ''}`}>
                  abc 123 • {opt.label}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full bg-white text-black">
                      Em uso
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

const BADGE_OPTIONS = [
  { value: 'creator', label: '🎨 Criador' },
  { value: 'music-head', label: '🎧 Amante de Música' },
  { value: 'gamer', label: '🎮 Gamer' },
  { value: 'developer', label: '💻 Desenvolvedor' },
  { value: 'streamer', label: '🎙 Streamer' },
  { value: 'artist', label: '🖌 Artista' },
  { value: 'star', label: '⭐ Estrela em Ascensão' },
  { value: 'og', label: '👑 Membro OG' },
  { value: 'vip', label: '⚡ VIP' },
];

const SOCIAL_PLATFORMS = [
  { value: 'youtube', label: 'YouTube', icon: SiYoutube, color: '#FF0000', placeholder: 'https://youtube.com/@canal' },
  { value: 'instagram', label: 'Instagram', icon: SiInstagram, color: '#E1306C', placeholder: 'https://instagram.com/usuario' },
  { value: 'tiktok', label: 'TikTok', icon: SiTiktok, color: '#fff', placeholder: 'https://tiktok.com/@usuario' },
  { value: 'twitter', label: 'X / Twitter', icon: SiX, color: '#fff', placeholder: 'https://x.com/usuario' },
  { value: 'discord', label: 'Discord', icon: SiDiscord, color: '#5865F2', placeholder: 'https://discord.gg/convite' },
  { value: 'spotify', label: 'Spotify', icon: SiSpotify, color: '#1DB954', placeholder: 'https://open.spotify.com/user/...' },
  { value: 'telegram', label: 'Telegram', icon: SiTelegram, color: '#2CA5E0', placeholder: 'https://t.me/usuario' },
  { value: 'soundcloud', label: 'SoundCloud', icon: SiSoundcloud, color: '#FF5500', placeholder: 'https://soundcloud.com/usuario' },
  { value: 'github', label: 'GitHub', icon: SiGithub, color: '#fff', placeholder: 'https://github.com/usuario' },
  { value: 'roblox', label: 'Roblox', icon: SiRoblox, color: '#E00', placeholder: 'https://roblox.com/users/...' },
  { value: 'cashapp', label: 'Cash App', icon: SiCashapp, color: '#00D632', placeholder: 'https://cash.app/$usuario' },
  { value: 'venmo', label: 'Venmo', icon: SiVenmo, color: '#3D95CE', placeholder: 'https://venmo.com/usuario' },
  { value: 'playstation', label: 'PlayStation', icon: FaPlaystation, color: '#003087', placeholder: 'https://psnprofiles.com/usuario' },
  { value: 'gitlab', label: 'GitLab', icon: SiGitlab, color: '#FC6D26', placeholder: 'https://gitlab.com/usuario' },
  { value: 'twitch', label: 'Twitch', icon: SiTwitch, color: '#9146FF', placeholder: 'https://twitch.tv/usuario' },
  { value: 'reddit', label: 'Reddit', icon: SiReddit, color: '#FF4500', placeholder: 'https://reddit.com/u/usuario' },
  { value: 'vk', label: 'VK', icon: SiVk, color: '#4680C2', placeholder: 'https://vk.com/usuario' },
  { value: 'letterboxd', label: 'Letterboxd', icon: SiLetterboxd, color: '#00CE7E', placeholder: 'https://letterboxd.com/usuario' },
  { value: 'bluesky', label: 'Bluesky', icon: SiBluesky, color: '#0085FF', placeholder: 'https://bsky.app/profile/usuario' },
  { value: 'linktree', label: 'Linktree', icon: SiLinktree, color: '#39E09B', placeholder: 'https://linktr.ee/usuario' },
  { value: 'bandcamp', label: 'Bandcamp', icon: SiBandcamp, color: '#629AA9', placeholder: 'https://usuario.bandcamp.com' },
  { value: 'linkedin', label: 'LinkedIn', icon: FaLinkedin, color: '#0077B5', placeholder: 'https://linkedin.com/in/usuario' },
  { value: 'steam', label: 'Steam', icon: SiSteam, color: '#fff', placeholder: 'https://steamcommunity.com/id/usuario' },
  { value: 'kick', label: 'Kick', icon: SiKick, color: '#53FC18', placeholder: 'https://kick.com/usuario' },
  { value: 'pinterest', label: 'Pinterest', icon: SiPinterest, color: '#E60023', placeholder: 'https://pinterest.com/usuario' },
  { value: 'lastfm', label: 'Last.fm', icon: SiLastdotfm, color: '#D51007', placeholder: 'https://last.fm/user/usuario' },
  { value: 'patreon', label: 'Patreon', icon: SiPatreon, color: '#FF424D', placeholder: 'https://patreon.com/usuario' },
  { value: 'kofi', label: 'Ko-fi', icon: SiKofi, color: '#29ABE0', placeholder: 'https://ko-fi.com/usuario' },
  { value: 'facebook', label: 'Facebook', icon: SiFacebook, color: '#1877F2', placeholder: 'https://facebook.com/usuario' },
  { value: 'threads', label: 'Threads', icon: SiThreads, color: '#fff', placeholder: 'https://threads.net/@usuario' },
  { value: 'snapchat', label: 'Snapchat', icon: SiSnapchat, color: '#FFFC00', placeholder: 'https://snapchat.com/add/usuario' },
  { value: 'paypal', label: 'PayPal', icon: SiPaypal, color: '#0079C1', placeholder: 'https://paypal.me/usuario' },
  { value: 'bitcoin', label: 'Bitcoin', icon: SiBitcoin, color: '#F7931A', placeholder: 'bitcoin:endereco' },
  { value: 'ethereum', label: 'Ethereum', icon: SiEthereum, color: '#627EEA', placeholder: '0xendereco...' },
  { value: 'solana', label: 'Solana', icon: SiSolana, color: '#9945FF', placeholder: 'endereco_solana...' },
  { value: 'email', label: 'E-mail', icon: Mail, color: '#fff', placeholder: 'mailto:email@exemplo.com' },
  { value: 'website', label: 'Website', icon: Globe, color: '#fff', placeholder: 'https://meusite.com' },
];

const TABS = ['Básico', 'Tema', 'Layout', 'Efeitos', 'Links', 'Avançado'];

function isAttachedFile(value?: string) {
  return !!value && value.startsWith('data:');
}

const moduleApiBase = () => (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

async function uploadFileToR2(file: File, prefix: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file, file.name);
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || '';
  const url = `${moduleApiBase()}/api/profile/upload?prefix=${encodeURIComponent(prefix)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  if (!res.ok) {
    let msg = `Falha no upload (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  if (!data?.url) throw new Error('Resposta inválida do servidor');
  return data.url as string;
}

function decodeBadgePart(value?: string, fallback = '') {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sanitizeEmoji(value: string) {
  const chars = Array.from(value).filter(char => char.trim() && !/[A-Za-z0-9#]/.test(char));
  return chars.slice(0, 2).join('');
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="label-caps">{label}</label>
      {children}
    </div>
  );
}

function StyledInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors rounded-xl ${props.className || ''}`}
    />
  );
}

function StyledSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 transition-colors rounded-xl appearance-none"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-[#0d0d0d]">{opt.label}</option>
      ))}
    </select>
  );
}

function FileUploadButton({ onFile, accept, children, prefix, onError }: { onFile: (url: string, file: File) => void; accept?: string; children: React.ReactNode; prefix: string; onError?: (msg: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFileToR2(file, prefix);
      onFile(url, file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha no upload';
      if (onError) onError(msg); else console.error('[upload]', msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={accept || 'image/*'} onChange={handleChange} className="hidden" disabled={uploading} />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="px-3 py-2.5 border border-white/15 hover:border-white/30 text-white/50 hover:text-white transition-all rounded-xl flex items-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="w-3.5 h-3.5" />
        {uploading ? 'Enviando...' : children}
      </button>
    </>
  );
}

function MediaUrlInput({
  value,
  onUrl,
  onFile,
  accept = 'image/*,video/*',
  placeholder = 'https://...',
  buttonLabel = 'Arquivo',
  prefix,
  onError,
}: {
  value: string;
  onUrl: (value: string) => void;
  onFile: (url: string, file: File) => void;
  accept?: string;
  placeholder?: string;
  buttonLabel?: React.ReactNode;
  prefix: string;
  onError?: (msg: string) => void;
}) {
  if (isAttachedFile(value)) {
    return (
      <div className="flex gap-2 w-full">
        <div className="flex-1 bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white/45 rounded-xl truncate">
          Arquivo anexado ✓
        </div>
        <FileUploadButton onFile={onFile} accept={accept} prefix={prefix} onError={onError}>
          {buttonLabel}
        </FileUploadButton>
        <button
          type="button"
          onClick={() => onUrl('')}
          className="px-3 py-2.5 border border-white/15 hover:border-red-400/50 text-white/40 hover:text-red-300 transition-all rounded-xl"
          aria-label="Remover arquivo"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 w-full">
      <StyledInput value={value} onChange={e => onUrl(e.target.value)} placeholder={placeholder} className="flex-1" />
      <FileUploadButton onFile={onFile} accept={accept} prefix={prefix} onError={onError}>
        {buttonLabel}
      </FileUploadButton>
    </div>
  );
}

function FileOnlyUpload({
  value,
  onFile,
  onClear,
  accept = 'image/*,video/*',
  label = 'Selecionar arquivo',
  previewStyle = 'avatar',
  prefix,
  onError,
}: {
  value: string;
  onFile: (url: string, file: File) => void;
  onClear: () => void;
  accept?: string;
  label?: string;
  previewStyle?: 'avatar' | 'banner';
  prefix: string;
  onError?: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setLocalPreview(null);
  }, [value]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = '';
      return;
    }

    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
    } catch {}

    setUploading(true);
    try {
      const url = await uploadFileToR2(file, prefix);
      onFile(url, file);
      setLocalPreview(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha no upload';
      if (onError) onError(msg); else console.error('[upload]', msg);
      setLocalPreview(null);
    } finally {
      e.target.value = '';
      if (objectUrl) {
        const toRevoke = objectUrl;
        setTimeout(() => { try { URL.revokeObjectURL(toRevoke); } catch {} }, 200);
      }
      setUploading(false);
    }
  };

  const openPicker = () => {
    if (!inputRef.current) return;
    inputRef.current.value = '';
    inputRef.current.click();
  };

  const preview = localPreview || value;
  const isVideo = !!preview && (preview.startsWith('data:video') || preview.startsWith('blob:') || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(preview));

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" disabled={uploading} />
      <div className="flex gap-2 items-center">
        <button
          type="button"
          disabled={uploading}
          onClick={openPicker}
          className="flex items-center gap-2 px-3 py-2.5 border border-white/15 hover:border-white/30 text-white/50 hover:text-white transition-all rounded-xl text-xs font-semibold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? 'Enviando...' : preview ? 'Trocar arquivo' : label}
        </button>
        {preview && !uploading && (
          <button
            type="button"
            onClick={() => { setLocalPreview(null); onClear(); }}
            className="px-3 py-2.5 border border-white/15 hover:border-red-400/50 text-white/40 hover:text-red-300 transition-all rounded-xl"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {preview && (
        <div className={`overflow-hidden rounded-xl border border-white/10 ${previewStyle === 'avatar' ? 'w-20 h-20' : 'w-full h-28'}`}>
          {isVideo ? (
            <video key={preview} src={preview} className="w-full h-full object-cover" muted loop autoPlay playsInline />
          ) : (
            <img key={preview} src={preview} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      )}
    </div>
  );
}

export default function EditProfile() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('Básico');
  const [newTypewriterText, setNewTypewriterText] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [musicType, setMusicType] = useState<'url' | 'file' | 'spotify' | 'soundcloud'>('url');
  const [customCursorDataUrl, setCustomCursorDataUrl] = useState('');
  const [customBadgeEmoji, setCustomBadgeEmoji] = useState('✨');
  const [customBadgeName, setCustomBadgeName] = useState('');
  const [customBadgeColor, setCustomBadgeColor] = useState('#8b5cf6');
  const formHydratedRef = useRef(false);
  const [discordUserIdInput, setDiscordUserIdInput] = useState('');
  const [discordConnecting, setDiscordConnecting] = useState(false);
  const [lastfmInput, setLastfmInput] = useState('');
  const [lastfmConnecting, setLastfmConnecting] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useGetMyProfile({
    query: { enabled: isAuthenticated },
  });

  const updateProfile = useUpdateProfile();
  const addLink = useAddProfileLink();
  const deleteLink = useDeleteProfileLink();

  const [form, setForm] = useState<ProfileFormState>({
    displayName: '', bio: '', avatarUrl: '', bannerUrl: '',
    backgroundUrl: '', backgroundType: 'image',
    accentColor: '#ffffff', glowColor: '#ffffff',
    nameBorderOpacity: 7,
    backgroundOpacity: 60, backgroundBlur: 0,
    cursorStyle: 'auto', musicUrl: '', musicTitle: '', musicIconUrl: '', musicPrivate: false,
    particleEffect: 'none', clickEffect: 'none',
    fontFamily: 'default', layoutStyle: 'centered',
    typewriterTexts: [], profileTitle: '',
    showViews: true, showDiscordAvatar: true, showDiscordPresence: true, badges: [],
  });

  const toPercentOpacity = (value: number | null | undefined): number => {
    if (value == null || Number.isNaN(value)) return 60;
    if (value >= 0 && value <= 1) return Math.round(value * 100);
    return Math.max(0, Math.min(100, Math.round(value)));
  };

  useEffect(() => {
    if (profile && !formHydratedRef.current) {
      formHydratedRef.current = true;
      setForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        bannerUrl: profile.bannerUrl || '',
        backgroundUrl: profile.backgroundUrl || '',
        backgroundType: (profile as any).backgroundType || 'image',
        accentColor: profile.accentColor || '#ffffff',
        glowColor: profile.glowColor || '#ffffff',
        backgroundOpacity: toPercentOpacity(profile.backgroundOpacity),
        nameBorderOpacity: toPercentOpacity((profile as any).nameBorderOpacity ?? 0.07),
        backgroundBlur: (profile as any).backgroundBlur ?? 0,
        cursorStyle: profile.cursorStyle || 'auto',
        musicUrl: profile.musicUrl || '',
        musicTitle: (profile as any).musicTitle || '',
        musicIconUrl: (profile as any).musicIconUrl || '',
        musicPrivate: (profile as any).musicPrivate === true,
        particleEffect: (profile as any).particleEffect || 'none',
        clickEffect: (profile as any).clickEffect || 'none',
        fontFamily: (profile as any).fontFamily || 'default',
        layoutStyle: (profile as any).layoutStyle || 'centered',
        typewriterTexts: (profile as any).typewriterTexts || [],
        profileTitle: (profile as any).profileTitle || '',
        showViews: (profile as any).showViews !== false,
        showDiscordAvatar: (profile as any).showDiscordAvatar !== false,
        showDiscordPresence: (profile as any).showDiscordPresence !== false,
        badges: (profile.badges || []).filter((badge: string) => badge !== 'verified' && badge !== 'verified_gold' && badge !== 'verified_white').slice(0, 6),
      });
      if (isAttachedFile(profile.musicUrl || '')) {
        setMusicType('file');
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated]);

  const set = (key: keyof ProfileFormState, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const selectMusicType = (type: typeof musicType) => {
    setMusicType(type);
    if (type !== 'file' && isAttachedFile(form.musicUrl)) {
      set('musicUrl', '');
    }
  };

  const selectBackgroundType = (type: string) => {
    setForm(prev => {
      let nextUrl = prev.backgroundUrl || "";
      if (type === "image" && prev.backgroundUrl?.startsWith("#")) {
        nextUrl = "";
      } else if (type === "color" && !prev.backgroundUrl?.startsWith("#")) {
        nextUrl = "#000000";
      }
      return { ...prev, backgroundType: type, backgroundUrl: nextUrl };
    });
    setIsDirty(true);
  };

  const toggleBadge = (badge: string) => {
    setForm(prev => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter(b => b !== badge)
        : prev.badges.length >= 6
          ? prev.badges
          : [...prev.badges, badge],
    }));
  };

  const addCustomBadge = () => {
    const emoji = sanitizeEmoji(customBadgeEmoji).trim() || '✨';
    const label = customBadgeName.trim().slice(0, 28) || 'Personalizado';
    const badge = `custom|${encodeURIComponent(emoji)}|${customBadgeColor}|${encodeURIComponent(label)}`;
    setForm(prev => prev.badges.length >= 6 ? prev : { ...prev, badges: [...prev.badges, badge] });
    setCustomBadgeEmoji('✨');
    setCustomBadgeName('');
  };

  const addTypewriterText = () => {
    if (newTypewriterText.trim()) {
      setForm(prev => ({
        ...prev,
        typewriterTexts: [...prev.typewriterTexts, newTypewriterText.trim()],
      }));
      setNewTypewriterText('');
    }
  };

  const removeTypewriterText = (i: number) => {
    setForm(prev => ({
      ...prev,
      typewriterTexts: prev.typewriterTexts.filter((_, idx) => idx !== i),
    }));
  };

  const apiBase = () => (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

  const connectDiscord = async () => {
    const uid = discordUserIdInput.trim();
    if (!uid) return;
    setDiscordConnecting(true);
    try {
      const res = await fetch(`${apiBase()}/api/profile/discord/lanyard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ discordUserId: uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao conectar Discord');
      toast({ title: 'Discord conectado!', description: `@${data.discordUsername || uid}` });
      setDiscordUserIdInput('');
      refetchProfile();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setDiscordConnecting(false);
    }
  };

  const disconnectDiscord = async () => {
    await fetch(`${apiBase()}/api/profile/discord`, { method: 'DELETE', headers: authHeader() });
    refetchProfile();
  };

  const connectLastfm = async () => {
    const username = lastfmInput.trim();
    if (!username) return;
    setLastfmConnecting(true);
    try {
      const res = await fetch(`${apiBase()}/api/music/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ service: 'lastfm', token: '', username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      toast({ title: 'Last.fm conectado!', description: `Usuário: ${username}` });
      setLastfmInput('');
      refetchProfile();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setLastfmConnecting(false);
    }
  };

  const disconnectLastfm = async () => {
    await fetch(`${apiBase()}/api/music/disconnect`, { method: 'DELETE', headers: authHeader() });
    refetchProfile();
  };

  const save = async () => {
    const verifiedTypes = ['verified', 'verified_gold', 'verified_white'];
    const currentVerifiedBadge = (profile as any)?.badges?.find((b: string) => verifiedTypes.includes(b));
    const otherBadges = form.badges.filter((b: string) => !verifiedTypes.includes(b)).slice(0, 6);
    const preservedBadges = currentVerifiedBadge ? [...otherBadges, currentVerifiedBadge] : otherBadges;
    try {
      await updateProfile.mutateAsync({ data: { ...form, badges: preservedBadges } as any });
      toast({ title: "Perfil salvo!", duration: 2000 });
      setIsDirty(false);
      formHydratedRef.current = false;
      refetchProfile();
    } catch (err: any) {
      toast({ title: "Falha ao salvar", description: err?.message || "Erro desconhecido", variant: "destructive", duration: 3000 });
    }
  };

  const handleAddLink = () => {
    if (!selectedPlatform || !newLinkUrl.trim()) return;
    const plat = SOCIAL_PLATFORMS.find(p => p.value === selectedPlatform);
    addLink.mutate({
      data: {
        platform: selectedPlatform,
        label: newLinkLabel.trim() || plat?.label || selectedPlatform,
        url: newLinkUrl.trim(),
        sortOrder: ((profile as any)?.links?.length || 0),
      }
    }, {
      onSuccess: () => {
        toast({ title: "Link adicionado!" });
        setSelectedPlatform(null);
        setNewLinkUrl('');
        setNewLinkLabel('');
        refetchProfile();
      },
      onError: (err: any) => toast({ title: "Erro ao adicionar link", description: err?.message || "Verifique se a URL está correta", variant: "destructive" }),
    });
  };

  const handleDeleteLink = (linkId: number) => {
    deleteLink.mutate({ linkId } as any, {
      onSuccess: () => {
        toast({ title: "Link removido!" });
        refetchProfile();
      },
    });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="label-caps">Carregando...</p>
      </div>
    );
  }

  const liveProfile = {
    ...profile,
    ...form,
    username: (profile as any)?.username || '',
    links: (profile as any)?.links || [],
    discordConnected: (profile as any)?.discordConnected || false,
    musicConnected: (profile as any)?.musicConnected || false,
    followersCount: (profile as any)?.followersCount || 0,
    followingCount: (profile as any)?.followingCount || 0,
    likesCount: (profile as any)?.likesCount || 0,
    viewsCount: (profile as any)?.viewsCount || 0,
    discordUsername: (profile as any)?.discordUsername,
    discordStatus: (profile as any)?.discordStatus,
    discordActivity: (profile as any)?.discordActivity,
    discordAvatarUrl: (profile as any)?.discordAvatarUrl,
    nowPlaying: (profile as any)?.nowPlaying,
    musicService: (profile as any)?.musicService,
    musicTitle: form.musicTitle,
    musicIconUrl: form.musicIconUrl,
    musicPrivate: form.musicPrivate,
    showDiscordAvatar: form.showDiscordAvatar,
    showDiscordPresence: form.showDiscordPresence,
    discordNitro: (profile as any)?.discordNitro,
    discordBoost: (profile as any)?.discordBoost,
  };

  const selectedPlatformInfo = SOCIAL_PLATFORMS.find(p => p.value === selectedPlatform);

  const profileSiteUrl = (profile as any)?.username ? `https://faren.com.br/${(profile as any).username}` : null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Mobile Preview Overlay */}
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-md border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-widest text-white/60">Pré-visualização</span>
              <button
                onClick={() => setShowMobilePreview(false)}
                className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" /> Fechar
              </button>
            </div>
            <ProfileView profile={liveProfile as any} isOwner={true} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor panel */}
      <div className="w-full lg:w-[460px] xl:w-[520px] flex flex-col border-r border-white/8 z-20 bg-background">

        {/* Header */}
        <div className="h-12 border-b border-white/8 flex items-center justify-between px-3 flex-shrink-0 gap-2">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Voltar</span>
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 truncate">Editor de Perfil</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setShowMobilePreview(true)}
              className="lg:hidden flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white transition-colors py-1.5 px-2 border border-white/10 rounded-xl"
            >
              <Eye className="w-3 h-3" /> Ver
            </button>
            {profileSiteUrl && (
              <a
                href={profileSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40 hover:text-white transition-colors py-1.5 px-2 border border-white/10 rounded-xl"
              >
                <ExternalLink className="w-3 h-3" /> Perfil
              </a>
            )}
            <motion.button
              onClick={save}
              disabled={updateProfile.isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-solid-white py-1.5 px-3 text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {updateProfile.isPending ? '...' : (
                <><Save className="w-3 h-3 inline mr-1" /> Salvar</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/8 flex-shrink-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-xs font-semibold tracking-widest uppercase transition-colors duration-200 relative whitespace-nowrap px-2"
              style={{ color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.3)' }}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-px bg-white"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* ── BASIC TAB ─────────────────────────────── */}
            {activeTab === 'Básico' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <FieldRow label="Nome de Exibição">
                  <StyledInput
                    value={form.displayName}
                    onChange={e => set('displayName', e.target.value)}
                    placeholder="Seu nome"
                  />
                </FieldRow>

                <FieldRow label="Bio">
                  <textarea
                    value={form.bio}
                    onChange={e => set('bio', e.target.value)}
                    placeholder="Escreva algo sobre você..."
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors rounded-xl resize-none"
                  />
                </FieldRow>

                <FieldRow label="Textos Animados (alterna entre eles)">
                  <div className="space-y-2">
                    {form.typewriterTexts.map((text, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
                        <span className="flex-1 text-sm text-white/70 bg-white/[0.04] px-3 py-2 rounded-xl border border-white/10 truncate">{text}</span>
                        <button onClick={() => removeTypewriterText(i)} className="text-white/30 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <StyledInput
                        value={newTypewriterText}
                        onChange={e => setNewTypewriterText(e.target.value)}
                        placeholder="Adicionar texto..."
                        onKeyDown={e => e.key === 'Enter' && addTypewriterText()}
                        className="flex-1"
                      />
                      <button onClick={addTypewriterText} className="px-3 py-2 border border-white/15 hover:border-white/30 text-white/50 hover:text-white transition-all rounded-xl">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </FieldRow>

                <div className="glow-line" />

                <FieldRow label="Avatar">
                  <FileOnlyUpload
                    value={form.avatarUrl}
                    onFile={(url) => set('avatarUrl', url)}
                    onClear={() => set('avatarUrl', '')}
                    accept="image/*,video/*,image/gif"
                    label="Selecionar foto/gif/vídeo"
                    previewStyle="avatar"
                    prefix="avatars"
                    onError={(msg) => toast({ title: 'Upload falhou', description: msg, variant: 'destructive' })}
                  />
                  <p className="text-xs text-white/25 mt-1">Aceita imagem, GIF ou vídeo. Vídeos ficam em loop no perfil.</p>
                </FieldRow>

                <FieldRow label="Banner">
                  <FileOnlyUpload
                    value={form.bannerUrl}
                    onFile={(url) => set('bannerUrl', url)}
                    onClear={() => set('bannerUrl', '')}
                    accept="image/*,video/*,image/gif"
                    label="Selecionar banner"
                    previewStyle="banner"
                    prefix="banners"
                    onError={(msg) => toast({ title: 'Upload falhou', description: msg, variant: 'destructive' })}
                  />
                  <p className="text-xs text-white/25 mt-1">Aceita imagem, GIF ou vídeo. Vídeos ficam em loop no perfil.</p>
                </FieldRow>

                <FieldRow label="Título do Perfil (aba do navegador)">
                  <StyledInput value={form.profileTitle} onChange={e => set('profileTitle', e.target.value)} placeholder="Meu Perfil Faren" />
                </FieldRow>

                <div className="glow-line" />

                <div id="badges">
                  <SectionHeader
                    title="Emblemas"
                    subtitle="Até 6 emblemas aparecem como chips coloridos abaixo do seu nome. Os personalizados podem ter qualquer cor e emoji."
                    right={
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white">
                        {form.badges.length}/6
                      </span>
                    }
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {BADGE_OPTIONS.map(badge => {
                      const active = form.badges.includes(badge.value);
                      // Parse "emoji name" (e.g. "🔥 Fire") if format allows
                      const m = badge.label.match(/^(\p{Extended_Pictographic}+)\s*(.+)$/u);
                      const emoji = m ? m[1] : '✦';
                      const name = m ? m[2] : badge.label;
                      return (
                        <VisualOptionCard
                          key={badge.value}
                          selected={active}
                          onClick={() => toggleBadge(badge.value)}
                          preview={<BadgePreview emoji={emoji} label={name} />}
                          label={name}
                          previewAspect="1/1"
                          compact
                          data-testid={`badge-${badge.value}`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-5 p-4 border border-white/10 bg-white/[0.02] rounded-2xl space-y-3">
                    <p className="label-caps">Criar emblema personalizado</p>
                    <div className="grid grid-cols-[64px_1fr_44px] gap-2">
                      <StyledInput
                        value={customBadgeEmoji}
                        onChange={e => setCustomBadgeEmoji(sanitizeEmoji(e.target.value))}
                        placeholder="✨"
                        maxLength={8}
                        className="text-center"
                      />
                      <StyledInput
                        value={customBadgeName}
                        onChange={e => setCustomBadgeName(e.target.value)}
                        placeholder="Nome do emblema"
                      />
                      <input
                        type="color"
                        value={customBadgeColor}
                        onChange={e => setCustomBadgeColor(e.target.value)}
                        className="w-11 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={addCustomBadge}
                      disabled={form.badges.length >= 6}
                      className="btn-outline-white w-full py-2 text-xs disabled:opacity-40"
                    >
                      Adicionar emblema ({form.badges.length}/6)
                    </button>
                    {form.badges.some(badge => badge.startsWith('custom|')) && (
                      <div className="flex flex-wrap gap-2">
                        {form.badges.map((badge, index) => {
                          if (!badge.startsWith('custom|')) return null;
                          const [, rawEmoji, color, rawLabel] = badge.split('|');
                          const emoji = decodeBadgePart(rawEmoji, '✨');
                          const label = decodeBadgePart(rawLabel, 'Personalizado');
                          return (
                            <button
                              key={`${badge}-${index}`}
                              onClick={() => setForm(prev => ({ ...prev, badges: prev.badges.filter((_, idx) => idx !== index) }))}
                              className="min-h-9 rounded-full border flex items-center gap-1.5 px-3 justify-center text-xs font-semibold"
                              style={{ color, borderColor: `${color}66`, backgroundColor: `${color}18` }}
                              title="Remover emblema"
                            >
                              <span className="text-base">{emoji}</span>
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── THEME TAB ─────────────────────────────── */}
            {activeTab === 'Tema' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-7">
                {/* Background type — visual cards */}
                <div>
                  <SectionHeader
                    title="Tipo de fundo"
                    subtitle="Escolha o que fica atrás do seu perfil. Imagens com glow combinam melhor com efeitos; cores sólidas garantem contraste e velocidade."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      {
                        value: 'image',
                        label: 'Mídia',
                        tagline: 'Imagem, GIF ou vídeo em loop atrás do perfil.',
                        bestFor: ['Quem quer um vibe forte', 'Combina com efeitos de partícula', 'Vídeos curtos em loop'],
                        tradeoffs: ['Aumenta o tempo de carregamento', 'Pode brigar com a leitura do texto'],
                      },
                      {
                        value: 'color',
                        label: 'Cor sólida',
                        tagline: 'Um fundo limpo e estável — todo o foco vai pro conteúdo.',
                        bestFor: ['Visual minimalista', 'Carregamento instantâneo', 'Tipografia nítida'],
                        tradeoffs: ['Menos personalidade', 'Pode parecer vazio sem efeitos'],
                      },
                    ].map(opt => (
                      <VisualOptionCard
                        key={opt.value}
                        selected={form.backgroundType === opt.value}
                        onClick={() => selectBackgroundType(opt.value)}
                        preview={<BackgroundTypePreview kind={opt.value as 'image' | 'color'} />}
                        label={opt.label}
                        tagline={opt.tagline}
                        bestFor={opt.bestFor}
                        tradeoffs={opt.tradeoffs}
                        data-testid={`bg-type-${opt.value}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Background source */}
                <div>
                  <SectionHeader
                    title={form.backgroundType === 'color' ? 'Cor do fundo' : 'Arquivo de fundo'}
                    subtitle={form.backgroundType === 'color'
                      ? 'Use o seletor ou digite um HEX. Tons escuros mantêm o contraste com texto branco.'
                      : 'Aceita imagem, GIF ou vídeo. Vídeos ficam em loop silencioso atrás do conteúdo.'}
                  />
                  {form.backgroundType === 'color' ? (
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.backgroundUrl?.startsWith('#') ? form.backgroundUrl : '#000000'}
                        onChange={e => set('backgroundUrl', e.target.value)}
                        className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                      />
                      <StyledInput
                        value={form.backgroundUrl?.startsWith('#') ? form.backgroundUrl : '#000000'}
                        onChange={e => set('backgroundUrl', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ) : (
                    <FileOnlyUpload
                      value={form.backgroundUrl}
                      onFile={(url) => {
                        set('backgroundType', 'image');
                        set('backgroundUrl', url);
                      }}
                      onClear={() => set('backgroundUrl', '')}
                      accept="image/*,video/*,image/gif"
                      label="Selecionar fundo"
                      previewStyle="banner"
                      prefix="backgrounds"
                      onError={(msg) => toast({ title: 'Upload falhou', description: msg, variant: 'destructive' })}
                    />
                  )}
                </div>

                <div className="glow-line" />

                {/* Color identity — accent + glow as preview cards */}
                <div>
                  <SectionHeader
                    title="Identidade cromática"
                    subtitle="A cor de detalhe pinta links, bordas e barras. A cor do brilho domina o halo ao redor do avatar e do nome."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.015]">
                      <div className="aspect-[4/3]">
                        <ColorPreview color={form.accentColor} />
                      </div>
                      <div className="p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Cor de detalhe</p>
                        <p className="mt-2 text-xs text-white/45 leading-relaxed">Aplica em links ativos, sparkline e barras.</p>
                        <div className="mt-3 flex gap-2">
                          <input
                            type="color"
                            value={form.accentColor}
                            onChange={e => set('accentColor', e.target.value)}
                            className="w-12 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                            data-testid="input-accent-color"
                          />
                          <StyledInput value={form.accentColor} onChange={e => set('accentColor', e.target.value)} className="flex-1 font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.015]">
                      <div className="aspect-[4/3]">
                        <ColorPreview color={form.glowColor} glow />
                      </div>
                      <div className="p-4">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Cor do brilho</p>
                        <p className="mt-2 text-xs text-white/45 leading-relaxed">Halo ao redor do avatar e do título do perfil.</p>
                        <div className="mt-3 flex gap-2">
                          <input
                            type="color"
                            value={form.glowColor}
                            onChange={e => set('glowColor', e.target.value)}
                            className="w-12 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                            data-testid="input-glow-color"
                          />
                          <StyledInput value={form.glowColor} onChange={e => set('glowColor', e.target.value)} className="flex-1 font-mono text-xs" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glow-line" />

                {/* Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SliderCard
                    label="Opacidade do fundo"
                    value={form.backgroundOpacity}
                    suffix="%"
                    min={0}
                    max={100}
                    onChange={(v) => set('backgroundOpacity', v)}
                    description="0% deixa o fundo invisível; 100% mostra a mídia em sua intensidade total."
                    data-testid="slider-bg-opacity"
                  />
                  <SliderCard
                    label="Desfoque do fundo"
                    value={form.backgroundBlur}
                    suffix="px"
                    min={0}
                    max={20}
                    onChange={(v) => set('backgroundBlur', v)}
                    description="Suaviza o fundo para destacar o texto. 4–8px funciona bem em fotos."
                    data-testid="slider-bg-blur"
                  />
                  <SliderCard
                    label="Borda do nome"
                    value={form.nameBorderOpacity}
                    suffix={form.nameBorderOpacity === 0 ? ' • desligada' : '%'}
                    min={0}
                    max={100}
                    onChange={(v) => set('nameBorderOpacity', v)}
                    description="Anel ao redor do título do perfil. 0% remove totalmente."
                    data-testid="slider-name-border"
                  />
                </div>
              </motion.div>
            )}

            {/* ── LAYOUT TAB ─────────────────────────────── */}
            {activeTab === 'Layout' && (
              <LayoutTabPanel form={form} set={set} profile={profile} />
            )}

            {/* ── EFFECTS TAB ───────────────────────────── */}
            {activeTab === 'Efeitos' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-7">
                {/* Particle effects — live previews */}
                <div>
                  <SectionHeader
                    title="Partículas no fundo"
                    subtitle="Movimento ambiente que enche a página inteira. Cada miniatura mostra exatamente como vai ficar — passe o mouse e veja a animação."
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {PARTICLE_OPTIONS.map(opt => (
                      <VisualOptionCard
                        key={opt.value}
                        selected={form.particleEffect === opt.value}
                        onClick={() => set('particleEffect', opt.value)}
                        preview={<ParticlePreview kind={opt.value} />}
                        label={opt.label}
                        previewAspect="1/1"
                        compact
                        data-testid={`particle-${opt.value}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="glow-line" />

                {/* Click effects */}
                <div>
                  <SectionHeader
                    title="Reação ao clique"
                    subtitle="O que aparece quando o visitante clica em qualquer lugar do seu perfil. As miniaturas simulam um clique automático."
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {CLICK_OPTIONS.map(opt => (
                      <VisualOptionCard
                        key={opt.value}
                        selected={form.clickEffect === opt.value}
                        onClick={() => set('clickEffect', opt.value)}
                        preview={<ClickPreview kind={opt.value} />}
                        label={opt.label}
                        previewAspect="1/1"
                        compact
                        data-testid={`click-${opt.value}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="glow-line" />

                {/* Cursor — hover the preview to feel it */}
                <div>
                  <SectionHeader
                    title="Estilo do cursor"
                    subtitle="Trocar o cursor é a forma mais imediata de personalizar a sensação do perfil. Passe o mouse sobre cada card para sentir."
                    right={
                      form.cursorStyle?.startsWith('url:') ? (
                        <button
                          onClick={() => { set('cursorStyle', 'auto'); setCustomCursorDataUrl(''); }}
                          className="text-[10px] uppercase tracking-[0.2em] font-semibold text-red-400/80 hover:text-red-300 px-3 py-1.5 rounded-full border border-red-500/30"
                        >
                          Remover personalizado
                        </button>
                      ) : null
                    }
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {CURSOR_OPTIONS.map(opt => (
                      <VisualOptionCard
                        key={opt.value}
                        selected={form.cursorStyle === opt.value}
                        onClick={() => set('cursorStyle', opt.value)}
                        preview={<CursorPreview kind={opt.value} />}
                        label={opt.label}
                        previewAspect="1/1"
                        compact
                        data-testid={`cursor-${opt.value}`}
                      />
                    ))}
                    {form.cursorStyle?.startsWith('url:') && (
                      <VisualOptionCard
                        selected
                        preview={<CursorPreview kind={form.cursorStyle} customUrl={form.cursorStyle.slice(4)} />}
                        label="Personalizado"
                        previewAspect="1/1"
                        compact
                        data-testid="cursor-custom-active"
                      />
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Subir cursor próprio</p>
                      <p className="mt-1 text-[11px] text-white/45">PNG transparente fica perfeito. Tamanho ideal: 32×32px.</p>
                    </div>
                    <FileUploadButton
                      onFile={(url) => {
                        setCustomCursorDataUrl(url);
                        set('cursorStyle', `url:${url}`);
                      }}
                      accept="image/*"
                      prefix="icons"
                      onError={(msg) => toast({ title: 'Upload falhou', description: msg, variant: 'destructive' })}
                    >
                      Selecionar arquivo
                    </FileUploadButton>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── LINKS TAB ──────────────────────────────── */}
            {activeTab === 'Links' && (
              <motion.div id="links" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-7">
                {/* Current links */}
                {(profile as any)?.links?.length > 0 && (
                  <div>
                    <SectionHeader
                      title="Suas redes ativas"
                      subtitle="Aparecem como botões circulares no perfil. Arraste para reordenar (em breve)."
                      right={
                        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white">
                          {(profile as any).links.length}
                        </span>
                      }
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(profile as any).links.map((link: any) => {
                        const plat = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
                        const Icon = plat?.icon || LinkIcon;
                        const color = plat?.color || '#fff';
                        return (
                          <div
                            key={link.id}
                            className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/10 rounded-2xl group"
                            data-testid={`link-${link.platform}`}
                          >
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold uppercase tracking-[0.15em] text-white truncate">{link.label}</p>
                              <p className="text-[10px] text-white/40 truncate font-mono">{link.url}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              className="text-white/30 hover:text-red-400 transition-colors p-2"
                              data-testid={`button-remove-link-${link.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="glow-line" />

                {/* Add new link — visual platform picker */}
                <div>
                  <SectionHeader
                    title="Adicionar uma rede"
                    subtitle="Cada plataforma tem cor própria. Selecione um cartão para abrir o formulário."
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {SOCIAL_PLATFORMS.map(plat => {
                      const isSelected = selectedPlatform === plat.value;
                      return (
                        <VisualOptionCard
                          key={plat.value}
                          selected={isSelected}
                          onClick={() => {
                            setSelectedPlatform(isSelected ? null : plat.value);
                            setNewLinkUrl('');
                            setNewLinkLabel('');
                          }}
                          preview={
                            <SocialPlatformPreview
                              Icon={plat.icon}
                              color={plat.color}
                              label={plat.label}
                            />
                          }
                          label={plat.label}
                          previewAspect="1/1"
                          compact
                          selectedLabel="Aberto"
                          idleLabel="+"
                          data-testid={`platform-${plat.value}`}
                        />
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {selectedPlatform && selectedPlatformInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-5 space-y-3 p-5 border rounded-2xl"
                        style={{
                          background: `${selectedPlatformInfo.color}0d`,
                          borderColor: `${selectedPlatformInfo.color}55`,
                        }}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              background: `${selectedPlatformInfo.color}26`,
                              color: selectedPlatformInfo.color,
                              border: `1px solid ${selectedPlatformInfo.color}55`,
                            }}
                          >
                            <selectedPlatformInfo.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">{selectedPlatformInfo.label}</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-semibold">Adicionar ao perfil</p>
                          </div>
                        </div>
                        <div>
                          <label className="label-caps block mb-1.5">URL</label>
                          <StyledInput
                            value={newLinkUrl}
                            onChange={e => setNewLinkUrl(e.target.value)}
                            placeholder={selectedPlatformInfo.placeholder}
                            data-testid="input-new-link-url"
                          />
                        </div>
                        <button
                          onClick={handleAddLink}
                          disabled={!newLinkUrl.trim() || addLink.isPending}
                          className="btn-solid-white w-full py-2.5 text-xs disabled:opacity-50"
                          data-testid="button-add-link"
                        >
                          {addLink.isPending ? 'Adicionando...' : 'Adicionar Link'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ── ADVANCED TAB ──────────────────────────── */}
            {activeTab === 'Avançado' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-7">
                {/* View counter visual toggle */}
                <div>
                  <SectionHeader
                    title="Contador de visitas"
                    subtitle="Mostrar ou esconder o número de pessoas que viram seu perfil. Esconder dá um ar mais limpo; mostrar funciona como prova social."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <VisualOptionCard
                      selected={form.showViews}
                      onClick={() => set('showViews', true)}
                      preview={<TogglePreview on iconOn={<Eye className="w-4 h-4" />} />}
                      label="Mostrar visitas"
                      tagline="O contador aparece logo abaixo do nome no perfil público."
                      data-testid="views-on"
                    />
                    <VisualOptionCard
                      selected={!form.showViews}
                      onClick={() => set('showViews', false)}
                      preview={<TogglePreview on={false} />}
                      label="Esconder visitas"
                      tagline="O número fica privado — só você vê pelo painel."
                      data-testid="views-off"
                    />
                  </div>
                </div>

                <div className="glow-line" />

                <div>
                  <SectionHeader
                    title="Música no perfil"
                    subtitle="A faixa toca em loop quando alguém abre seu perfil. Pode ser um arquivo, link Spotify ou SoundCloud."
                  />
                  <p className="label-caps mb-3">Origem da música</p>
                  <div className="grid grid-cols-4 gap-1 mb-3">
                    {[
                      { value: 'url', label: 'URL' },
                      { value: 'file', label: 'Arquivo' },
                      { value: 'spotify', label: 'Spotify' },
                      { value: 'soundcloud', label: 'Sound' },
                    ].map(t => (
                      <button
                        key={t.value}
                        onClick={() => selectMusicType(t.value as typeof musicType)}
                        className="py-2 text-xs font-semibold uppercase tracking-wider transition-all rounded-xl border"
                        style={{
                          backgroundColor: musicType === t.value ? 'rgba(255,255,255,0.1)' : 'transparent',
                          borderColor: musicType === t.value ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                          color: musicType === t.value ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {musicType === 'file' ? (
                    <div className="flex gap-2">
                      <div className="flex-1 bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white/40 rounded-xl truncate">
                      {form.musicUrl ? 'Arquivo anexado ✓' : 'Nenhum arquivo'}
                      </div>
                      <FileUploadButton
                        onFile={(url, file) => {
                          set('musicUrl', url);
                          if (!form.musicTitle.trim()) {
                            set('musicTitle', file.name.replace(/\.[^/.]+$/, ''));
                          }
                        }}
                        accept="audio/*"
                        prefix="music"
                        onError={(msg) => toast({ title: 'Upload falhou', description: msg, variant: 'destructive' })}
                      >
                        Selecionar
                      </FileUploadButton>
                    </div>
                  ) : (
                    <StyledInput
                      value={isAttachedFile(form.musicUrl) ? '' : form.musicUrl}
                      onChange={e => set('musicUrl', e.target.value)}
                      placeholder={
                        musicType === 'spotify' ? 'https://open.spotify.com/track/...' :
                        musicType === 'soundcloud' ? 'https://soundcloud.com/...' :
                        'https://...mp3'
                      }
                    />
                  )}
                  {musicType === 'file' && isAttachedFile(form.musicUrl) && (
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    <StyledInput
                      value={form.musicTitle}
                      onChange={e => set('musicTitle', e.target.value)}
                      placeholder="Nome personalizado da música"
                    />
                    <MediaUrlInput
                      value={form.musicIconUrl}
                      onUrl={url => set('musicIconUrl', url)}
                      onFile={url => set('musicIconUrl', url)}
                      accept="image/*"
                      placeholder="URL do ícone/capa da música"
                      buttonLabel="Ícone"
                      prefix="icons"
                      onError={(msg) => toast({ title: 'Upload falhou', description: msg, variant: 'destructive' })}
                    />
                  </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 mt-3">
                    <button
                      onClick={() => set('musicPrivate', !form.musicPrivate)}
                      className="flex items-center justify-between gap-3 px-4 py-3 border rounded-xl transition-all text-sm w-full"
                      style={{
                        backgroundColor: form.musicPrivate ? 'rgba(255,255,255,0.08)' : 'transparent',
                        borderColor: form.musicPrivate ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                        color: form.musicPrivate ? '#fff' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <span className="font-semibold uppercase tracking-wider text-xs">Privar música ao vivo</span>
                      <span className="label-caps">{form.musicPrivate ? 'Ativo' : 'Desativado'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-white/25 mt-1">A música toca quando visitantes acessam seu perfil.</p>
                </div>

                <div className="glow-line" />

                {/* Connections — Discord + Last.fm + Spotify (preview cards) */}
                <div>
                  <SectionHeader
                    title="Conexões em tempo real"
                    subtitle="Mostre o que você está fazendo agora — status do Discord, música tocando no Last.fm. Aparece como um chip animado no perfil."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <VisualOptionCard
                      selected={!!(profile as any)?.discordConnected}
                      preview={
                        <ConnectionPreview
                          Icon={SiDiscord}
                          color="#5865F2"
                          title={(profile as any)?.discordUsername || 'Discord'}
                          subtitle={(profile as any)?.discordConnected ? 'Status ao vivo via Lanyard' : 'Conecte para exibir status'}
                          connected={!!(profile as any)?.discordConnected}
                        />
                      }
                      label="Discord"
                      tagline={(profile as any)?.discordConnected ? 'Conectado e exibindo presence.' : 'Não conectado — chip fica oculto.'}
                      data-testid="conn-discord"
                    />
                    <VisualOptionCard
                      selected={!!((profile as any)?.musicConnected && (profile as any)?.musicService === 'lastfm')}
                      preview={
                        <ConnectionPreview
                          Icon={SiLastdotfm}
                          color="#D51007"
                          title={(profile as any)?.musicUsername || 'Last.fm'}
                          subtitle={(profile as any)?.musicConnected ? 'Tocando agora' : 'Conecte sua conta'}
                          connected={!!(profile as any)?.musicConnected}
                        />
                      }
                      label="Last.fm"
                      tagline={(profile as any)?.musicConnected ? 'Música atual com arte do álbum.' : 'Não conectado — sem chip de música.'}
                      data-testid="conn-lastfm"
                    />
                    <VisualOptionCard
                      selected={false}
                      disabled
                      preview={
                        <ConnectionPreview
                          Icon={SiSpotify}
                          color="#1DB954"
                          title="Spotify"
                          subtitle="Em breve"
                          connected={false}
                        />
                      }
                      label="Spotify"
                      tagline="Disponível em breve."
                      disabledNote="Em breve"
                      data-testid="conn-spotify"
                    />
                  </div>
                </div>

                {/* Discord settings panel — only shown when relevant */}
                <div className="p-5 border border-white/10 rounded-2xl bg-white/[0.02]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white mb-3">
                    Configurar Discord
                  </p>
                  {(profile as any)?.discordConnected ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border border-white/10 rounded-xl bg-black/40">
                        {(profile as any)?.discordAvatarUrl && (
                          <img src={(profile as any).discordAvatarUrl} alt="" className="w-9 h-9 rounded-full" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate text-white">{(profile as any)?.discordUsername || 'Conectado'}</p>
                          <p className="text-[10px] text-white/40">via Lanyard</p>
                        </div>
                        <button
                          onClick={disconnectDiscord}
                          className="px-3 py-1.5 text-[10px] text-red-400 border border-red-500/30 rounded-xl uppercase tracking-[0.15em] font-semibold"
                          data-testid="button-discord-disconnect"
                        >
                          Desconectar
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => set('showDiscordAvatar', !form.showDiscordAvatar)}
                          className="px-3 py-2 border border-white/10 hover:border-white/30 transition-colors text-[11px] uppercase tracking-[0.15em] rounded-xl text-white/70 font-semibold"
                          data-testid="toggle-discord-avatar"
                        >
                          Avatar: {form.showDiscordAvatar ? 'sim' : 'não'}
                        </button>
                        <button
                          onClick={() => set('showDiscordPresence', !form.showDiscordPresence)}
                          className="px-3 py-2 border border-white/10 hover:border-white/30 transition-colors text-[11px] uppercase tracking-[0.15em] rounded-xl text-white/70 font-semibold"
                          data-testid="toggle-discord-presence"
                        >
                          Status: {form.showDiscordPresence ? 'sim' : 'não'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          value={discordUserIdInput}
                          onChange={e => setDiscordUserIdInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && connectDiscord()}
                          placeholder="Seu Discord User ID"
                          className="flex-1 bg-black border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/30 rounded-xl font-mono"
                          data-testid="input-discord-userid"
                        />
                        <button
                          onClick={connectDiscord}
                          disabled={discordConnecting || !discordUserIdInput.trim()}
                          className="btn-outline-white text-xs px-4 py-2 disabled:opacity-40"
                          data-testid="button-discord-connect"
                        >
                          {discordConnecting ? '...' : 'Conectar'}
                        </button>
                      </div>
                      <p className="text-[10px] text-white/30 leading-relaxed">
                        <strong className="text-white/55">Como pegar o User ID:</strong> Discord → Configurações → Avançado → ative Modo Desenvolvedor → clique direito no seu nome → Copiar User ID. Entre no servidor <span className="text-white/55">discord.gg/lanyard</span>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Last.fm settings */}
                <div className="p-5 border border-white/10 rounded-2xl bg-white/[0.02]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white mb-3">
                    Configurar Last.fm
                  </p>
                  {(profile as any)?.musicConnected && (profile as any)?.musicService === 'lastfm' ? (
                    <div className="flex items-center gap-3 p-3 border border-white/10 rounded-xl bg-black/40">
                      <SiLastdotfm className="w-5 h-5 text-red-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate text-white">{(profile as any)?.musicUsername}</p>
                        <p className="text-[10px] text-white/40">Tocando ao vivo</p>
                      </div>
                      <button
                        onClick={disconnectLastfm}
                        className="px-3 py-1.5 text-[10px] text-red-400 border border-red-500/30 rounded-xl uppercase tracking-[0.15em] font-semibold"
                        data-testid="button-lastfm-disconnect"
                      >
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={lastfmInput}
                        onChange={e => setLastfmInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && connectLastfm()}
                        placeholder="Seu usuário no Last.fm"
                        className="flex-1 bg-black border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/30 rounded-xl"
                        data-testid="input-lastfm-username"
                      />
                      <button
                        onClick={connectLastfm}
                        disabled={lastfmConnecting || !lastfmInput.trim()}
                        className="btn-outline-white text-xs px-4 py-2 disabled:opacity-40"
                        data-testid="button-lastfm-connect"
                      >
                        {lastfmConnecting ? '...' : 'Conectar'}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Sticky save bar */}
        <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="border-t border-white/10 bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between flex-shrink-0"
            >
              <span className="text-xs text-white/50 font-semibold uppercase tracking-wider">Alterações não salvas</span>
              <motion.button
                onClick={save}
                disabled={updateProfile.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-solid-white py-2 px-5 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                {updateProfile.isPending ? 'Salvando...' : 'Salvar alterações'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Preview panel */}
      <div className="hidden lg:block flex-1 bg-black relative overflow-hidden" style={{ isolation: 'isolate' }}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3" style={{ pointerEvents: 'none' }}>
          <span className="label-caps bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 text-white/50">
            Pré-visualização ao Vivo
          </span>
        </div>
        <div
          className="w-full h-full overflow-y-auto"
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
        >
          <ProfileView profile={liveProfile as any} isOwner={true} />
        </div>
      </div>
    </div>
  );
}
