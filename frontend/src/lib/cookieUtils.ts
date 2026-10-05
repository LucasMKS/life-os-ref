import Cookies from "js-cookie";

const isLocalhost =
  typeof window !== "undefined"
    ? window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    : import.meta.env.DEV;

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 7,
  path: "/",
  ...(isLocalhost ? {} : { domain: ".lucasmks.com.br" }),
  secure: import.meta.env.PROD,
  sameSite: "Lax" as const,
};

export const cookieUtils = {
  setAuthToken: (token: string) => {
    Cookies.set("auth_token", token, COOKIE_OPTIONS);
  },

  setUserData: (userData: any) => {
    Cookies.set("user_data", JSON.stringify(userData), COOKIE_OPTIONS);
  },

  removeAuthToken: () => {
    Cookies.remove(
      "auth_token",
      isLocalhost ? { path: "/" } : { domain: ".lucasmks.com.br", path: "/" }
    );
  },

  removeUserData: () => {
    Cookies.remove(
      "user_data",
      isLocalhost ? { path: "/" } : { domain: ".lucasmks.com.br", path: "/" }
    );
  },

  clearAll: () => {
    cookieUtils.removeAuthToken();
    cookieUtils.removeUserData();
  },
};
