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
  Sparkles,
  Info,
  RotateCcw,
} from "lucide-react";
import { notificationSettingsApi } from "@/lib/api";
import { UserNotificationSettings } from "@/lib/types";
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
      telegramChatId: prev.telegramChatId, // mantém o chatId já cadastrado para comodidade
    }));
    toast.info("Horários e preferências restaurados para o padrão do sistema. Clique em 'Salvar' para aplicar.");
  };

  const updateField = <K extends keyof UserNotificationSettings>(
    key: K,
    val: UserNotificationSettings[K]
  ) => {
    setFormState((prev) => ({ ...prev, [key]: val }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Carregando preferências de notificação...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Barra de Ações do Topo */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-sm">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders size={18} className="text-blue-400" />
            Preferências de Alertas & Schedulers
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Os horários configurados aqui entram em vigor dinamicamente nos próximos ciclos do sistema.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            title="Restaura os horários e configurações originais"
          >
            <RotateCcw size={14} className="text-zinc-400" />
            <span>Voltar ao padrão</span>
          </button>

          <button
            type="button"
            onClick={() => updateMutation.mutate(formState)}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SEÇÃO 1: CONEXÃO COM O TELEGRAM */}
      <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-48 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <TelegramIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Integração com Telegram Bot
                </h3>
                {formState.telegramChatId ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Check size={10} /> Conectado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
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
            activeColor="bg-sky-600"
          />
        </div>

        {formState.telegramEnabled && (
          <div className="pt-3 border-t border-white/5 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Seu Telegram Chat ID
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Ex: 123456789"
                  value={formState.telegramChatId}
                  onChange={(e) => updateField("telegramChatId", e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/50 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={isTestingTelegram || !formState.telegramChatId?.trim()}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 active:bg-sky-500/30 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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

            <div className="p-3 bg-sky-950/20 border border-sky-500/10 rounded-xl text-xs text-zinc-400 flex items-start gap-2.5">
              <Info size={16} className="text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>
                  Para descobrir seu Chat ID: abra o Telegram e envie qualquer mensagem para o bot{" "}
                  <code className="text-sky-300 bg-black/30 px-1 py-0.5 rounded">@userinfobot</code> ou{" "}
                  <code className="text-sky-300 bg-black/30 px-1 py-0.5 rounded">@getmyid_bot</code>.
                </p>
                <p className="text-zinc-500 text-[11px]">
                  Certifique-se de que você já iniciou conversa (clicou em /start) com o bot oficial do LifeOS configurado no backend.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SEÇÃO 2: CATEGORIAS E MÓDULOS DE INTERESSE */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white">
            Categorias & Módulos
          </h3>
          <p className="text-xs text-zinc-400">
            Ative ou silencie os alertas de cada módulo do sistema individualmente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* F1 */}
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-red-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <Flag size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Fórmula 1</p>
                <p className="text-[11px] text-zinc-500">
                  Lembrete de sessões, corridas e Daily Briefing matinal
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
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-emerald-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Trophy size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Esportes & Futebol</p>
                <p className="text-[11px] text-zinc-500">
                  Alerta 15min antes de jogos monitorados e resumo matinal
                </p>
              </div>
            </div>
            <Switch
              checked={formState.sportsEnabled}
              onCheckedChange={(val) => updateField("sportsEnabled", val)}
              activeColor="bg-emerald-600"
            />
          </div>

          {/* Filmes & Séries */}
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-purple-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
                <Film size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Filmes & Séries</p>
                <p className="text-[11px] text-zinc-500">
                  Lançamentos do dia da sua watchlist e episódios novos
                </p>
              </div>
            </div>
            <Switch
              checked={formState.mediaEnabled}
              onCheckedChange={(val) => updateField("mediaEnabled", val)}
              activeColor="bg-purple-600"
            />
          </div>

          {/* Finanças */}
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-amber-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Finanças</p>
                <p className="text-[11px] text-zinc-500">
                  Véspera de faturas, assinaturas e fechamento do mês
                </p>
              </div>
            </div>
            <Switch
              checked={formState.financeEnabled}
              onCheckedChange={(val) => updateField("financeEnabled", val)}
              activeColor="bg-amber-600"
            />
          </div>

          {/* Gaming */}
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-blue-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <Gamepad2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Gaming & Steam</p>
                <p className="text-[11px] text-zinc-500">
                  Novidades de patch notes e atualizações de jogos da biblioteca
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
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-violet-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
                <Radio size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Twitch Lives</p>
                <p className="text-[11px] text-zinc-500">
                  Alerta no momento em que streamers seguidos entram ao vivo
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
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-teal-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Leitura (Nudge)</p>
                <p className="text-[11px] text-zinc-500">
                  Incentivo diário caso algum livro esteja parado há mais de 3 dias
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
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-sky-500/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
                <Sun size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Previsão do Tempo</p>
                <p className="text-[11px] text-zinc-500">
                  Briefing matinal de temperatura e chuvas para o seu dia
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

      {/* SEÇÃO 3: HORÁRIOS DOS BRIEFINGS E LEMBRETES */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Clock size={16} className="text-blue-400" />
            Horários dos Briefings & Rotinas Diárias
          </h3>
          <p className="text-xs text-zinc-400">
            Ajuste a hora exata para receber cada briefing. O agendador dinâmico do LifeOS processa no minuto escolhido (Horário de Brasília).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Briefing F1 */}
          <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag size={15} className="text-red-400" />
                <span className="text-xs font-bold text-zinc-200">Briefing F1</span>
              </div>
              <span className="text-[10px] text-zinc-500">Padrão: 08:00</span>
            </div>
            <input
              type="time"
              value={formState.f1BriefingTime}
              onChange={(e) => updateField("f1BriefingTime", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-red-500/50 [color-scheme:dark]"
            />
          </div>

          {/* Resumo Esportivo */}
          <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={15} className="text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200">Resumo Esportivo</span>
              </div>
              <span className="text-[10px] text-zinc-500">Padrão: 08:00</span>
            </div>
            <input
              type="time"
              value={formState.sportsMorningTime}
              onChange={(e) => updateField("sportsMorningTime", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 [color-scheme:dark]"
            />
          </div>

          {/* Clima Matinal */}
          <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun size={15} className="text-sky-400" />
                <span className="text-xs font-bold text-zinc-200">Clima Matinal</span>
              </div>
              <span className="text-[10px] text-zinc-500">Padrão: 07:00</span>
            </div>
            <input
              type="time"
              value={formState.weatherTime}
              onChange={(e) => updateField("weatherTime", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-sky-500/50 [color-scheme:dark]"
            />
          </div>

          {/* Radar de Mídia */}
          <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film size={15} className="text-purple-400" />
                <span className="text-xs font-bold text-zinc-200">Radar de Mídia</span>
              </div>
              <span className="text-[10px] text-zinc-500">Padrão: 09:00</span>
            </div>
            <input
              type="time"
              value={formState.mediaTime}
              onChange={(e) => updateField("mediaTime", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
            />
          </div>

          {/* Balanço Financeiro */}
          <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={15} className="text-amber-400" />
                <span className="text-xs font-bold text-zinc-200">Avisos Financeiros</span>
              </div>
              <span className="text-[10px] text-zinc-500">Padrão: 09:00</span>
            </div>
            <input
              type="time"
              value={formState.financeTime}
              onChange={(e) => updateField("financeTime", e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500/50 [color-scheme:dark]"
            />
          </div>

          {/* Leitura */}
          <div className="p-3.5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={15} className="text-teal-400" />
                <span className="text-xs font-bold text-zinc-200">Lembrete de Leitura</span>
              </div>
              <span className="text-[10px] text-zinc-500">Padrão: 18:30</span>
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
      <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Moon size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
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
              Notificações entre {formState.quietHoursStart} e {formState.quietHoursEnd} não serão disparadas no Telegram.
            </p>
          </div>
        )}
      </section>

      {/* Barra de Ações Inferior */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
        <button
          type="button"
          onClick={handleResetToDefaults}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all"
        >
          <RotateCcw size={14} />
          <span>Voltar ao padrão</span>
        </button>

        <button
          type="button"
          onClick={() => updateMutation.mutate(formState)}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
