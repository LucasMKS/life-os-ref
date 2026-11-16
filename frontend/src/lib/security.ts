import { decodeJwtPayload } from "./jwtUtils";

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Validates and sanitizes an external or internal URL.
 * Rejects `javascript:`, `data:`, `vbscript:` and malformed schemes.
 */
export function sanitizeUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Allow safe relative paths (not protocol-relative `//`)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (SAFE_URL_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks whether a JWT token is malformed or past its `exp` timestamp.
 */
export function isTokenExpired(token: string | null | undefined, skewSeconds = 30): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  if (typeof payload.exp !== "number") return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + skewSeconds;
}

const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "BR", "A", "CODE", "SPAN"]);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function serializeSafeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const el = node as Element;
  const tag = el.tagName.toUpperCase();
  const childrenHtml = Array.from(el.childNodes).map(serializeSafeNode).join("");

  if (!ALLOWED_TAGS.has(tag)) {
    return childrenHtml;
  }

  if (tag === "BR") {
    return "<br />";
  }

  if (tag === "A") {
    const safeHref = sanitizeUrl(el.getAttribute("href"));
    if (!safeHref) return childrenHtml;
    return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${childrenHtml}</a>`;
  }

  const lower = tag.toLowerCase();
  return `<${lower}>${childrenHtml}</${lower}>`;
}

/**
 * Sanitizes notification HTML strings to prevent XSS.
 * Only permits safe inline formatting (`b`, `strong`, `i`, `em`, `br`, `code`, `span`)
 * and `http(s)` links with `rel="noopener noreferrer"`.
 */
export function sanitizeNotificationHtml(raw?: string | null): string {
  if (!raw) return "";
  const withBreaks = raw.replace(/\n/g, "<br />");

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return escapeHtml(raw).replace(/\n/g, "<br />");
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(withBreaks, "text/html");
    return Array.from(doc.body.childNodes).map(serializeSafeNode).join("");
  } catch {
    return escapeHtml(raw).replace(/\n/g, "<br />");
  }
}
