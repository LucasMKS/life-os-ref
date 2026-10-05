import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { authService } from "@/lib/api";
import { cookieUtils } from "@/lib/cookieUtils";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login({ email, password });

      const token = response.token;
      const userId = response.user?.id;

      if (!token) {
        throw new Error("Token não recebido do servidor.");
      }

      setAuth(token, String(userId || "user"));
      cookieUtils.setAuthToken(token);

      if (response.user) {
        cookieUtils.setUserData(response.user);
      }

      router.push("/");
    } catch (err: any) {
      console.error("Erro completo:", err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        err.message || 
        "Erro ao fazer login",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Life OS</h1>
          <p className="text-neutral-400 text-sm">
            Faça login com sua conta integrada
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              "Entrar no Life OS"
            )}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-neutral-800" />
            <span className="mx-3 text-xs text-neutral-600">ou</span>
            <div className="flex-1 border-t border-neutral-800" />
          </div>
          <a
            href={`https://filmes.lucasmks.com.br/login?callbackUrl=${encodeURIComponent("https://lifeos.lucasmks.com.br/auth/callback")}&action=register`}
            className="block w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition-colors text-center"
          >
            Criar conta
          </a>
          <a
            href="https://filmes.lucasmks.com.br/reset-password"
            className="block w-full py-2.5 px-4 text-neutral-500 hover:text-neutral-300 text-sm text-center transition-colors rounded-lg hover:bg-neutral-800/50"
          >
            Esqueci minha senha
          </a>
        </div>
      </div>
    </div>
  );
}
