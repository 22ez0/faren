import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useGetMyProfile, useUpdateProfile, Profile } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import ProfileView from "@/components/ProfileView";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";

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
  { value: 'none', label: 'None' },
  { value: 'snow', label: '❄️ Snow' },
  { value: 'stars', label: '⭐ Stars' },
  { value: 'sakura', label: '🌸 Sakura' },
  { value: 'fireflies', label: '✨ Fireflies' },
  { value: 'bubbles', label: '🫧 Bubbles' },
  { value: 'rain', label: '🌧️ Rain' },
];

const CLICK_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'hearts', label: '❤️ Hearts' },
  { value: 'stars', label: '⭐ Stars' },
  { value: 'sparkles', label: '✦ Sparkles' },
  { value: 'explosions', label: '💥 Explosions' },
];

const CURSOR_OPTIONS = [
  { value: 'auto', label: 'Default' },
  { value: 'crosshair', label: 'Crosshair' },
  { value: 'none', label: 'Hidden' },
];

const FONT_OPTIONS = [
  { value: 'default', label: 'Inter (Default)' },
  { value: 'mono', label: 'Monospace' },
  { value: 'cursive', label: 'Cursive' },
  { value: 'serif', label: 'Serif' },
  { value: 'pixel', label: '8-Bit Pixel' },
];

const LAYOUT_OPTIONS = [
  { value: 'centered', label: 'Centered' },
  { value: 'left', label: 'Left-aligned' },
];

const BADGE_OPTIONS = [
  { value: 'verified', label: '✓ Verified' },
  { value: 'creator', label: '🎨 Creator' },
  { value: 'music-head', label: '🎧 Music Head' },
  { value: 'gamer', label: '🎮 Gamer' },
  { value: 'developer', label: '💻 Developer' },
  { value: 'streamer', label: '🎙 Streamer' },
  { value: 'artist', label: '🖌 Artist' },
  { value: 'star', label: '⭐ Rising Star' },
  { value: 'og', label: '👑 OG Member' },
  { value: 'vip', label: '⚡ VIP' },
];

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

const TABS = ['Basic', 'Theme', 'Effects', 'Advanced'];

export default function EditProfile() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('Basic');
  const [newTypewriterText, setNewTypewriterText] = useState('');

  const { data: profile, isLoading: profileLoading } = useGetMyProfile({
    query: { queryKey: [] as any, enabled: isAuthenticated },
  });

  const updateProfile = useUpdateProfile();
  const [form, setForm] = useState<ProfileFormState>({
    displayName: '', bio: '', avatarUrl: '', bannerUrl: '',
    backgroundUrl: '', backgroundType: 'image',
    accentColor: '#8b5cf6', glowColor: '#8b5cf6',
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
        accentColor: profile.accentColor || '#8b5cf6',
        glowColor: profile.glowColor || '#8b5cf6',
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
        onSuccess: () => toast({ title: "Profile saved!" }),
        onError: (err: any) => toast({ title: "Failed to save", description: err.error, variant: "destructive" }),
      }
    );
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="label-caps">Loading...</p>
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* Editor panel */}
      <div className="w-full lg:w-[440px] xl:w-[500px] flex flex-col border-r border-white/8 z-20 bg-background">

        {/* Header */}
        <div className="h-14 border-b border-white/8 flex items-center justify-between px-4 flex-shrink-0">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 nav-link"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <span className="label-caps">Profile Editor</span>
          <motion.button
            onClick={save}
            disabled={updateProfile.isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-solid-white py-2 px-4 text-xs disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Saving...' : (
              <><Save className="w-3 h-3 inline mr-1.5" /> Save</>
            )}
          </motion.button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/8 flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-xs font-semibold tracking-widest uppercase transition-colors duration-200 relative"
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
            {activeTab === 'Basic' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <FieldRow label="Display Name">
                  <StyledInput
                    value={form.displayName}
                    onChange={e => set('displayName', e.target.value)}
                    placeholder="Your name"
                  />
                </FieldRow>

                <FieldRow label="Bio">
                  <textarea
                    value={form.bio}
                    onChange={e => set('bio', e.target.value)}
                    placeholder="Write something about yourself..."
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors rounded-sm resize-none"
                  />
                </FieldRow>

                <FieldRow label="Typewriter Texts (cycle through these)">
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
                        placeholder="Add text..."
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

                <FieldRow label="Avatar URL">
                  <StyledInput value={form.avatarUrl} onChange={e => set('avatarUrl', e.target.value)} placeholder="https://..." />
                </FieldRow>

                <FieldRow label="Banner URL">
                  <StyledInput value={form.bannerUrl} onChange={e => set('bannerUrl', e.target.value)} placeholder="https://..." />
                </FieldRow>

                <FieldRow label="Profile Title (browser tab)">
                  <StyledInput value={form.profileTitle} onChange={e => set('profileTitle', e.target.value)} placeholder="My Faren Profile" />
                </FieldRow>

                <div className="glow-line" />

                <FieldRow label="Badges">
                  <div className="grid grid-cols-2 gap-1.5">
                    {BADGE_OPTIONS.map(badge => {
                      const active = form.badges.includes(badge.value);
                      return (
                        <button
                          key={badge.value}
                          onClick={() => toggleBadge(badge.value)}
                          className="flex items-center gap-2 px-3 py-2 text-xs rounded-sm border transition-all duration-150"
                          style={{
                            backgroundColor: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                            borderColor: active ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)',
                            color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
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
            {activeTab === 'Theme' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FieldRow label="Accent Color">
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.accentColor}
                        onChange={e => set('accentColor', e.target.value)}
                        className="w-10 h-9 rounded-sm border border-white/10 bg-transparent cursor-pointer"
                      />
                      <StyledInput value={form.accentColor} onChange={e => set('accentColor', e.target.value)} className="flex-1" />
                    </div>
                  </FieldRow>
                  <FieldRow label="Glow Color">
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={form.glowColor}
                        onChange={e => set('glowColor', e.target.value)}
                        className="w-10 h-9 rounded-sm border border-white/10 bg-transparent cursor-pointer"
                      />
                      <StyledInput value={form.glowColor} onChange={e => set('glowColor', e.target.value)} className="flex-1" />
                    </div>
                  </FieldRow>
                </div>

                <div className="glow-line" />

                <FieldRow label="Background Type">
                  <div className="grid grid-cols-3 gap-1">
                    {['image', 'video', 'color'].map(type => (
                      <button
                        key={type}
                        onClick={() => set('backgroundType', type)}
                        className="py-2 text-xs font-semibold uppercase tracking-wider transition-all rounded-sm border"
                        style={{
                          backgroundColor: form.backgroundType === type ? 'rgba(255,255,255,0.1)' : 'transparent',
                          borderColor: form.backgroundType === type ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                          color: form.backgroundType === type ? '#fff' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </FieldRow>

                <FieldRow label="Background URL (image or video)">
                  <StyledInput value={form.backgroundUrl} onChange={e => set('backgroundUrl', e.target.value)} placeholder="https://..." />
                </FieldRow>

                <FieldRow label={`Background Opacity — ${form.backgroundOpacity}%`}>
                  <input
                    type="range" min="0" max="100" step="1"
                    value={form.backgroundOpacity}
                    onChange={e => set('backgroundOpacity', Number(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </FieldRow>

                <FieldRow label={`Background Blur — ${form.backgroundBlur}px`}>
                  <input
                    type="range" min="0" max="20" step="1"
                    value={form.backgroundBlur}
                    onChange={e => set('backgroundBlur', Number(e.target.value))}
                    className="w-full accent-violet-500"
                  />
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

                <FieldRow label="Font">
                  <StyledSelect value={form.fontFamily} onChange={v => set('fontFamily', v)} options={FONT_OPTIONS} />
                </FieldRow>
              </motion.div>
            )}

            {/* ── EFFECTS TAB ───────────────────────────── */}
            {activeTab === 'Effects' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <FieldRow label="Particle Effect">
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

                <FieldRow label="Click Effect">
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

                <FieldRow label="Cursor Style">
                  <div className="grid grid-cols-3 gap-1">
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
                </FieldRow>
              </motion.div>
            )}

            {/* ── ADVANCED TAB ──────────────────────────── */}
            {activeTab === 'Advanced' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
              >
                <FieldRow label="Show View Count">
                  <button
                    onClick={() => set('showViews', !form.showViews)}
                    className="flex items-center gap-3 px-4 py-3 border rounded-sm transition-all text-sm w-full"
                    style={{
                      backgroundColor: form.showViews ? 'rgba(139,92,246,0.12)' : 'transparent',
                      borderColor: form.showViews ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)',
                      color: form.showViews ? '#a78bfa' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    <div
                      className="w-10 h-5 rounded-full border relative transition-all"
                      style={{
                        backgroundColor: form.showViews ? '#8b5cf6' : 'transparent',
                        borderColor: form.showViews ? '#8b5cf6' : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: form.showViews ? '1.25rem' : '0.125rem' }}
                      />
                    </div>
                    <span className="font-semibold uppercase tracking-wider text-xs">
                      {form.showViews ? 'Visible' : 'Hidden'}
                    </span>
                  </button>
                </FieldRow>

                <div className="glow-line" />

                <div className="p-4 border border-white/8 rounded-sm bg-white/[0.02]">
                  <p className="label-caps mb-2">Discord Integration</p>
                  <p className="text-xs text-white/30 mb-3">
                    Connect your Discord to show live status, activity, and avatar on your profile.
                  </p>
                  <button className="btn-outline-white text-xs w-full py-2.5">
                    Connect Discord (OAuth)
                  </button>
                </div>

                <div className="p-4 border border-white/8 rounded-sm bg-white/[0.02]">
                  <p className="label-caps mb-2">Music Integration</p>
                  <p className="text-xs text-white/30 mb-3">
                    Spotify & Last.fm integration shows your now playing track with album art.
                  </p>
                  <div className="flex flex-col gap-2">
                    <button className="btn-outline-white text-xs w-full py-2.5">
                      Connect Spotify
                    </button>
                    <button className="btn-outline-white text-xs w-full py-2.5">
                      Connect Last.fm
                    </button>
                  </div>
                </div>

                <FieldRow label="Background Audio URL (MP3)">
                  <StyledInput value={form.musicUrl} onChange={e => set('musicUrl', e.target.value)} placeholder="https://...mp3" />
                  <p className="text-xs text-white/25 mt-1">Plays ambient audio when visitors load your profile.</p>
                </FieldRow>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview panel */}
      <div className="hidden lg:block flex-1 bg-black relative overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <span className="label-caps bg-black/60 backdrop-blur-md px-4 py-2 border border-white/10 text-white/50">
            Live Preview
          </span>
        </div>
        <div className="w-full h-full overflow-y-auto">
          <ProfileView profile={liveProfile as any} isOwner={true} />
        </div>
      </div>
    </div>
  );
}
