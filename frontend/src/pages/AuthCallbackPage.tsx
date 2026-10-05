import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { cookieUtils } from "@/lib/cookieUtils";
import { Loader2 } from "lucide-react";

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      console.error("[Callback] Token não encontrado na URL");
      router.replace("/login");
      return;
    }

    console.log("[Callback] Token recebido (primeiros 50c):", token.substring(0, 50) + "...");

    const payload = decodeJwtPayload(token);
    if (!payload || !payload.id) {
      console.error("[Callback] Falha ao decodificar JWT ou ID não encontrado");
      router.replace("/login");
      return;
    }

    console.log("[Callback] JWT decodificado:", { id: payload.id, email: payload.sub });

    const userId = String(payload.id);
    const user = {
      id: payload.id,
      name: payload.name,
      email: payload.sub,
      nickname: payload.nickname,
      role: payload.role,
    };

    cookieUtils.setAuthToken(token);
    cookieUtils.setUserData(user);
    setAuth(token, userId);

    console.log("[Callback] Sessão salva com sucesso. Redirecionando para /");
    router.replace("/");
  }, [searchParams, setAuth, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      <p className="text-neutral-500 text-sm">Concluindo login...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
