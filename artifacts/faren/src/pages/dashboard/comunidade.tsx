import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Send, X, Trash2, Flag, Image as ImageIcon, Video, FileText, BadgeCheck, Copy, ExternalLink, Settings, LogOut } from "lucide-react";
import { useGetMyProfile } from "@workspace/api-client-react";

const apiBase = () => (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

interface Post {
  id: number;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  userId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  badges: string[];
  hasLiked: boolean;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  badges: string[];
}

function Avatar({ url, name, size = 36 }: { url?: string | null; name?: string | null; size?: number }) {
  const initials = (name || '?').charAt(0).toUpperCase();
  if (url) return <img src={url} alt={name || ''} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white/50" style={{ width: size, height: size }}>
      {initials}
    </div>
  );
}

function VerifiedBadge({ badges }: { badges: string[] }) {
  if (!badges?.includes('verified')) return null;
  return <BadgeCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function CommentSection({ postId, onClose }: { postId: number; onClose: () => void }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`${apiBase()}/api/posts/${postId}/comments`)
      .then(r => r.json())
      .then(data => { setComments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [postId]);

  const sendComment = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${apiBase()}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ content: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments(prev => [data, ...prev]);
      setText('');
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mt-3 border-t border-white/8 pt-3"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Comentários</p>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {isAuthenticated && (
        <div className="flex gap-2 mb-4">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendComment()}
            placeholder="Escreva um comentário..."
            className="flex-1 bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 rounded-sm"
            maxLength={500}
          />
          <button
            onClick={sendComment}
            disabled={!text.trim() || sending}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-all rounded-sm"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-white/30 text-center py-4">Carregando...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-white/30 text-center py-4">Nenhum comentário ainda.</p>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <Link href={`/${c.username}`}>
                <Avatar url={c.avatarUrl} name={c.displayName || c.username} size={28} />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <Link href={`/${c.username}`}>
                    <span className="text-xs font-semibold text-white hover:underline">{c.displayName || c.username}</span>
                  </Link>
                  <VerifiedBadge badges={c.badges} />
                  <span className="text-[10px] text-white/25 ml-1">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-xs text-white/70 break-words">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function PostCard({ post, onDelete, currentUserId }: { post: Post; onDelete: (id: number) => void; currentUserId?: number }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(post.hasLiked);
  const [likes, setLikes] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = async () => {
    if (!isAuthenticated || likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await fetch(`${apiBase()}/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: authHeader(),
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setLikes(prev => data.liked ? prev + 1 : Math.max(0, prev - 1));
      }
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`${apiBase()}/api/posts/${post.id}`, { method: 'DELETE', headers: authHeader() });
    if (res.ok) onDelete(post.id);
  };

  const handleReport = async () => {
    if (!reportReason) return;
    const res = await fetch(`${apiBase()}/api/posts/${post.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason }),
    });
    if (res.ok) setReportSent(true);
  };

  const isOwner = currentUserId === post.userId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] border border-white/8 rounded-sm p-4"
    >
      <div className="flex gap-3">
        <Link href={`/${post.username}`}>
          <Avatar url={post.avatarUrl} name={post.displayName || post.username} size={40} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Link href={`/${post.username}`}>
                <span className="text-sm font-semibold text-white hover:underline">{post.displayName || post.username}</span>
              </Link>
              <VerifiedBadge badges={post.badges} />
              <Link href={`/${post.username}`}>
                <span className="text-xs text-white/30">@{post.username}</span>
              </Link>
              <span className="text-[10px] text-white/20">· {timeAgo(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              {!isOwner && (
                <button onClick={() => setReportOpen(r => !r)} className="p-1.5 text-white/20 hover:text-orange-400 transition-colors rounded-sm">
                  <Flag className="w-3.5 h-3.5" />
                </button>
              )}
              {isOwner && (
                <button onClick={handleDelete} className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-sm">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {post.content && (
            <p className="text-sm text-white/80 leading-relaxed mb-3 break-words whitespace-pre-wrap">{post.content}</p>
          )}

          {post.mediaUrl && (
            <div className="mb-3 rounded-sm overflow-hidden max-h-96">
              {post.mediaType === 'video' ? (
                <video src={post.mediaUrl} controls className="w-full max-h-96 object-contain bg-black/50" />
              ) : (
                <img src={post.mediaUrl} alt="" className="w-full object-cover" />
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              disabled={!isAuthenticated || likeLoading}
              className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-red-400' : 'text-white/30 hover:text-red-400'} disabled:opacity-50`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              {likes}
            </button>
            <button
              onClick={() => setShowComments(s => !s)}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {post.commentsCount}
            </button>
          </div>

          <AnimatePresence>
            {showComments && <CommentSection postId={post.id} onClose={() => setShowComments(false)} />}
          </AnimatePresence>

          <AnimatePresence>
            {reportOpen && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 border-t border-white/8 pt-3">
                {reportSent ? (
                  <p className="text-xs text-green-400">Denúncia enviada. Obrigado!</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">Denunciar post</p>
                    {['Spam', 'Conteúdo inapropriado', 'Assédio', 'Discurso de ódio', 'Outro'].map(r => (
                      <button
                        key={r}
                        onClick={() => setReportReason(r)}
                        className={`block w-full text-left text-xs px-3 py-1.5 rounded-sm transition-all ${reportReason === r ? 'bg-white/15 text-white' : 'text-white/40 hover:bg-white/5'}`}
                      >
                        {r}
                      </button>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleReport}
                        disabled={!reportReason}
                        className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs rounded-sm disabled:opacity-30 transition-all"
                      >
                        Enviar
                      </button>
                      <button onClick={() => setReportOpen(false)} className="px-3 py-1.5 text-white/30 hover:text-white text-xs transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function Comunidade() {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: profile } = useGetMyProfile({ query: { queryKey: [] as any, enabled: isAuthenticated } });

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [newPost, setNewPost] = useState('');
  const [newMedia, setNewMedia] = useState('');
  const [newMediaType, setNewMediaType] = useState('');
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileUsername = (profile as any)?.username || user?.username || '';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) setLocation('/login');
  }, [authLoading, isAuthenticated]);

  const fetchPosts = async (reset = false) => {
    const start = reset ? 0 : offset;
    if (!reset && loadingMore) return;
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await fetch(`${apiBase()}/api/posts?limit=20&offset=${start}`, {
        headers: isAuthenticated ? authHeader() : {},
      });
      const data = await res.json();
      if (reset) {
        setPosts(data);
        setOffset(20);
      } else {
        setPosts(prev => [...prev, ...data]);
        setOffset(start + 20);
      }
      setHasMore(data.length === 20);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { if (isAuthenticated) fetchPosts(true); }, [isAuthenticated]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewMedia(reader.result as string);
      setNewMediaType(file.type.startsWith('video') ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePost = async () => {
    if ((!newPost.trim() && !newMedia) || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`${apiBase()}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ content: newPost.trim() || null, mediaUrl: newMedia || null, mediaType: newMediaType || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts(prev => [data, ...prev]);
      setNewPost('');
      setNewMedia('');
      setNewMediaType('');
      toast({ title: 'Postagem publicada!' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = (id: number) => setPosts(prev => prev.filter(p => p.id !== id));

  const currentUserId = (profile as any)?.userId;

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
        <Link href="/">
          <span className="text-sm font-bold tracking-[0.25em] uppercase text-white hover:opacity-70 transition-opacity">FAREN</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-end">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/dashboard/comunidade" className="nav-link text-white">Comunidade</Link>
          <Link href={profileUsername ? `/${profileUsername}` : '/dashboard'} className="nav-link flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Perfil
          </Link>
          <Link href="/dashboard/edit" className="nav-link flex items-center gap-1">
            <Settings className="w-3 h-3" /> Editar
          </Link>
          <button onClick={() => logout()} className="nav-link flex items-center gap-1.5 text-red-400/60 hover:text-red-400">
            <LogOut className="w-3 h-3" /> Sair
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-24 px-4 md:px-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="label-caps mb-2">Comunidade</p>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Feed Social</h1>
        </motion.div>

        {isAuthenticated && (
          <div className="bg-white/[0.03] border border-white/10 rounded-sm p-4 mb-6">
            <div className="flex gap-3">
              <Avatar url={(profile as any)?.avatarUrl} name={(profile as any)?.displayName || user?.username} size={40} />
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder="O que está acontecendo?"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none resize-none"
                  rows={3}
                  maxLength={2000}
                />
                {newMedia && (
                  <div className="relative mt-2 rounded-sm overflow-hidden max-h-48">
                    {newMediaType === 'video'
                      ? <video src={newMedia} className="w-full max-h-48 object-cover" />
                      : <img src={newMedia} alt="" className="w-full max-h-48 object-cover" />
                    }
                    <button onClick={() => { setNewMedia(''); setNewMediaType(''); }} className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-white/30 hover:text-white/60 transition-colors rounded-sm" title="Imagem / Vídeo">
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/20">{newPost.length}/2000</span>
                    <button
                      onClick={handlePost}
                      disabled={(!newPost.trim() && !newMedia) || posting}
                      className="px-4 py-1.5 bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-white/90 disabled:opacity-30 transition-all rounded-sm"
                    >
                      {posting ? '...' : 'Publicar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white/[0.03] border border-white/8 rounded-sm p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 rounded w-32" />
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 border border-white/5 rounded-sm">
            <p className="text-white/30 text-sm">Nenhuma postagem ainda.</p>
            <p className="text-white/15 text-xs mt-1">Seja o primeiro a publicar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onDelete={handleDelete} currentUserId={currentUserId} />
            ))}
            {hasMore && (
              <button
                onClick={() => fetchPosts(false)}
                disabled={loadingMore}
                className="w-full py-3 text-xs text-white/30 hover:text-white/60 transition-colors border border-white/5 hover:border-white/15 rounded-sm"
              >
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
