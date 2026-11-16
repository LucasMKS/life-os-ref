"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlarmClock,
  Plus,
  Clock,
  Calendar,
  Pencil,
  Trash2,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  BellRing,
  CalendarDays,
} from "lucide-react";
import { customNotificationApi } from "@/lib/api";
import { CustomNotification, CustomNotificationRequest, RecurrenceType } from "@/lib/types";
import { EmptyState, SurfacePanel } from "@/components/ui/page-shell";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { key: "MONDAY", label: "Seg", full: "Segunda-feira" },
  { key: "TUESDAY", label: "Ter", full: "Terça-feira" },
  { key: "WEDNESDAY", label: "Qua", full: "Quarta-feira" },
  { key: "THURSDAY", label: "Qui", full: "Quinta-feira" },
  { key: "FRIDAY", label: "Sex", full: "Sexta-feira" },
  { key: "SATURDAY", label: "Sáb", full: "Sábado" },
  { key: "SUNDAY", label: "Dom", full: "Domingo" },
];

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

function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  activeColor = "bg-emerald-500",
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

const formatRecurrence = (n: CustomNotification) => {
  switch (n.recurrence) {
    case "DAILY":
      return "Todos os dias";
    case "WEEKDAYS":
      return "Dias úteis (Seg a Sex)";
    case "WEEKENDS":
      return "Finais de semana (Sáb e Dom)";
    case "SPECIFIC_DAYS":
      if (!n.daysOfWeek) return "Dias específicos";
      const days = n.daysOfWeek
        .split(",")
        .map((d) => DAYS_OF_WEEK.find((item) => item.key === d.trim())?.label || d.trim())
        .join(", ");
      return `Dias: ${days}`;
    case "ONCE":
      if (!n.specificDate) return "Uma única vez";
      const [year, month, day] = n.specificDate.split("-");
      return `Em ${day}/${month}/${year}`;
    default:
      return "Diário";
  }
};

interface FormState {
  title: string;
  description: string;
  time: string;
  recurrence: RecurrenceType;
  selectedDays: string[];
  specificDate: string;
  sendTelegram: boolean;
  enabled: boolean;
}

const DEFAULT_FORM: FormState = {
  title: "",
  description: "",
  time: "09:00",
  recurrence: "DAILY",
  selectedDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  specificDate: new Date().toISOString().split("T")[0],
  sendTelegram: true,
  enabled: true,
};

export function CustomNotificationsView() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const { data: reminders = [], isLoading } = useQuery<CustomNotification[]>({
    queryKey: ["custom-notifications"],
    queryFn: customNotificationApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: customNotificationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-notifications"] });
      toast.success("Lembrete personalizado criado com sucesso!");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erro ao criar lembrete");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomNotificationRequest> }) =>
      customNotificationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-notifications"] });
      toast.success("Lembrete atualizado!");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erro ao atualizar lembrete");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: customNotificationApi.toggleEnabled,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["custom-notifications"] });
      toast.success(
        updated.enabled
          ? `Lembrete "${updated.title}" ativado`
          : `Lembrete "${updated.title}" pausado`
      );
    },
    onError: () => toast.error("Erro ao alterar status"),
  });

  const deleteMutation = useMutation({
    mutationFn: customNotificationApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-notifications"] });
      toast.success("Lembrete excluído com sucesso");
    },
    onError: () => toast.error("Erro ao excluir lembrete"),
  });

  const testMutation = useMutation({
    mutationFn: customNotificationApi.testTrigger,
    onMutate: (id) => setTestingId(id),
    onSettled: () => setTestingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-recent"] });
      toast.success("Notificação de teste disparada! Verifique o app e seu Telegram.");
    },
    onError: () => toast.error("Falha ao testar disparo"),
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (reminder: CustomNotification) => {
    setEditingId(reminder.id);
    setForm({
      title: reminder.title,
      description: reminder.description || "",
      time: reminder.time,
      recurrence: reminder.recurrence,
      selectedDays: reminder.daysOfWeek ? reminder.daysOfWeek.split(",").map((s) => s.trim()) : [],
      specificDate: reminder.specificDate || new Date().toISOString().split("T")[0],
      sendTelegram: reminder.sendTelegram,
      enabled: reminder.enabled,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Informe um título para o lembrete.");
      return;
    }
    if (!form.time) {
      toast.error("Informe o horário do lembrete.");
      return;
    }

    if (form.recurrence === "SPECIFIC_DAYS" && form.selectedDays.length === 0) {
      toast.error("Selecione pelo menos um dia da semana.");
      return;
    }

    const payload: CustomNotificationRequest = {
      title: form.title.trim(),
      description: form.description.trim() ? form.description.trim() : undefined,
      time: form.time,
      recurrence: form.recurrence,
      daysOfWeek:
        form.recurrence === "SPECIFIC_DAYS" ? form.selectedDays.join(",") : undefined,
      specificDate: form.recurrence === "ONCE" ? form.specificDate : undefined,
      sendTelegram: form.sendTelegram,
      enabled: form.enabled,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const toggleDay = (dayKey: string) => {
    setForm((prev) => {
      const exists = prev.selectedDays.includes(dayKey);
      return {
        ...prev,
        selectedDays: exists
          ? prev.selectedDays.filter((d) => d !== dayKey)
          : [...prev.selectedDays, dayKey],
      };
    });
  };

  const activeCount = reminders.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Call to Action */}
      <SurfacePanel>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.06] text-zinc-300">
                <AlarmClock size={16} />
              </span>
              <h2 className="text-base font-semibold text-white">Lembretes Personalizados</h2>
              {reminders.length > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tabular-nums">
                  {activeCount} {activeCount === 1 ? "ativo" : "ativos"}
                </span>
              )}
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xl">
              Crie notificações com horários exatos para rotinas diárias, remédios de pets, tarefas e lembretes com envio integrado no Telegram.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>Novo Lembrete</span>
          </button>
        </div>
      </SurfacePanel>

      {/* Lista de Lembretes */}
      {isLoading ? (
        <SurfacePanel>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        </SurfacePanel>
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={<AlarmClock size={20} />}
          title="Nenhum lembrete configurado"
          description='Você ainda não criou nenhum lembrete personalizado. Crie um agora, por exemplo: "Dar remédio à cachorra às 09:00".'
          action={
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Criar primeiro lembrete</span>
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`p-5 rounded-2xl border bg-[#111113] transition-colors flex flex-col justify-between ${
                reminder.enabled
                  ? "border-white/[0.06] hover:border-white/[0.12]"
                  : "border-white/[0.04] opacity-60"
              }`}
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/[0.08] text-zinc-100 flex items-center gap-1.5 font-semibold text-xs tabular-nums">
                      <Clock size={13} className="text-zinc-400" />
                      <span>{reminder.time}</span>
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border ${
                        reminder.enabled
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-white/[0.04] border-white/[0.06] text-zinc-400"
                      }`}
                    >
                      {reminder.enabled ? "Ativo" : "Pausado"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reminder.enabled}
                      onCheckedChange={() => toggleMutation.mutate(reminder.id)}
                      disabled={toggleMutation.isPending}
                      activeColor="bg-emerald-500"
                    />
                  </div>
                </div>

                {/* Título & Descrição */}
                <h3 className="text-sm sm:text-base font-semibold text-white mb-1 leading-snug">
                  {reminder.title}
                </h3>
                {reminder.description && (
                  <p className="text-zinc-400 text-xs mb-3 leading-relaxed whitespace-pre-line">
                    {reminder.description}
                  </p>
                )}

                {/* Metadados / Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mb-4">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <Calendar size={12} className="text-zinc-500" />
                    <span>{formatRecurrence(reminder)}</span>
                  </div>

                  {reminder.sendTelegram ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                      <TelegramIcon className="w-3.5 h-3.5 text-zinc-300" />
                      <span>Telegram ativo</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-zinc-500">
                      <BellRing size={12} />
                      <span>Apenas no App</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé com Ações */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500">
                  {reminder.lastTriggeredAt
                    ? `Disparado: ${new Date(reminder.lastTriggeredAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Aguardando primeiro disparo"}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => testMutation.mutate(reminder.id)}
                    disabled={testMutation.isPending && testingId === reminder.id}
                    title="Disparar notificação de teste agora"
                    aria-label="Testar lembrete"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    {testMutation.isPending && testingId === reminder.id ? (
                      <Loader2 size={15} className="animate-spin text-zinc-300" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(reminder)}
                    title="Editar lembrete"
                    aria-label="Editar lembrete"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir o lembrete "${reminder.title}"?`)) {
                        deleteMutation.mutate(reminder.id);
                      }
                    }}
                    title="Excluir lembrete"
                    aria-label="Excluir lembrete"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-lg overflow-hidden">
            {/* Header Modal */}
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.06] text-zinc-300">
                  <AlarmClock size={17} />
                </span>
                <h3 className="text-base font-semibold text-white">
                  {editingId ? "Editar Lembrete" : "Novo Lembrete Personalizado"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fechar modal"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Título do Lembrete *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dar remédio para a cachorra, Tomar creatina, Regar plantas..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090b] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/25 transition-colors placeholder:text-zinc-600"
                />
              </div>

              {/* Descrição / Notas */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Instruções ou Detalhes (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: 2 gotas no pote de ração ou 1 comprimido pós-refeição"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#09090b] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/25 transition-colors placeholder:text-zinc-600 resize-none"
                />
              </div>

              {/* Horário & Recorrência */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Horário de Disparo *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#09090b] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/25 transition-colors [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Recorrência
                  </label>
                  <select
                    value={form.recurrence}
                    onChange={(e) =>
                      setForm({ ...form, recurrence: e.target.value as RecurrenceType })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#09090b] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/25 transition-colors"
                  >
                    <option value="DAILY">Todos os dias</option>
                    <option value="WEEKDAYS">Dias úteis (Seg a Sex)</option>
                    <option value="WEEKENDS">Finais de semana (Sáb e Dom)</option>
                    <option value="SPECIFIC_DAYS">Dias específicos da semana</option>
                    <option value="ONCE">Apenas uma vez (data única)</option>
                  </select>
                </div>
              </div>

              {/* Seletor de Dias Específicos */}
              {form.recurrence === "SPECIFIC_DAYS" && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Dias da Semana
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = form.selectedDays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleDay(day.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                            isSelected
                              ? "bg-white/[0.1] text-white border-white/20"
                              : "bg-[#09090b] text-zinc-400 border-white/[0.06] hover:text-white"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seletor de Data Única */}
              {form.recurrence === "ONCE" && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Data do Disparo
                  </label>
                  <input
                    type="date"
                    required
                    value={form.specificDate}
                    onChange={(e) => setForm({ ...form, specificDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#09090b] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-white/25 transition-colors [color-scheme:dark]"
                  />
                </div>
              )}

              {/* Switches de Envio Telegram & Ativação */}
              <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#09090b] border border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-300">
                      <TelegramIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Enviar no Telegram</p>
                      <p className="text-xs text-zinc-500">
                        Receba este lembrete também no bot configurado
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={form.sendTelegram}
                    onCheckedChange={(val) => setForm({ ...form, sendTelegram: val })}
                    activeColor="bg-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#09090b] border border-white/[0.06]">
                  <div>
                    <p className="text-sm font-medium text-white">Lembrete Ativo</p>
                    <p className="text-xs text-zinc-500">
                      Ative ou desative sem precisar excluir
                    </p>
                  </div>
                  <Switch
                    checked={form.enabled}
                    onCheckedChange={(val) => setForm({ ...form, enabled: val })}
                    activeColor="bg-emerald-500"
                  />
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-100 text-zinc-950 hover:bg-white transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 size={15} className="animate-spin" />
                  )}
                  <span>{editingId ? "Salvar Alterações" : "Criar Lembrete"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
