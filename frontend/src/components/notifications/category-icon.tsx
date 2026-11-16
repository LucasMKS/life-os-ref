import {
  BellRing,
  BookOpen,
  CloudSun,
  Film,
  Flag,
  Gamepad2,
  Sparkles,
  Trophy,
  Tv,
  Wallet,
} from "lucide-react";

interface CategoryMeta {
  label: string;
  iconClass: string;
  Icon: typeof BellRing;
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
  SPORTS: { label: "Esportes", iconClass: "text-emerald-400/80", Icon: Trophy },
  F1: { label: "F1", iconClass: "text-rose-400/80", Icon: Flag },
  FINANCE: { label: "Finanças", iconClass: "text-amber-400/80", Icon: Wallet },
  GAMING: { label: "Gaming", iconClass: "text-sky-400/80", Icon: Gamepad2 },
  READING: { label: "Leitura", iconClass: "text-teal-400/80", Icon: BookOpen },
  MEDIA: { label: "Mídia", iconClass: "text-violet-400/80", Icon: Film },
  TWITCH: { label: "Twitch", iconClass: "text-purple-400/80", Icon: Tv },
  WEATHER: { label: "Clima", iconClass: "text-cyan-400/80", Icon: CloudSun },
  CUSTOM: { label: "Personalizada", iconClass: "text-zinc-200", Icon: Sparkles },
  SYSTEM: { label: "Sistema", iconClass: "text-zinc-400", Icon: BellRing },
};

export function getCategoryLabel(type?: string | null): string {
  if (!type) return "Sistema";
  return CATEGORY_MAP[type]?.label ?? type;
}

export function NotificationCategoryIcon({
  type,
  size = 15,
}: {
  type?: string | null;
  size?: number;
}) {
  const meta = (type && CATEGORY_MAP[type]) || CATEGORY_MAP.SYSTEM;
  const Icon = meta.Icon;

  return (
    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
      <Icon size={size} className={meta.iconClass} />
    </div>
  );
}
