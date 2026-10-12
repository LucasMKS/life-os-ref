import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { cookieUtils } from "./cookieUtils";
import { extractUserIdFromToken } from "./jwtUtils";

interface AuthState {
  token: string | null;
  userId: string | null;
  setAuth: (token: string, userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      setAuth: (token, userId) => {
        const resolvedUserId =
          userId && userId !== "user" && userId !== "undefined"
            ? userId
            : extractUserIdFromToken(token) || userId;
        set({ token, userId: resolvedUserId });
      },
      logout: () => {
        cookieUtils.clearAll();
        if (typeof window !== "undefined") {
          localStorage.removeItem("lifeos-auth");
          sessionStorage.clear();
        }
        set({ token: null, userId: null });
      },
    }),
    {
      name: "lifeos-auth",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const cookieToken = typeof window !== "undefined" ? Cookies.get("auth_token") : null;
        const activeToken = state.token || cookieToken;
        if (activeToken) {
          if (!state.token) state.token = activeToken;
          if (!state.userId || state.userId === "user" || state.userId === "undefined") {
            const extracted = extractUserIdFromToken(activeToken);
            if (extracted) state.userId = extracted;
          }
        }
      },
    },
  ),
);
