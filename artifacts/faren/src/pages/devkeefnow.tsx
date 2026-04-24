import { useState, useEffect } from "react";
import { Search, ShieldBan, BadgeCheck, LogOut, AlertTriangle, CheckCircle, XCircle, Users, Flag, HeadphonesIcon, FileText } from "lucide-react";

interface AdminUser {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  banned: boolean;
  emailVerified: boolean;
  registrationIp: string | null;
  lastLoginIp: string | null;
  createdAt: string | null;
  badges: string[] | null;
  followersCount: number | null;
  viewsCount: number | null;
}

interface AdminReport {
  id: number;
  reportedUserId: number;
  reporterUserId: number | null;
  reason: string;
  details: string | null;
  reporterIp: string | null;
  status: string;
  createdAt: string | null;
  reportedUsername: string | null;
  reportedDisplayName: string | null;
}

interface SupportTicket {
  id: number;
  email: string;
  username: string | null;
  subject: string;
  message: string;
  socialNetwork: string | null;
  status: string;
  createdAt: string | null;
}

interface PostReport {
  id: number;
  postId: number;
  reason: string;
  status: string;
  reporterIp: string | null;
  createdAt: string | null;
  postContent: string | null;
  reporterUserId: number | null;
}

const apiBase = `${(import.meta.env.VITE_API_URL || import.meta.env.BASE_URL).replace(/\/+$/, "")}/api`;

export default function DevKeefnow() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [support, setSupport] = useState<SupportTicket[]>([]);
  const [postReports, setPostReports] = useState<PostReport[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "reports" | "support" | "postReports">("users");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const request = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem("adminToken");
      setToken("");
      throw new Error("Sessão expirada. Faça login novamente.");
    }
    if (!response.ok) throw new Error(data.error || "Erro na operação");
    return data;
  };

  const submitLogin = async () => {
    setError("");
    try {
      const res = await fetch(`${apiBase}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login inválido");
      localStorage.setItem("adminToken", data.token);
      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchUsers = async (q = "") => {
    setError("");
    setLoading(true);
    try {
      const data = await request(`/admin/users?q=${encodeURIComponent(q)}`);
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await request(`/admin/reports?status=pending`);
      setReports(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupport = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await request(`/admin/support`);
      setSupport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostReports = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await request(`/admin/post-reports`);
      setPostReports(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUsers();
    fetchReports();
    fetchSupport();
    fetchPostReports();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => fetchUsers(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const updateUser = async (userId: number, action: "ban" | "verified", enabled: boolean, verifiedType?: string) => {
    await request(`/admin/users/${userId}/${action}`, {
      method: "POST",
      body: JSON.stringify(action === "ban" ? { banned: enabled } : { verified: enabled, type: verifiedType || "verified" }),
    });
    fetchUsers(query);
  };

  const renameUser = async (user: AdminUser) => {
    const next = window.prompt(`Novo @ para @${user.username}\n(3-15 chars, [a-z 0-9 _], sem _ no início/fim/duplo)`, user.username);
    if (next == null) return;
    const cleaned = next.trim().replace(/^@/, "").toLowerCase();
    if (!cleaned || cleaned === user.username) return;
    try {
      await request(`/admin/users/${user.id}/username`, {
        method: "POST",
        body: JSON.stringify({ username: cleaned }),
      });
      fetchUsers(query);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resolveReport = async (reportId: number, action: "dismiss" | "ban") => {
    await request(`/admin/reports/${reportId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    fetchReports();
    fetchUsers(query);
  };

  const resolveTicket = async (ticketId: number, status: string) => {
    await request(`/admin/support/${ticketId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    fetchSupport();
  };

  const resolvePostReport = async (reportId: number, action: "dismiss" | "remove") => {
    await request(`/admin/post-reports/${reportId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    fetchPostReports();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm border border-white/10 bg-white/[0.03] p-6 rounded-sm">
          <p className="label-caps mb-3">Área restrita</p>
          <h1 className="text-2xl font-bold mb-6 uppercase tracking-tight">Dev Keefnow</h1>
          <div className="space-y-3">
            <input
              value={login}
              onChange={e => setLogin(e.target.value)}
              placeholder="Login"
              className="w-full bg-black border border-white/10 px-3 py-3 text-sm outline-none focus:border-white/30"
            />
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              type="password"
              onKeyDown={e => e.key === "Enter" && submitLogin()}
              className="w-full bg-black border border-white/10 px-3 py-3 text-sm outline-none focus:border-white/30"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button onClick={submitLogin} className="btn-solid-white w-full">Entrar</button>
          </div>
        </div>
      </div>
    );
  }

  const pendingSupport = support.filter(t => t.status === 'pending').length;
  const pendingPostReports = postReports.length;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="label-caps mb-2">Painel privado</p>
            <h1 className="text-4xl font-bold uppercase">Dev Keefnow</h1>
          </div>
          <button
            onClick={() => { localStorage.removeItem("adminToken"); setToken(""); }}
            className="nav-link flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-white/10 flex-wrap">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold tracking-wider uppercase transition-colors border-b-2 ${activeTab === "users" ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"}`}
          >
            <Users className="w-4 h-4" />
            Usuários
            <span className="ml-1 text-xs text-white/30">{users.length}</span>
          </button>
          <button
            onClick={() => { setActiveTab("reports"); fetchReports(); }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold tracking-wider uppercase transition-colors border-b-2 ${activeTab === "reports" ? "border-red-400 text-red-400" : "border-transparent text-white/40 hover:text-white/70"}`}
          >
            <Flag className="w-4 h-4" />
            Denúncias Perfil
            {reports.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{reports.length}</span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("postReports"); fetchPostReports(); }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold tracking-wider uppercase transition-colors border-b-2 ${activeTab === "postReports" ? "border-orange-400 text-orange-400" : "border-transparent text-white/40 hover:text-white/70"}`}
          >
            <FileText className="w-4 h-4" />
            Denúncias Posts
            {pendingPostReports > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingPostReports}</span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab("support"); fetchSupport(); }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold tracking-wider uppercase transition-colors border-b-2 ${activeTab === "support" ? "border-blue-400 text-blue-400" : "border-transparent text-white/40 hover:text-white/70"}`}
          >
            <HeadphonesIcon className="w-4 h-4" />
            Suporte
            {pendingSupport > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingSupport}</span>
            )}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            <div className="flex gap-2 mb-4">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Pesquisar usuário, e-mail ou nome..."
                className="flex-1 bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30"
              />
              <button onClick={() => fetchUsers(query)} className="btn-solid-white px-4">
                <Search className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white/30 text-xs mb-3">{users.length} usuário{users.length !== 1 ? 's' : ''}</p>
            {loading && <p className="text-white/40 text-sm">Carregando...</p>}
            <div className="space-y-2">
              {users.map(user => {
                const isVerifiedBlue = !!user.badges?.includes("verified");
                const isVerifiedGold = !!user.badges?.includes("verified_gold");
                const isVerifiedWhite = !!user.badges?.includes("verified_white");
                const isVerified = isVerifiedBlue || isVerifiedGold || isVerifiedWhite;
                const currentType = isVerifiedGold ? "verified_gold" : isVerifiedWhite ? "verified_white" : "verified";
                return (
                  <div key={user.id} className="border border-white/10 bg-white/[0.03] p-4 flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold">@{user.username}</p>
                        {isVerifiedGold && <BadgeCheck className="w-4 h-4" style={{ color: '#FFD700' }} title="Verificado Dourado" />}
                        {isVerifiedWhite && <BadgeCheck className="w-4 h-4 text-white" title="Verificado Branco" />}
                        {isVerifiedBlue && <BadgeCheck className="w-4 h-4 text-blue-400" title="Verificado Azul" />}
                        {user.banned && <span className="text-xs text-red-400 uppercase tracking-wider">Banido</span>}
                      </div>
                      <p className="text-sm text-white/45 truncate">{user.email}{user.displayName ? ` • ${user.displayName}` : ""}</p>
                      <div className="flex gap-4 mt-1 text-xs text-white/25 flex-wrap">
                        <span>IP criação: {user.registrationIp || "n/a"}</span>
                        <span>Último IP: {user.lastLoginIp || "n/a"}</span>
                        <span>{user.followersCount || 0} seguidores</span>
                        <span>{user.viewsCount || 0} visitas</span>
                        {user.createdAt && <span>Criado: {new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateUser(user.id, "verified", true, "verified")}
                          className="px-2 py-2 border text-xs uppercase tracking-wider transition-colors"
                          style={isVerifiedBlue ? { borderColor: '#60a5fa', color: '#60a5fa', background: 'rgba(96,165,250,0.15)' } : { borderColor: 'rgba(96,165,250,0.3)', color: '#60a5fa' }}
                          title="Verificar Azul"
                        >
                          ✓ Azul
                        </button>
                        <button
                          onClick={() => updateUser(user.id, "verified", true, "verified_gold")}
                          className="px-2 py-2 border text-xs uppercase tracking-wider transition-colors"
                          style={isVerifiedGold ? { borderColor: '#FFD700', color: '#FFD700', background: 'rgba(255,215,0,0.15)' } : { borderColor: 'rgba(255,215,0,0.3)', color: '#FFD700' }}
                          title="Verificar Dourado"
                        >
                          ✓ Ouro
                        </button>
                        <button
                          onClick={() => updateUser(user.id, "verified", true, "verified_white")}
                          className="px-2 py-2 border text-xs uppercase tracking-wider transition-colors"
                          style={isVerifiedWhite ? { borderColor: 'rgba(255,255,255,0.8)', color: '#fff', background: 'rgba(255,255,255,0.1)' } : { borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
                          title="Verificar Branco"
                        >
                          ✓ Branco
                        </button>
                        {isVerified && (
                          <button
                            onClick={() => updateUser(user.id, "verified", false)}
                            className="px-2 py-2 border border-white/15 text-xs uppercase tracking-wider text-white/40 hover:bg-white/5 transition-colors"
                            title="Remover verificação"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => renameUser(user)}
                        className="px-3 py-2 border border-white/15 text-xs uppercase tracking-wider text-white/60 hover:bg-white/5 transition-colors"
                        title="Renomear @"
                      >
                        Renomear @
                      </button>
                      <button
                        onClick={() => updateUser(user.id, "ban", !user.banned)}
                        className={`px-3 py-2 border text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors ${user.banned ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-red-500/30 text-red-300 hover:bg-red-500/10"}`}
                      >
                        <ShieldBan className="w-3.5 h-3.5" />
                        {user.banned ? "Desbanir" : "Banir"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {!loading && users.length === 0 && (
                <p className="text-white/30 text-sm py-8 text-center">Nenhum usuário encontrado.</p>
              )}
            </div>
          </>
        )}

        {/* Profile Reports Tab */}
        {activeTab === "reports" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/30 text-xs">{reports.length} denúncia{reports.length !== 1 ? 's' : ''} pendente{reports.length !== 1 ? 's' : ''}</p>
              <button onClick={fetchReports} className="text-xs text-white/40 hover:text-white transition-colors">Atualizar</button>
            </div>
            {loading && <p className="text-white/40 text-sm">Carregando...</p>}
            <div className="space-y-3">
              {reports.map(report => (
                <div key={report.id} className="border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <span className="font-bold">@{report.reportedUsername || `user#${report.reportedUserId}`}</span>
                        {report.reportedDisplayName && <span className="text-white/40 text-sm truncate">({report.reportedDisplayName})</span>}
                      </div>
                      <p className="text-sm font-medium text-white/80 mb-1">Motivo: {report.reason}</p>
                      {report.details && <p className="text-xs text-white/40 mb-2 whitespace-pre-wrap">{report.details}</p>}
                      <div className="flex gap-4 text-xs text-white/25 flex-wrap">
                        {report.reporterIp && <span>IP: {report.reporterIp}</span>}
                        {report.createdAt && <span>{new Date(report.createdAt).toLocaleString('pt-BR')}</span>}
                        <span>Denúncia #{report.id}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => resolveReport(report.id, "dismiss")}
                        className="px-3 py-2 border border-white/15 text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-white/5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Ignorar
                      </button>
                      <button
                        onClick={() => resolveReport(report.id, "ban")}
                        className="px-3 py-2 border border-red-500/30 text-xs uppercase tracking-wider text-red-300 flex items-center gap-1.5 hover:bg-red-500/10 transition-colors"
                      >
                        <ShieldBan className="w-3.5 h-3.5" /> Banir usuário
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && reports.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500/50" />
                  <p className="text-white/30 text-sm">Nenhuma denúncia pendente.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Post Reports Tab */}
        {activeTab === "postReports" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/30 text-xs">{postReports.length} denúncia{postReports.length !== 1 ? 's' : ''} de post pendente{postReports.length !== 1 ? 's' : ''}</p>
              <button onClick={fetchPostReports} className="text-xs text-white/40 hover:text-white transition-colors">Atualizar</button>
            </div>
            {loading && <p className="text-white/40 text-sm">Carregando...</p>}
            <div className="space-y-3">
              {postReports.map(report => (
                <div key={report.id} className="border border-orange-500/20 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        <span className="font-bold text-sm">Post #{report.postId}</span>
                        <span className="text-xs text-white/30">Motivo: {report.reason}</span>
                      </div>
                      {report.postContent && (
                        <p className="text-xs text-white/50 bg-white/[0.03] p-2 rounded-sm mb-2 line-clamp-3 whitespace-pre-wrap">{report.postContent}</p>
                      )}
                      <div className="flex gap-4 text-xs text-white/25 flex-wrap">
                        {report.reporterIp && <span>IP: {report.reporterIp}</span>}
                        {report.createdAt && <span>{new Date(report.createdAt).toLocaleString('pt-BR')}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => resolvePostReport(report.id, "dismiss")}
                        className="px-3 py-2 border border-white/15 text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-white/5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Ignorar
                      </button>
                      <button
                        onClick={() => resolvePostReport(report.id, "remove")}
                        className="px-3 py-2 border border-red-500/30 text-xs uppercase tracking-wider text-red-300 flex items-center gap-1.5 hover:bg-red-500/10 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Remover post
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && postReports.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500/50" />
                  <p className="text-white/30 text-sm">Nenhuma denúncia de post pendente.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Support Tab */}
        {activeTab === "support" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/30 text-xs">{support.length} ticket{support.length !== 1 ? 's' : ''} de suporte</p>
              <button onClick={fetchSupport} className="text-xs text-white/40 hover:text-white transition-colors">Atualizar</button>
            </div>
            {loading && <p className="text-white/40 text-sm">Carregando...</p>}
            <div className="space-y-3">
              {support.map(ticket => (
                <div key={ticket.id} className={`border p-4 ${ticket.status === 'pending' ? 'border-blue-500/20 bg-blue-500/[0.03]' : 'border-white/10 bg-white/[0.02]'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <HeadphonesIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="font-bold text-sm">{ticket.subject}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.status === 'pending' ? 'bg-blue-500/20 text-blue-400' : ticket.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                          {ticket.status === 'pending' ? 'Pendente' : ticket.status === 'resolved' ? 'Resolvido' : ticket.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mb-1">📧 {ticket.email}{ticket.username ? ` • @${ticket.username}` : ''}</p>
                      {ticket.socialNetwork && <p className="text-xs text-white/40 mb-1">Rede social: {ticket.socialNetwork}</p>}
                      <p className="text-sm text-white/70 whitespace-pre-wrap bg-white/[0.03] p-2 rounded-sm mt-2 mb-2">{ticket.message}</p>
                      {ticket.createdAt && <p className="text-xs text-white/25">{new Date(ticket.createdAt).toLocaleString('pt-BR')}</p>}
                    </div>
                    {ticket.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => resolveTicket(ticket.id, 'resolved')}
                          className="px-3 py-2 border border-green-500/30 text-xs uppercase tracking-wider text-green-400 flex items-center gap-1.5 hover:bg-green-500/10 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Resolver
                        </button>
                        <button
                          onClick={() => resolveTicket(ticket.id, 'dismissed')}
                          className="px-3 py-2 border border-white/15 text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-white/5 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Fechar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!loading && support.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500/50" />
                  <p className="text-white/30 text-sm">Nenhum ticket de suporte.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
