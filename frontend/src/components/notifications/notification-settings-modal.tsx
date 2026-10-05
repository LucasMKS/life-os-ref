"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Sliders,
  Send,
  Loader2,
  Film,
  Flag,
  Trophy,
  Wallet,
  Gamepad2,
  Radio,
  BookOpen,
  Sun,
  Moon,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { notificationSettingsApi } from "@/lib/api";
import { UserNotificationSettings } from "@/lib/types";
import { toast } from "sonner";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SETTINGS: UserNotificationSettings = {
  userId: "",
  telegramChatId: "",
  telegramEnabled: false,
  mediaEnabled: true,
  gamingEnabled: true,
  twitchEnabled: true,
  f1Enabled: true,
  sportsEnabled: true,
  financeEnabled: true,
  readingEnabled: true,
  weatherEnabled: true,
  mediaTime: "19:00",
  sportsMorningTime: "08:00",
  f1BriefingTime: "09:00",
  financeTime: "08:30",
  readingTime: "20:00",
  weatherTime: "07:00",
  quietHoursEnabled: false,
  quietHoursStart: "23:00",
  quietHoursEnd: "07:00",
};

function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  activeColor = "bg-blue-600",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? activeColor : "bg-white/10"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
    </svg>
  );
}

export function NotificationSettingsModal({
  isOpen,
  onClose,
}: NotificationSettingsModalProps) {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<UserNotificationSettings>(DEFAULT_SETTINGS);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const { data, isLoading } = useQuery<UserNotificationSettings>({
    queryKey: ["notification-settings"],
    queryFn: notificationSettingsApi.getSettings,
    enabled: isOpen,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data) {
      setFormState({
        ...DEFAULT_SETTINGS,
        ...data,
        telegramChatId: data.telegramChatId ?? "",
      });
    }
  }, [data]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const updateMutation = useMutation({
    mutationFn: notificationSettingsApi.updateSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["notification-settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast.success("Preferências de notificação salvas com sucesso!");
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao salvar configurações de notificação.";
      toast.error(msg);
    },
  });

  const handleTestTelegram = async () => {
    const chatIdToTest = formState.telegramChatId?.trim();
    if (!chatIdToTest) {
      toast.error("Informe seu Chat ID do Telegram antes de enviar o teste.");
      return;
    }

    try {
      setIsTestingTelegram(true);
      const res = await notificationSettingsApi.testTelegram(chatIdToTest);
      if (res && res.success !== false) {
        toast.success(res.message || "Mensagem de teste enviada com sucesso no Telegram!");
      } else {
        toast.error(res?.message || "Falha ao enviar mensagem de teste.");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Erro ao testar envio pelo Telegram. Verifique seu Chat ID e bot.";
      toast.error(msg);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const updateField = <K extends keyof UserNotificationSettings>(
    key: K,
    val: UserNotificationSettings[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: val }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 z-10">
        {/* Glow Superior */}
        <div className="absolute top-0 right-1/4 w-80 h-36 bg-blue-600/15 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-80 h-36 bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 relative z-10 bg-black/30 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Configurações de Notificações
              </h2>
              <p className="text-xs text-zinc-400">
                Personalize canais, categorias de interesse, briefings diários e modo não perturbe.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors shrink-0"
            title="Fechar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-7 relative z-10 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm">Carregando preferências...</p>
            </div>
          ) : (
            <>
              {/* SEÇÃO 1: CONEXÃO COM O TELEGRAM */}
              <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 w-48 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                      <TelegramIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-white">
                          Conexão com o Telegram
                        </h3>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          Tempo Real
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Receba notificações instantâneas e resumos diários no seu Telegram.
                      </p>
                    </div>
                  </div>

                  <Switch
                    checked={formState.telegramEnabled}
                    onCheckedChange={(val) => updateField("telegramEnabled", val)}
                    activeColor="bg-sky-500"
                  />
                </div>

                {/* Input do Chat ID e Teste */}
                <div className="pt-2 border-t border-white/5 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Chat ID do Telegram
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        value={formState.telegramChatId || ""}
                        onChange={(e) => updateField("telegramChatId", e.target.value)}
                        placeholder="Ex: 123456789"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        disabled={isTestingTelegram || !formState.telegramChatId?.trim()}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                      >
                        {isTestingTelegram ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>Testar Envio</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dica de como obter o Chat ID */}
                  <div className="bg-sky-500/[0.04] border border-sky-500/15 rounded-xl p-3 flex items-start gap-2.5 text-xs text-zinc-400">
                    <Info size={15} className="text-sky-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold text-zinc-300 block">
                        Como descobrir seu Chat ID:
                      </span>
                      <ol className="list-decimal list-inside space-y-0.5 text-zinc-400 text-[11px] leading-relaxed">
                        <li>
                          Inicie uma conversa com o bot do LifeOS no Telegram (ou{" "}
                          <span className="text-sky-400 font-mono">@userinfobot</span>).
                        </li>
                        <li>
                          Envie a mensagem <code className="bg-white/10 px-1 py-0.5 rounded text-sky-300">/start</code> ou <code className="bg-white/10 px-1 py-0.5 rounded text-sky-300">/id</code>.
                        </li>
                        <li>Copie o código numérico retornado e cole no campo acima.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </section>

              {/* SEÇÃO 2: CATEGORIAS E TOGGLES */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Categorias de Notificações
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Escolha quais módulos têm permissão para gerar notificações e alertas.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-zinc-500">
                    {
                      [
                        formState.mediaEnabled,
                        formState.f1Enabled,
                        formState.sportsEnabled,
                        formState.financeEnabled,
                        formState.gamingEnabled,
                        formState.twitchEnabled,
                        formState.readingEnabled,
                        formState.weatherEnabled,
                      ].filter(Boolean).length
                    }{" "}
                    / 8 ativas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Filmes & Séries */}
                  <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-purple-500/30 transition-all group">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                        <Film size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">Filmes & Séries</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                            Mídia
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          Novos episódios, lançamentos e estreias
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formState.mediaEnabled}
                      onCheckedChange={(val) => updateField("mediaEnabled", val)}
                      activeColor="bg-purple-600"
                    />
                  </div>

                  {/* Fórmula 1 */}
                  <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-red-500/30 transition-all group">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                        <Flag size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">Fórmula 1</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                            F1
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          Alertas 15 min antes das sessões e notícias
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formState.f1Enabled}
                      onCheckedChange={(val) => updateField("f1Enabled", val)}
                      activeColor="bg-red-600"
                    />
                  </div>

                  {/* Esportes */}
                  <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                        <Trophy size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">Esportes</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            Futebol & NBA
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          Partidas ao vivo, gols e resumo matinal
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formState.sportsEnabled}
                      onCheckedChange={(val) => updateField("sportsEnabled", val)}
                      activeColor="bg-emerald-600"
                    />
                  </div>

                  {/* Finanças */}
                  <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-amber-500/30 transition-all group">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                        <Wallet size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">Finanças</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                            Contas & Cartão
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          Vencimento de assinaturas e balanço
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formState.financeEnabled}
                      onCheckedChange={(val) => updateField("financeEnabled", val)}
                      activeColor="bg-amber-600"
                    />
                  </div>

                  {/* Games & Updates */}
                  <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-500/30 transition-all group">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                        <Gamepad2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">Games & Updates</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                            Steam & Riot
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          Notícias de jogos rastreados e patches
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formState.gamingEnabled}
                      onCheckedChange={(val) => updateField("gamingEnabled", val)}
                      activeColor="bg-blue-600"
                    />
                  </div>

                  {/* Twitch */}
                  <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-violet-500/30 transition-all group">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 shrink-0">
                        <Radio size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">Twitch</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">
                            Lives
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          Streamers e canais favoritos ao vivo
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formState.twitchEnabled}
                      onCheckedChange={(val) => updateField("twitchEnabled", val)}
                      activeColor="bg-violet-600"
                    />
                  </div>

                  {/* Leitura */}
                  <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-teal-500/30 transition-all group">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
                        <BookOpen size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">Leitura</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                            Livros
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          Lembretes para manter o hábito e metas
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formState.readingEnabled}
                      onCheckedChange={(val) => updateField("readingEnabled", val)}
                      activeColor="bg-teal-600"
                    />
                  </div>

                  {/* Clima */}
                  <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between gap-3 hover:border-sky-500/30 transition-all group">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
                        <Sun size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">Clima & Tempo</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                            Meteorologia
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                          Previsão matinal de chuva e alertas
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formState.weatherEnabled}
                      onCheckedChange={(val) => updateField("weatherEnabled", val)}
                      activeColor="bg-sky-600"
                    />
                  </div>
                </div>
              </section>

              {/* SEÇÃO 3: HORÁRIOS DOS BRIEFINGS */}
              <section className="space-y-3">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Horários dos Briefings Diários
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Programe a hora ideal para receber o resumo consolidado de cada área.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Clima */}
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Sun size={15} className="text-sky-400" />
                      <span className="text-xs font-bold text-zinc-200">Clima Matinal</span>
                    </div>
                    <input
                      type="time"
                      value={formState.weatherTime}
                      onChange={(e) => updateField("weatherTime", e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-sky-500/50 [color-scheme:dark]"
                    />
                  </div>

                  {/* Esportes */}
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Trophy size={15} className="text-emerald-400" />
                      <span className="text-xs font-bold text-zinc-200">Resumo Esportivo</span>
                    </div>
                    <input
                      type="time"
                      value={formState.sportsMorningTime}
                      onChange={(e) => updateField("sportsMorningTime", e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 [color-scheme:dark]"
                    />
                  </div>

                  {/* Finanças */}
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Wallet size={15} className="text-amber-400" />
                      <span className="text-xs font-bold text-zinc-200">Balanço Financeiro</span>
                    </div>
                    <input
                      type="time"
                      value={formState.financeTime}
                      onChange={(e) => updateField("financeTime", e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500/50 [color-scheme:dark]"
                    />
                  </div>

                  {/* Fórmula 1 */}
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Flag size={15} className="text-red-400" />
                      <span className="text-xs font-bold text-zinc-200">Briefing F1</span>
                    </div>
                    <input
                      type="time"
                      value={formState.f1BriefingTime}
                      onChange={(e) => updateField("f1BriefingTime", e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]"
                    />
                  </div>

                  {/* Filmes & Séries */}
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Film size={15} className="text-purple-400" />
                      <span className="text-xs font-bold text-zinc-200">Filmes & Séries</span>
                    </div>
                    <input
                      type="time"
                      value={formState.mediaTime}
                      onChange={(e) => updateField("mediaTime", e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                    />
                  </div>

                  {/* Leitura */}
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen size={15} className="text-teal-400" />
                      <span className="text-xs font-bold text-zinc-200">Lembrete de Leitura</span>
                    </div>
                    <input
                      type="time"
                      value={formState.readingTime}
                      onChange={(e) => updateField("readingTime", e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-teal-500/50 [color-scheme:dark]"
                    />
                  </div>
                </div>
              </section>

              {/* SEÇÃO 4: MODO NÃO PERTURBE (SILÊNCIO) */}
              <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <Moon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        Modo Não Perturbe (Silêncio)
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Silencia notificações e avisos sonoros para garantir seu descanso ininterrupto.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formState.quietHoursEnabled}
                    onCheckedChange={(val) => updateField("quietHoursEnabled", val)}
                    activeColor="bg-indigo-600"
                  />
                </div>

                {formState.quietHoursEnabled && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Início do Silêncio
                        </label>
                        <input
                          type="time"
                          value={formState.quietHoursStart}
                          onChange={(e) => updateField("quietHoursStart", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                          Término do Silêncio
                        </label>
                        <input
                          type="time"
                          value={formState.quietHoursEnd}
                          onChange={(e) => updateField("quietHoursEnd", e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
                      <Clock size={12} className="shrink-0" />
                      Notificações geradas entre {formState.quietHoursStart} e {formState.quietHoursEnd} serão entregues silenciosamente.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-end gap-3 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => updateMutation.mutate(formState)}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Salvar Preferências</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
