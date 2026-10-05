import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cookieUtils } from "./cookieUtils";

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
      setAuth: (token, userId) => set({ token, userId }),
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
    },
  ),
);
