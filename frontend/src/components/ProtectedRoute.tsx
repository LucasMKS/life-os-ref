"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { extractUserIdFromToken } from "@/lib/jwtUtils";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, userId, setAuth, logout } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const cookieToken = Cookies.get("auth_token");

    if (token && !cookieToken) {
      logout();
      const isPublicPath = pathname === "/login" || pathname === "/auth/callback";
      if (!isPublicPath) router.replace("/login");
      return;
    }

    const isPublicPath = pathname === "/login" || pathname === "/auth/callback";

    if (!cookieToken && !isPublicPath) {
      router.replace("/login");
      return;
    }

    if (cookieToken && (!token || !userId || userId === "user" || userId === "undefined")) {
      const extracted = extractUserIdFromToken(cookieToken);
      if (extracted) {
        setAuth(cookieToken, extracted);
      }
    }

    setTimeout(() => setIsVerifying(false), 0);
  }, [token, userId, pathname, router, logout, setAuth]);

  if (isVerifying && pathname !== "/login" && pathname !== "/auth/callback") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
}
