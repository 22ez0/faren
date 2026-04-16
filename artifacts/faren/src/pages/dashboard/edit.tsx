import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMyProfile, useUpdateProfile, useAddProfileLink, useDeleteProfileLink } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import ProfileView from "@/components/ProfileView";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Upload, X, Link as LinkIcon, Music, Image } from "lucide-react";
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
  backgroundOpacity: number;
  backgroundBlur: number;
  cursorStyle: string;
  musicUrl: string;
  particleEffect: string;
  clickEffect: string;
  fontFamily: string;
  layoutStyle: string;
  typewriterTexts: string[];
  profileTitle: string;
  showViews: boolean;
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

const LAYOUT_OPTIONS = [
  { value: 'centered', label: 'Centralizado' },
  { value: 'left', label: 'Alinhado à Esquerda' },
];

const BADGE_OPTIONS = [
  { value: 'verified', label: '✓ Verificado' },
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

const TABS = ['Básico', 'Tema', 'Efeitos', 'Links', 'Avançado'];

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
      className={`w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors rounded-sm ${props.className || ''}`}
    />
  );
}

function StyledSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 transition-colors rounded-sm appearance-none"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-[#0d0d0d]">{opt.label}</option>
      ))}
    </select>
  );
}

function FileUploadButton({ onFile, accept, children }: { onFile: (dataUrl: string) => void; accept?: string; children: React.ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onFile(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={accept || 'image/*'} onChange={handleChange} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-3 py-2.5 border border-white/15 hover:border-white/30 text-white/50 hover:text-white transition-all rounded-sm flex items-center gap-1.5 text-xs"
      >
        <Upload className="w-3.5 h-3.5" />
        {children}
      </button>
    </>
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

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useGetMyProfile({
    query: { queryKey: [] as any, enabled: isAuthenticated },
  });

  const updateProfile = useUpdateProfile();
  const addLink = useAddProfileLink();
  const deleteLink = useDeleteProfileLink();

  const [form, setForm] = useState<ProfileFormState>({
    displayName: '', bio: '', avatarUrl: '', bannerUrl: '',
    backgroundUrl: '', backgroundType: 'image',
    accentColor: '#ffffff', glowColor: '#ffffff',
    backgroundOpacity: 60, backgroundBlur: 0,
    cursorStyle: 'auto', musicUrl: '',
    particleEffect: 'none', clickEffect: 'none',
    fontFamily: 'default', layoutStyle: 'centered',
    typewriterTexts: [], profileTitle: '',
    showViews: true, badges: [],
  });

  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        bannerUrl: profile.bannerUrl || '',
        backgroundUrl: profile.backgroundUrl || '',
        backgroundType: (profile as any).backgroundType || 'image',
        accentColor: profile.accentColor || '#ffffff',
        glowColor: profile.glowColor || '#ffffff',
        backgroundOpacity: profile.backgroundOpacity ?? 60,
        backgroundBlur: (profile as any).backgroundBlur ?? 0,
        cursorStyle: profile.cursorStyle || 'auto',
        musicUrl: profile.musicUrl || '',
        particleEffect: (profile as any).particleEffect || 'none',
        clickEffect: (profile as any).clickEffect || 'none',
        fontFamily: (profile as any).fontFamily || 'default',
        layoutStyle: (profile as any).layoutStyle || 'centered',
        typewriterTexts: (profile as any).typewriterTexts || [],
        profileTitle: (profile as any).profileTitle || '',
        showViews: (profile as any).showViews !== false,
        badges: profile.badges || [],
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation("/login");
  }, [authLoading, isAuthenticated]);

  const set = (key: keyof ProfileFormState, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleBadge = (badge: string) => {
    setForm(prev => ({
      ...prev,
      badges: prev.badges.includes(badge)
        ? prev.badges.filter(b => b !== badge)
        : [...prev.badges, badge],
    }));
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

  const save = () => {
    updateProfile.mutate(
      { data: form as any },
      {
        onSuccess: () => toast({ title: "Perfil salvo!" }),
        onError: (err: any) => toast({ title: "Falha ao salvar", description: err.error, variant: "destructive" }),
      }
    );
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
      onError: () => toast({ title: "Erro ao adicionar link", variant: "destructive" }),
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
  };

  const selectedPlatformInfo = SOCIAL_PLATFORMS.find(p => p.value === selectedPlatform);

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Editor panel */}
      <div className="w-full lg:w-[460px] xl:w-[520px] flex flex-col border-r border-white/8 z-20 bg-background">

        {/* Header */}
        <div className="h-14 border-b border-white/8 flex items-center justify-between px-4 flex-shrink-0">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 nav-link"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>
          <span className="label-caps">Editor de Perfil</span>
          <motion.button
            onClick={save}
            disabled={updateProfile.isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-solid-white py-2 px-4 text-xs disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Salvando...' : (
              <><Save className="w-3 h-3 inline mr-1.5" /> Salvar</>
            )}
          </motion.button>
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
                    className="w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors rounded-sm resize-none"
                  />
                </FieldRow>

                <FieldRow label="Textos Animados (alterna entre eles)">
                  <div className="space-y-2">
                    {form.typewriterTexts.map((text, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-white/20 flex-shrink-0" />
                        <span className="flex-1 text-sm text-white/70 bg-white/[0.04] px-3 py-2 rounded-sm border border-white/10 truncate">{text}</span>
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
                      <button onClick={addTypewriterText} className="px-3 py-2 border border-white/15 hover:border-white/30 text-white/50 hover:text-white transition-all rounded-sm">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </FieldRow>

                <div className="glow-line" />

                <FieldRow label="Avatar">
                  <div className="flex gap-2">
                    <StyledInput value={form.avatarUrl} onChange={e => set('avatarUrl', e.target.value)} placeholder="https://..." className="flex-1" />
                    <FileUploadButton onFile={url => set('avatarUrl', url)} accept="image/*">
                      <Image className="w-3.5 h-3.5" />
                    </FileUploadButton>
                  </div>
                </FieldRow>

                <FieldRow label="Banner">
                  <div className="flex gap-2">
                    <StyledInput value={form.bannerUrl} onChange={e => set('bannerUrl', e.target.value)} placeholder="https://..." className="flex-1" />
                    <FileUploadButton onFile={url => set('bannerUrl', url)} accept="image/*">
                      <Image className="w-3.5 h-3.5" />
                    </FileUploadButton>
                  </div>
                </FieldRow>

                <FieldRow label="Título do Perfil (aba do navegador)">
                  <StyledInput value={form.profileTitle} onChange={e => set('profileTitle', e.target.value)} placeholder="Meu Perfil Faren" />
                </FieldRow>

                <div className="glow-line" />

                <FieldRow label="Emblemas">
                  <div className="grid grid-cols-2 gap-1.5">
                    {BADGE_OPTIONS.map(badge => {
                      const active = form.badges.includes(badge.value);
                      return (
                        <button
                          key={badge.value}
                          onClick={() => toggleBadge(badge.value)}
                          className="flex items-center gap-2 px-3 py-2 text-xs rounded-sm border transition-all duration-150"
                          style={{
                            backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                            borderColor: active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)',
                            color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                          }}
                        >
                          <span>{badge.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </FieldRow>
              </motion.div>
            )}

            {/* ── THEME TAB ─────────────────────────────── */}
            {activeTab === 'Tema' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <FieldRow label="Cor de Destaque">
                    <div className="flex gap-2">
                      <input type="color" value={form.accentColor} onChange={e => set('accentColor', e.target.value)} className="w-10 h-9 rounded-sm border border-white/10 bg-transparent cursor-pointer" />
                      <StyledInput value={form.accentColor} onChange={e => set('accentColor', e.target.value)} className="flex-1" />
                    </div>
                  </FieldRow>
                  <FieldRow label="Cor do Brilho">
                    <div className="flex gap-2">
                      <input type="color" value={form.glowColor} onChange={e => set('glowColor', e.target.value)} className="w-10 h-9 rounded-sm border border-white/10 bg-transparent cursor-pointer" />
                      <StyledInput value={form.glowColor} onChange={e => set('glowColor', e.target.value)} className="flex-1" />
                    </div>
                  </FieldRow>
                </div>

                <div className="glow-line" />

                <FieldRow label="Tipo de Fundo">
                  <div className="grid grid-cols-3 gap-1">
                    {[{ value: 'image', label: 'Imagem' }, { value: 'video', label: 'Vídeo' }, { value: 'color', label: 'Cor' }].map(type => (
                      <button
                        key={type.value}
                        onClick={() => set('backgroundType', type.value)}
                        className="py-2 text-xs font-semibold uppercase tracking-wider transition-all rounded-sm border"
                        style={{
                          backgroundColor: form.backgroundType === type.value ? 'rgba(255,255,255,0.1)' : 'transparent',
                          borderColor: form.backgroundType === type.value ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                          color: form.backgroundType === type.value ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </FieldRow>

                <FieldRow label="Fundo (URL ou arquivo)">
                  <div className="flex gap-2">
                    <StyledInput value={form.backgroundUrl} onChange={e => set('backgroundUrl', e.target.value)} placeholder="https://..." className="flex-1" />
                    <FileUploadButton onFile={url => set('backgroundUrl', url)} accept="image/*,video/*,image/gif">
                      <Upload className="w-3.5 h-3.5" />
                    </FileUploadButton>
                  </div>
                </FieldRow>

                <FieldRow label={`Opacidade do Fundo — ${form.backgroundOpacity}%`}>
                  <input type="range" min="0" max="100" step="1" value={form.backgroundOpacity} onChange={e => set('backgroundOpacity', Number(e.target.value))} className="w-full accent-white" />
                </FieldRow>

                <FieldRow label={`Desfoque do Fundo — ${form.backgroundBlur}px`}>
                  <input type="range" min="0" max="20" step="1" value={form.backgroundBlur} onChange={e => set('backgroundBlur', Number(e.target.value))} className="w-full accent-white" />
                </FieldRow>

                <div className="glow-line" />

                <FieldRow label="Layout">
                  <div className="grid grid-cols-2 gap-2">
                    {LAYOUT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set('layoutStyle', opt.value)}
                        className="py-2.5 text-xs font-semibold uppercase tracking-wider transition-all rounded-sm border"
                        style={{
                          backgroundColor: form.layoutStyle === opt.value ? 'rgba(255,255,255,0.1)' : 'transparent',
                          borderColor: form.layoutStyle === opt.value ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                          color: form.layoutStyle === opt.value ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FieldRow>

                <FieldRow label="Fonte">
                  <StyledSelect value={form.fontFamily} onChange={v => set('fontFamily', v)} options={FONT_OPTIONS} />
                </FieldRow>
              </motion.div>
            )}

            {/* ── EFFECTS TAB ───────────────────────────── */}
            {activeTab === 'Efeitos' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <FieldRow label="Efeito de Partículas">
                  <div className="grid grid-cols-2 gap-1.5">
                    {PARTICLE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set('particleEffect', opt.value)}
                        className="py-2.5 px-3 text-xs text-left font-semibold uppercase tracking-wider transition-all rounded-sm border"
                        style={{
                          backgroundColor: form.particleEffect === opt.value ? 'rgba(255,255,255,0.1)' : 'transparent',
                          borderColor: form.particleEffect === opt.value ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                          color: form.particleEffect === opt.value ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FieldRow>

                <div className="glow-line" />

                <FieldRow label="Efeito de Clique">
                  <div className="grid grid-cols-2 gap-1.5">
                    {CLICK_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set('clickEffect', opt.value)}
                        className="py-2.5 px-3 text-xs text-left font-semibold uppercase tracking-wider transition-all rounded-sm border"
                        style={{
                          backgroundColor: form.clickEffect === opt.value ? 'rgba(255,255,255,0.1)' : 'transparent',
                          borderColor: form.clickEffect === opt.value ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                          color: form.clickEffect === opt.value ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FieldRow>

                <div className="glow-line" />

                <FieldRow label="Estilo do Cursor">
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {CURSOR_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => set('cursorStyle', opt.value)}
                        className="py-2 text-xs font-semibold uppercase tracking-wider transition-all rounded-sm border"
                        style={{
                          backgroundColor: form.cursorStyle === opt.value ? 'rgba(255,255,255,0.1)' : 'transparent',
                          borderColor: form.cursorStyle === opt.value ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                          color: form.cursorStyle === opt.value ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <FileUploadButton
                      onFile={(url) => {
                        setCustomCursorDataUrl(url);
                        set('cursorStyle', `url:${url}`);
                      }}
                      accept="image/*"
                    >
                      Cursor Personalizado
                    </FileUploadButton>
                    {form.cursorStyle?.startsWith('url:') && (
                      <button
                        onClick={() => { set('cursorStyle', 'auto'); setCustomCursorDataUrl(''); }}
                        className="text-white/30 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {form.cursorStyle?.startsWith('url:') && (
                    <p className="text-xs text-white/30 mt-1">✓ Cursor personalizado ativo</p>
                  )}
                </FieldRow>
              </motion.div>
            )}

            {/* ── LINKS TAB ──────────────────────────────── */}
            {activeTab === 'Links' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                {/* Current links */}
                {(profile as any)?.links?.length > 0 && (
                  <div>
                    <p className="label-caps mb-3">Links Atuais</p>
                    <div className="space-y-2">
                      {(profile as any).links.map((link: any) => {
                        const plat = SOCIAL_PLATFORMS.find(p => p.value === link.platform);
                        const Icon = plat?.icon || LinkIcon;
                        return (
                          <div key={link.id} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/8 rounded-sm">
                            <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${plat?.color || '#fff'}20`, color: plat?.color || '#fff' }}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{link.label}</p>
                              <p className="text-xs text-white/30 truncate">{link.url}</p>
                            </div>
                            <button onClick={() => handleDeleteLink(link.id)} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="glow-line" />

                {/* Add new link */}
                <div>
                  <p className="label-caps mb-3">Adicionar Rede Social</p>
                  <div className="grid grid-cols-6 gap-1.5 mb-4">
                    {SOCIAL_PLATFORMS.map(plat => {
                      const Icon = plat.icon;
                      const isSelected = selectedPlatform === plat.value;
                      return (
                        <button
                          key={plat.value}
                          onClick={() => {
                            setSelectedPlatform(isSelected ? null : plat.value);
                            setNewLinkUrl('');
                            setNewLinkLabel('');
                          }}
                          title={plat.label}
                          className="aspect-square flex items-center justify-center rounded-sm border transition-all duration-150"
                          style={{
                            backgroundColor: isSelected ? `${plat.color}22` : 'rgba(255,255,255,0.03)',
                            borderColor: isSelected ? `${plat.color}80` : 'rgba(255,255,255,0.08)',
                            color: isSelected ? plat.color : 'rgba(255,255,255,0.4)',
                          }}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {selectedPlatform && selectedPlatformInfo && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="space-y-3 p-4 border border-white/10 rounded-sm bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <selectedPlatformInfo.icon className="w-4 h-4" style={{ color: selectedPlatformInfo.color }} />
                          <span className="text-sm font-semibold">{selectedPlatformInfo.label}</span>
                        </div>
                        <div>
                          <label className="label-caps block mb-1.5">URL</label>
                          <StyledInput
                            value={newLinkUrl}
                            onChange={e => setNewLinkUrl(e.target.value)}
                            placeholder={selectedPlatformInfo.placeholder}
                          />
                        </div>
                        <div>
                          <label className="label-caps block mb-1.5">Rótulo (opcional)</label>
                          <StyledInput
                            value={newLinkLabel}
                            onChange={e => setNewLinkLabel(e.target.value)}
                            placeholder={selectedPlatformInfo.label}
                          />
                        </div>
                        <button
                          onClick={handleAddLink}
                          disabled={!newLinkUrl.trim() || addLink.isPending}
                          className="btn-solid-white w-full py-2.5 text-xs disabled:opacity-50"
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
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                <FieldRow label="Exibir Contador de Visitas">
                  <button
                    onClick={() => set('showViews', !form.showViews)}
                    className="flex items-center gap-3 px-4 py-3 border rounded-sm transition-all text-sm w-full"
                    style={{
                      backgroundColor: form.showViews ? 'rgba(255,255,255,0.08)' : 'transparent',
                      borderColor: form.showViews ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                      color: form.showViews ? '#fff' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    <div
                      className="w-10 h-5 rounded-full border relative transition-all"
                      style={{
                        backgroundColor: form.showViews ? '#fff' : 'transparent',
                        borderColor: form.showViews ? '#fff' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                        style={{
                          backgroundColor: form.showViews ? '#000' : 'rgba(255,255,255,0.5)',
                          left: form.showViews ? '1.25rem' : '0.125rem',
                        }}
                      />
                    </div>
                    <span className="font-semibold uppercase tracking-wider text-xs">
                      {form.showViews ? 'Visível' : 'Oculto'}
                    </span>
                  </button>
                </FieldRow>

                <div className="glow-line" />

                <div>
                  <p className="label-caps mb-3">Música no Perfil</p>
                  <div className="grid grid-cols-4 gap-1 mb-3">
                    {[
                      { value: 'url', label: 'URL' },
                      { value: 'file', label: 'Arquivo' },
                      { value: 'spotify', label: 'Spotify' },
                      { value: 'soundcloud', label: 'Sound' },
                    ].map(t => (
                      <button
                        key={t.value}
                        onClick={() => setMusicType(t.value as any)}
                        className="py-2 text-xs font-semibold uppercase tracking-wider transition-all rounded-sm border"
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
                      <div className="flex-1 bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white/40 rounded-sm truncate">
                        {form.musicUrl ? 'Arquivo carregado ✓' : 'Nenhum arquivo'}
                      </div>
                      <FileUploadButton onFile={url => set('musicUrl', url)} accept="audio/*">
                        Selecionar
                      </FileUploadButton>
                    </div>
                  ) : (
                    <StyledInput
                      value={form.musicUrl}
                      onChange={e => set('musicUrl', e.target.value)}
                      placeholder={
                        musicType === 'spotify' ? 'https://open.spotify.com/track/...' :
                        musicType === 'soundcloud' ? 'https://soundcloud.com/...' :
                        'https://...mp3'
                      }
                    />
                  )}
                  <p className="text-xs text-white/25 mt-1">A música toca quando visitantes acessam seu perfil.</p>
                </div>

                <div className="glow-line" />

                <div className="p-4 border border-white/8 rounded-sm bg-white/[0.02]">
                  <p className="label-caps mb-2">Integração com Discord</p>
                  <p className="text-xs text-white/30 mb-3">
                    Conecte seu Discord para exibir status ao vivo, atividade e avatar no seu perfil.
                  </p>
                  <button className="btn-outline-white text-xs w-full py-2.5">
                    Conectar Discord (OAuth)
                  </button>
                </div>

                <div className="p-4 border border-white/8 rounded-sm bg-white/[0.02]">
                  <p className="label-caps mb-2">Integração de Música</p>
                  <p className="text-xs text-white/30 mb-3">
                    A integração com Spotify & Last.fm exibe a música que você está ouvindo com arte do álbum.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button className="btn-outline-white text-xs w-full py-2.5">Conectar Spotify</button>
                    <button className="btn-outline-white text-xs w-full py-2.5">Conectar Last.fm</button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview panel */}
      <div className="hidden lg:block flex-1 bg-black relative overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <span className="label-caps bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 text-white/50">
            Pré-visualização ao Vivo
          </span>
        </div>
        <div className="w-full h-full overflow-y-auto">
          <ProfileView profile={liveProfile as any} isOwner={true} />
        </div>
      </div>
    </div>
  );
}
