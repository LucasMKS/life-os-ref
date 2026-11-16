import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { authService } from "@/lib/api";
import { cookieUtils } from "@/lib/cookieUtils";
import { extractUserIdFromToken } from "@/lib/jwtUtils";
import { isTokenExpired, sanitizeUrl } from "@/lib/security";
import { Lock, Mail, Loader2, LayoutGrid } from "lucide-react";

const REGISTER_URL = sanitizeUrl(
  `https://filmes.lucasmks.com.br/login?callbackUrl=${encodeURIComponent(
    "https://lifeos.lucasmks.com.br/auth/callback",
  )}&action=register`,
);
const RESET_PASSWORD_URL = sanitizeUrl(
  "https://filmes.lucasmks.com.br/reset-password",
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Preencha email e senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authService.login({
        email: trimmedEmail,
        password,
      });

      const token = response?.token;
      if (!token || isTokenExpired(token)) {
        throw new Error("Sessão inválida ou expirada recebida do servidor.");
      }

      let userId =
        response.user?.id != null ? String(response.user.id) : null;

      if (!userId) {
        userId = extractUserIdFromToken(token);
      }

      setAuth(token, String(userId || "1"));
      cookieUtils.setAuthToken(token);

      if (response.user) {
        cookieUtils.setUserData(response.user);
      }

      router.push("/");
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao fazer login";
      setError(typeof message === "string" ? message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative bg-[#09090b] text-zinc-100 p-4 overflow-x-hidden">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none z-0"
      />

      <div className="relative z-10 w-full max-w-md bg-[#111113] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-4">
            <LayoutGrid className="w-5 h-5 text-zinc-200" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Life<span className="text-zinc-400">OS</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Faça login com sua conta integrada
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl mb-5 text-center"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-medium text-zinc-400 mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#09090b] border border-white/[0.08] rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:border-white/25 outline-none transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-zinc-400 mb-1.5"
            >
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#09090b] border border-white/[0.08] rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:border-white/25 outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-zinc-100 text-zinc-950 hover:bg-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Entrar no Life OS"
            )}
          </button>
        </form>

        <div className="mt-6 space-y-2.5">
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-white/[0.06]" />
            <span className="mx-3 text-[11px] uppercase tracking-wider text-zinc-500">
              ou
            </span>
            <div className="flex-1 border-t border-white/[0.06]" />
          </div>

          {REGISTER_URL && (
            <a
              href={REGISTER_URL}
              rel="noopener noreferrer"
              className="block w-full py-2.5 px-4 bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] text-sm font-medium rounded-xl transition-colors text-center"
            >
              Criar conta
            </a>
          )}

          {RESET_PASSWORD_URL && (
            <a
              href={RESET_PASSWORD_URL}
              rel="noopener noreferrer"
              className="block w-full py-2 px-4 text-zinc-500 hover:text-zinc-300 text-xs text-center transition-colors rounded-xl hover:bg-white/[0.03]"
            >
              Esqueci minha senha
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
