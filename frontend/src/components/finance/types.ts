export const ALLOWED_CATEGORIES = [
  "Entretenimento",
  "Infra & Dev",
  "Serviços Essenciais",
  "Outros",
] as const;

export const ALLOWED_CYCLES = [
  "Mensal",
  "Anual dividida",
  "Anual integral",
] as const;

export const PRESET_COLORS = [
  "#e50914",
  "#1db954",
  "#3b82f6",
  "#a855f7",
  "#eab308",
  "#e4e4e7",
  "#71717a",
] as const;

export type BillingCycle = (typeof ALLOWED_CYCLES)[number] | string;

export interface SubscriptionItem {
  id: string;
  name: string;
  category: string;
  price: number;
  billingCycle: BillingCycle;
  nextPayment: string;
  color: string;
}

export interface SubscriptionPayload {
  id?: string;
  name: string;
  category: string;
  price: number;
  billingCycle: string;
  nextPayment: string;
  color: string;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function formatCurrency(value: unknown): string {
  const num = safeNumber(value, 0);
  const clamped = Math.max(0, Math.min(num, 1_000_000_000));
  return `R$ ${clamped.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function sanitizeHexColor(color: unknown): string {
  if (typeof color === "string" && HEX_COLOR_RE.test(color.trim())) {
    return color.trim();
  }
  return "#71717a";
}

export function parseSafeDate(dateStr: unknown): Date | null {
  if (typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!ISO_DATE_RE.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(dateStr: unknown): string {
  const date = parseSafeDate(dateStr);
  if (!date) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function getDaysUntil(dateStr: unknown): number | null {
  const paymentDate = parseSafeDate(dateStr);
  if (!paymentDate) return null;
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const targetUtc = Date.UTC(
    paymentDate.getUTCFullYear(),
    paymentDate.getUTCMonth(),
    paymentDate.getUTCDate(),
  );
  return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

export function isUrgent(dateStr: unknown): boolean {
  const days = getDaysUntil(dateStr);
  return days !== null && days >= 0 && days <= 3;
}

export function normalizeSubscription(raw: unknown): SubscriptionItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === "string" ? item.id.trim() : String(item.id ?? "");
  if (!id) return null;

  const rawName = typeof item.name === "string" ? item.name.trim() : "";
  const name = rawName.slice(0, 80) || "Assinatura sem nome";

  const rawCategory =
    typeof item.category === "string" ? item.category.trim() : "";
  const category = rawCategory.slice(0, 40) || "Outros";

  const rawPrice = safeNumber(item.price, 0);
  const price = rawPrice > 0 && rawPrice <= 1_000_000 ? rawPrice : 0;

  const billingCycle =
    typeof item.billingCycle === "string" && item.billingCycle.trim()
      ? item.billingCycle.trim()
      : "Mensal";

  const nextPayment =
    typeof item.nextPayment === "string" && ISO_DATE_RE.test(item.nextPayment.trim())
      ? item.nextPayment.trim()
      : "";

  const color = sanitizeHexColor(item.color);

  return {
    id,
    name,
    category,
    price,
    billingCycle,
    nextPayment,
    color,
  };
}
