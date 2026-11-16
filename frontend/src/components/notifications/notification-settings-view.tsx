"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
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
  Info,
  RotateCcw,
} from "lucide-react";
import { notificationSettingsApi } from "@/lib/api";
import { UserNotificationSettings } from "@/lib/types";
import { SurfacePanel } from "@/components/ui/page-shell";
import { toast } from "sonner";

export const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  userId: "",
  telegramChatId: "",
  telegramEnabled: true,
  mediaEnabled: true,
  gamingEnabled: true,
  twitchEnabled: true,
  f1Enabled: true,
  sportsEnabled: true,
  financeEnabled: true,
  readingEnabled: true,
  weatherEnabled: true,
  mediaTime: "09:00",
  sportsMorningTime: "08:00",
  f1BriefingTime: "08:00",
  financeTime: "09:00",
  readingTime: "18:30",
  weatherTime: "07:00",
  quietHoursEnabled: false,
  quietHoursStart: "23:00",
  quietHoursEnd: "07:00",
};

type BooleanSettingKey =
  | "f1Enabled"
  | "sportsEnabled"
  | "mediaEnabled"
  | "financeEnabled"
  | "gamingEnabled"
  | "twitchEnabled"
  | "readingEnabled"
  | "weatherEnabled";

type TimeSettingKey =
  | "f1BriefingTime"
  | "sportsMorningTime"
  | "weatherTime"
  | "mediaTime"
  | "financeTime"
  | "readingTime";

const MODULE_TOGGLES: {
  key: BooleanSettingKey;
  title: string;
  description: string;
  Icon: typeof Flag;
  iconClass: string;
}[] = [
  {
    key: "f1Enabled",
    title: "Fórmula 1",
    description: "Lembrete de sessões, corridas e Daily Briefing matinal",
    Icon: Flag,
    iconClass: "text-rose-400/80",
  },
  {
    key: "sportsEnabled",
    title: "Esportes & Futebol",
    description: "Alerta 15min antes de jogos monitorados e resumo matinal",
    Icon: Trophy,
    iconClass: "text-emerald-400/80",
  },
  {
    key: "mediaEnabled",
    title: "Filmes & Séries",
    description: "Lançamentos do dia da sua watchlist e episódios novos",
    Icon: Film,
    iconClass: "text-violet-400/80",
  },
  {
    key: "financeEnabled",
    title: "Finanças",
    description: "Véspera de faturas, assinaturas e fechamento do mês",
    Icon: Wallet,
    iconClass: "text-amber-400/80",
  },
  {
    key: "gamingEnabled",
    title: "Gaming & Steam",
    description: "Novidades de patch notes e atualizações de jogos da biblioteca",
    Icon: Gamepad2,
    iconClass: "text-sky-400/80",
  },
  {
    key: "twitchEnabled",
    title: "Twitch Lives",
    description: "Alerta no momento em que streamers seguidos entram ao vivo",
    Icon: Radio,
    iconClass: "text-purple-400/80",
  },
  {
    key: "readingEnabled",
    title: "Leitura (Nudge)",
    description: "Incentivo diário caso algum livro esteja parado há mais de 3 dias",
    Icon: BookOpen,
    iconClass: "text-teal-400/80",
  },
  {
    key: "weatherEnabled",
    title: "Previsão do Tempo",
    description: "Briefing matinal de temperatura e chuvas para o seu dia",
    Icon: Sun,
    iconClass: "text-cyan-400/80",
  },
];

const SCHEDULE_FIELDS: {
  key: TimeSettingKey;
  label: string;
  defaultTime: string;
  Icon: typeof Flag;
  iconClass: string;
}[] = [
  { key: "f1BriefingTime", label: "Briefing F1", defaultTime: "08:00", Icon: Flag, iconClass: "text-rose-400/80" },
  { key: "sportsMorningTime", label: "Resumo Esportivo", defaultTime: "08:00", Icon: Trophy, iconClass: "text-emerald-400/80" },
  { key: "weatherTime", label: "Clima Matinal", defaultTime: "07:00", Icon: Sun, iconClass: "text-cyan-400/80" },
  { key: "mediaTime", label: "Radar de Mídia", defaultTime: "09:00", Icon: Film, iconClass: "text-violet-400/80" },
  { key: "financeTime", label: "Avisos Financeiros", defaultTime: "09:00", Icon: Wallet, iconClass: "text-amber-400/80" },
  { key: "readingTime", label: "Lembrete de Leitura", defaultTime: "18:30", Icon: BookOpen, iconClass: "text-teal-400/80" },
];

function Switch({
  checked,
  onCheckedChange,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? "bg-emerald-500" : "bg-white/10"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
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

export function NotificationSettingsView() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<UserNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const { data, isLoading } = useQuery<UserNotificationSettings>({
    queryKey: ["notification-settings"],
    queryFn: notificationSettingsApi.getSettings,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (data) {
      setFormState({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...data,
        telegramChatId: data.telegramChatId ?? "",
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: notificationSettingsApi.updateSettings,
    onSuccess: (updated) => {
      queryClient.setQueryData(["notification-settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
      toast.success("Preferências de notificação e horários salvos com sucesso!");
    },
    onError: (err: unknown) => {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
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
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        "Erro ao testar envio pelo Telegram. Verifique seu Chat ID e o Bot.";
      toast.error(msg);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleResetToDefaults = () => {
    setFormState((prev) => ({
      ...DEFAULT_NOTIFICATION_SETTINGS,
      userId: prev.userId,
      telegramChatId: prev.telegramChatId,
    }));
    toast.info(
      "Horários e preferências restaurados para o padrão do sistema. Clique em 'Salvar' para aplicar."
    );
  };

  const updateField = <K extends keyof UserNotificationSettings>(
    key: K,
    val: UserNotificationSettings[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: val }));
  };

  if (isLoading) {
    return (
      <SurfacePanel>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          <p className="text-xs sm:text-sm">Carregando preferências de notificação...</p>
        </div>
      </SurfacePanel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de Ações do Topo */}
      <SurfacePanel>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sliders size={16} className="text-zinc-400" />
              <span>Preferências de Alertas & Schedulers</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Os horários configurados aqui entram em vigor dinamicamente nos próximos ciclos do sistema.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] rounded-xl transition-colors"
              title="Restaura os horários e configurações originais"
            >
              <RotateCcw size={13} className="text-zinc-400" />
              <span>Voltar ao padrão</span>
            </button>

            <button
              type="button"
              onClick={() => updateMutation.mutate(formState)}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold bg-zinc-100 text-zinc-950 hover:bg-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </SurfacePanel>

      {/* SEÇÃO 1: CONEXÃO COM O TELEGRAM */}
      <SurfacePanel>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-200 shrink-0">
                <TelegramIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    Integração com Telegram Bot
                  </h3>
                  {formState.telegramChatId ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Check size={10} /> Conectado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                      <AlertCircle size={10} /> Não Configurado
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Receba alertas instantâneos, briefings matinais e notificações direto no seu Telegram.
                </p>
              </div>
            </div>
            <Switch
              checked={formState.telegramEnabled}
              onCheckedChange={(val) => updateField("telegramEnabled", val)}
            />
          </div>

          {formState.telegramEnabled && (
            <div className="pt-3 border-t border-white/[0.06] space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Seu Telegram Chat ID
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 123456789"
                    value={formState.telegramChatId}
                    onChange={(e) => updateField("telegramChatId", e.target.value)}
                    className="flex-1 bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/25 font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram || !formState.telegramChatId?.trim()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] rounded-xl text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {isTestingTelegram ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Testar Conexão</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#09090b] border border-white/[0.06] rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
                <Info size={15} className="text-zinc-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>
                    Para descobrir seu Chat ID: abra o Telegram e envie qualquer mensagem para o bot{" "}
                    <code className="text-zinc-200 bg-white/[0.06] px-1.5 py-0.5 rounded">@userinfobot</code> ou{" "}
                    <code className="text-zinc-200 bg-white/[0.06] px-1.5 py-0.5 rounded">@getmyid_bot</code>.
                  </p>
                  <p className="text-zinc-500 text-[11px]">
                    Certifique-se de que você já iniciou conversa (clicou em /start) com o bot oficial do LifeOS configurado no backend.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </SurfacePanel>

      {/* SEÇÃO 2: CATEGORIAS E MÓDULOS DE INTERESSE */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-white">
            Categorias & Módulos
          </h3>
          <p className="text-xs text-zinc-400">
            Ative ou silencie os alertas de cada módulo do sistema individualmente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULE_TOGGLES.map(({ key, title, description, Icon, iconClass }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 p-3.5 bg-[#111113] border border-white/[0.06] rounded-2xl hover:border-white/[0.12] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Icon size={17} className={iconClass} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{title}</p>
                  <p className="text-[11px] text-zinc-500 leading-snug">{description}</p>
                </div>
              </div>
              <Switch
                checked={formState[key]}
                onCheckedChange={(val) => updateField(key, val)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 3: HORÁRIOS DOS BRIEFINGS E LEMBRETES */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
            <Clock size={15} className="text-zinc-400" />
            <span>Horários dos Briefings & Rotinas Diárias</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Ajuste a hora exata para receber cada briefing. O agendador dinâmico do LifeOS processa no minuto escolhido (Horário de Brasília).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {SCHEDULE_FIELDS.map(({ key, label, defaultTime, Icon, iconClass }) => (
            <div
              key={key}
              className="p-3.5 bg-[#111113] border border-white/[0.06] rounded-2xl space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={14} className={`${iconClass} shrink-0`} />
                  <span className="text-xs font-medium text-zinc-200 truncate">{label}</span>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0 tabular-nums">
                  Padrão: {defaultTime}
                </span>
              </div>
              <input
                type="time"
                value={formState[key]}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-white/25 [color-scheme:dark] transition-colors"
              />
            </div>
          ))}
        </div>
      </section>

      {/* SEÇÃO 4: MODO NÃO PERTURBE (SILÊNCIO) */}
      <SurfacePanel>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-300 shrink-0">
                <Moon size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  Modo Não Perturbe (Horário de Silêncio)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Silencia avisos sonoros e mensagens durante seu horário de descanso.
                </p>
              </div>
            </div>
            <Switch
              checked={formState.quietHoursEnabled}
              onCheckedChange={(val) => updateField("quietHoursEnabled", val)}
            />
          </div>

          {formState.quietHoursEnabled && (
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Início do Silêncio
                  </label>
                  <input
                    type="time"
                    value={formState.quietHoursStart}
                    onChange={(e) => updateField("quietHoursStart", e.target.value)}
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white/25 [color-scheme:dark] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Término do Silêncio
                  </label>
                  <input
                    type="time"
                    value={formState.quietHoursEnd}
                    onChange={(e) => updateField("quietHoursEnd", e.target.value)}
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-white/25 [color-scheme:dark] transition-colors"
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2.5 flex items-center gap-1.5">
                <Clock size={12} className="shrink-0" />
                <span>
                  Notificações entre {formState.quietHoursStart} e {formState.quietHoursEnd} não serão disparadas no Telegram.
                </span>
              </p>
            </div>
          )}
        </div>
      </SurfacePanel>

      {/* Barra de Ações Inferior */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.06] flex-wrap">
        <button
          type="button"
          onClick={handleResetToDefaults}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] rounded-xl transition-colors"
        >
          <RotateCcw size={14} className="text-zinc-400" />
          <span>Voltar ao padrão</span>
        </button>

        <button
          type="button"
          onClick={() => updateMutation.mutate(formState)}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold bg-zinc-100 text-zinc-950 hover:bg-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Check size={15} />
              <span>Salvar Preferências</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
