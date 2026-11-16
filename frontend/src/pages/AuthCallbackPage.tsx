import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { cookieUtils } from "@/lib/cookieUtils";
import { decodeJwtPayload } from "@/lib/jwtUtils";
import { isTokenExpired, sanitizeUrl } from "@/lib/security";
import { Loader2 } from "lucide-react";

/**
 * Validates redirect targets to prevent open-redirect vulnerabilities.
 * Only permits internal relative paths starting with a single `/`.
 */
function getSafeInternalRedirect(rawTarget: string | null): string {
  const sanitized = sanitizeUrl(rawTarget);
  if (
    sanitized &&
    sanitized.startsWith("/") &&
    !sanitized.startsWith("//") &&
    !sanitized.includes("\\")
  ) {
    return sanitized;
  }
  return "/";
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get("token")?.trim();

    if (!token || isTokenExpired(token)) {
      router.replace("/login");
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload || payload.id == null) {
      router.replace("/login");
      return;
    }

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

    const nextPath = getSafeInternalRedirect(
      searchParams.get("redirect") ||
        searchParams.get("next") ||
        searchParams.get("callbackUrl"),
    );

    router.replace(nextPath);
  }, [searchParams, setAuth, router]);

  return (
    <main className="min-h-screen flex items-center justify-center relative bg-[#09090b] text-zinc-100 p-4">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none z-0"
      />
      <div className="relative z-10 bg-[#111113] border border-white/[0.06] rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
        <p className="text-zinc-400 text-xs sm:text-sm font-medium">
          Concluindo login...
        </p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
