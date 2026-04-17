import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => { login(res.token); setLocation("/dashboard"); },
      onError: (err: any) => {
        toast({ title: "Falha no login", description: err.error || "Credenciais inválidas", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5">
        <Link href="/">
          <span className="text-sm font-bold tracking-[0.25em] uppercase text-white hover:opacity-70 transition-opacity">FAREN</span>
        </Link>
        <Link href="/register" className="nav-link">Criar conta</Link>
      </nav>

      {/* Background */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-[0.08]"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=80)" }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-black via-black to-black/90" />

      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-10">
            <p className="label-caps mb-4">Entrar</p>
            <h1 className="text-4xl font-bold tracking-tight uppercase">Bem-vindo<br />de Volta</h1>
          </div>

          <div className="glow-line mb-10" />

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label-caps block mb-2">E-mail</label>
              <input
                {...form.register("email")}
                type="email"
                placeholder="voce@exemplo.com"
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors rounded-sm"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-xs mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label-caps block mb-2">Senha</label>
              <input
                {...form.register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 transition-colors rounded-sm"
              />
              {form.formState.errors.password && (
                <p className="text-red-400 text-xs mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loginMutation.isPending}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="btn-solid-white w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? "Entrando..." : (
                <>Entrar <ArrowRight className="ml-2 w-4 h-4 inline" /></>
              )}
            </motion.button>
          </form>

          <div className="glow-line mt-10 mb-6" />

          <p className="label-caps text-center mb-4">
            Sem conta?{" "}
            <Link href="/register" className="text-white/60 hover:text-white transition-colors">
              Criar uma →
            </Link>
          </p>
          <p className="label-caps text-center">
            Esqueceu a senha?{" "}
            <Link href="/suporte" className="text-white/60 hover:text-white transition-colors">
              Pedir ajuda →
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
