import { useState } from "react";
import { Search, ShieldBan, BadgeCheck, LogOut } from "lucide-react";

interface AdminUser {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  banned: boolean;
  emailVerified: boolean;
  registrationIp: string | null;
  lastLoginIp: string | null;
  badges: string[] | null;
}

const apiBase = `${(import.meta.env.VITE_API_URL || import.meta.env.BASE_URL).replace(/\/+$/, "")}/api`;

export default function DevKeefnow() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("adminToken") || "");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");

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
      const data = await fetch(`${apiBase}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      }).then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Login inválido");
        return data;
      });
      localStorage.setItem("adminToken", data.token);
      setToken(data.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const searchUsers = async () => {
    setError("");
    try {
      const data = await request(`/admin/users?q=${encodeURIComponent(query)}`);
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateUser = async (userId: number, action: "ban" | "verified", enabled: boolean) => {
    await request(`/admin/users/${userId}/${action}`, {
      method: "POST",
      body: JSON.stringify(action === "ban" ? { banned: enabled } : { verified: enabled }),
    });
    await searchUsers();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm border border-white/10 bg-white/[0.03] p-6 rounded-sm">
          <p className="label-caps mb-3">Área restrita</p>
          <h1 className="text-2xl font-bold mb-6 uppercase tracking-tight">Dev Keefnow</h1>
          <div className="space-y-3">
            <input value={login} onChange={e => setLogin(e.target.value)} placeholder="Login" className="w-full bg-black border border-white/10 px-3 py-3 text-sm outline-none focus:border-white/30" />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" type="password" className="w-full bg-black border border-white/10 px-3 py-3 text-sm outline-none focus:border-white/30" />
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
          <button onClick={() => { localStorage.removeItem("adminToken"); setToken(""); }} className="nav-link flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchUsers()} placeholder="Pesquisar usuário, e-mail ou nome" className="flex-1 bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/30" />
          <button onClick={searchUsers} className="btn-solid-white"><Search className="w-4 h-4 mr-2" /> Buscar</button>
        </div>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="space-y-2">
          {users.map(user => {
            const verified = !!user.badges?.includes("verified");
            return (
              <div key={user.id} className="border border-white/10 bg-white/[0.03] p-4 flex flex-col md:flex-row gap-4 md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">@{user.username}</p>
                    {verified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                    {user.banned && <span className="text-xs text-red-400 uppercase tracking-wider">Banido</span>}
                  </div>
                  <p className="text-sm text-white/45">{user.email} {user.displayName ? `• ${user.displayName}` : ""}</p>
                  <p className="text-xs text-white/30 mt-1">IP criação: {user.registrationIp || "n/a"} • último IP: {user.lastLoginIp || "n/a"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateUser(user.id, "verified", !verified)} className="px-3 py-2 border border-white/15 text-xs uppercase tracking-wider">
                    {verified ? "Remover verificado" : "Dar verificado"}
                  </button>
                  <button onClick={() => updateUser(user.id, "ban", !user.banned)} className="px-3 py-2 border border-red-500/30 text-xs uppercase tracking-wider text-red-300 flex items-center gap-2">
                    <ShieldBan className="w-3.5 h-3.5" /> {user.banned ? "Desbanir" : "Banir"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}