import { useState, useEffect } from "react";
import { Search, ShieldBan, BadgeCheck, LogOut, AlertTriangle, CheckCircle, XCircle, Users, Flag } from "lucide-react";

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

const apiBase = `${(import.meta.env.VITE_API_URL || import.meta.env.BASE_URL).replace(/\/+$/, "")}/api`;

export default function DevKeefnow() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "reports">("users");
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

  useEffect(() => {
    if (!token) return;
    fetchUsers();
    fetchReports();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(() => fetchUsers(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const updateUser = async (userId: number, action: "ban" | "verified", enabled: boolean) => {
    await request(`/admin/users/${userId}/${action}`, {
      method: "POST",
      body: JSON.stringify(action === "ban" ? { banned: enabled } : { verified: enabled }),
    });
    fetchUsers(query);
  };

  const resolveReport = async (reportId: number, action: "dismiss" | "ban") => {
    await request(`/admin/reports/${reportId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action }),
    });
    fetchReports();
    fetchUsers(query);
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
        <div className="flex gap-0 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold tracking-wider uppercase transition-colors border-b-2 ${activeTab === "users" ? "border-white text-white" : "border-transparent text-white/40 hover:text-white/70"}`}
          >
            <Users className="w-4 h-4" />
            Usuários
            <span className="ml-1 text-xs text-white/30">{users.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold tracking-wider uppercase transition-colors border-b-2 ${activeTab === "reports" ? "border-red-400 text-red-400" : "border-transparent text-white/40 hover:text-white/70"}`}
          >
            <Flag className="w-4 h-4" />
            Denúncias
            {reports.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{reports.length}</span>
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
                const verified = !!user.badges?.includes("verified");
                return (
                  <div key={user.id} className="border border-white/10 bg-white/[0.03] p-4 flex flex-col md:flex-row gap-4 md:items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold">@{user.username}</p>
                        {verified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
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
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateUser(user.id, "verified", !verified)}
                        className="px-3 py-2 border border-white/15 text-xs uppercase tracking-wider hover:bg-white/5 transition-colors"
                      >
                        {verified ? "Remover ✓" : "Verificar"}
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

        {/* Reports Tab */}
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
      </div>
    </div>
  );
}
