export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function extractUserIdFromToken(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const payload = decodeJwtPayload(token);
    if (!payload) return null;
    if (payload.id != null) return String(payload.id);
    if (payload.userId != null) return String(payload.userId);
    if (payload.sub != null && !String(payload.sub).includes("@")) return String(payload.sub);
    return null;
  } catch {
    return null;
  }
}
