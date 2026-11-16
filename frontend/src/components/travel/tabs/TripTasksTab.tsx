"use client";

import { useState, useMemo } from "react";
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  FileCheck,
  CreditCard,
  Bus,
  Shield,
  Ticket,
  Sparkles,
  Edit3,
  Trash2,
  X,
  Calendar,
  Zap,
} from "lucide-react";
import { TripTask, TripTaskCategory } from "@/lib/types";
import { FilterPill, EmptyState } from "@/components/ui/page-shell";

interface TripTasksTabProps {
  tasks: TripTask[];
  onSaveTasks: (updated: TripTask[]) => Promise<void>;
}

export function TripTasksTab({ tasks, onSaveTasks }: TripTasksTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TripTask | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TripTaskCategory>("TRANSPORT");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const quickSuggestions: Array<{ title: string; category: TripTaskCategory }> = [
    { title: "Conseguir cartão de transporte (ônibus/metrô)", category: "TRANSPORT" },
    { title: "Comprar chip internacional eSIM", category: "GENERAL" },
    { title: "Contratar seguro viagem", category: "HEALTH_INSURANCE" },
    { title: "Habilitar cartões / Comprar moeda estrangeira", category: "FINANCES" },
    { title: "Conferir validade do passaporte & documentos", category: "DOCUMENTS" },
    { title: "Comprar adaptador de tomada universal", category: "GENERAL" },
    { title: "Fazer reserva de ingressos concorridos", category: "BOOKINGS" },
    { title: "Fazer check-in online do voo (24h antes)", category: "TRANSPORT" },
  ];

  const handleOpenModal = (task?: TripTask | null) => {
    if (task) {
      setEditingTask(task);
      setTitle(task.title || "");
      setCategory(task.category || "GENERAL");
      setDueDate(task.dueDate || "");
      setNotes(task.notes || "");
    } else {
      setEditingTask(null);
      setTitle("");
      setCategory("TRANSPORT");
      setDueDate("");
      setNotes("");
    }
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      const updated = tasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: title.trim(),
              category,
              dueDate: dueDate || undefined,
              notes: notes.trim() || undefined,
            }
          : t
      );
      await onSaveTasks(updated);
    } else {
      const newTask: TripTask = {
        id: String(Date.now()),
        title: title.trim(),
        category,
        dueDate: dueDate || undefined,
        notes: notes.trim() || undefined,
        completed: false,
      };
      await onSaveTasks([...tasks, newTask]);
    }
    setIsModalOpen(false);
  };

  const handleAddQuickSuggestion = async (suggestion: {
    title: string;
    category: TripTaskCategory;
  }) => {
    if (tasks.some((t) => (t.title || "").toLowerCase() === suggestion.title.toLowerCase())) {
      return;
    }

    const newTask: TripTask = {
      id: String(Date.now()),
      title: suggestion.title,
      category: suggestion.category,
      completed: false,
    };
    await onSaveTasks([...tasks, newTask]);
  };

  const handleToggleTask = async (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    await onSaveTasks(updated);
  };

  const handleDeleteTask = async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    await onSaveTasks(updated);
  };

  const getCategoryConfig = (cat: TripTaskCategory) => {
    switch (cat) {
      case "TRANSPORT":
        return { label: "Transporte", icon: Bus, color: "text-zinc-200 bg-white/[0.06] border-white/[0.1]" };
      case "DOCUMENTS":
        return { label: "Documentos", icon: FileCheck, color: "text-amber-300 bg-amber-500/10 border-amber-500/20" };
      case "FINANCES":
        return { label: "Finanças", icon: CreditCard, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "HEALTH_INSURANCE":
        return { label: "Saúde & Seguro", icon: Shield, color: "text-rose-300 bg-rose-500/10 border-rose-500/20" };
      case "BOOKINGS":
        return { label: "Reservas", icon: Ticket, color: "text-purple-300 bg-purple-500/10 border-purple-500/20" };
      default:
        return { label: "Geral", icon: Sparkles, color: "text-zinc-300 bg-white/[0.05] border-white/[0.08]" };
    }
  };

  const filteredTasks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesSearch =
        !q ||
        (t.title || "").toLowerCase().includes(q) ||
        (t.notes || "").toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "ALL"
          ? true
          : filterStatus === "COMPLETED"
          ? t.completed
          : !t.completed;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchTerm, filterStatus]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckSquare className="text-zinc-400" size={18} />
            Tarefas & Preparativos
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pendências antes e durante a viagem: transporte, câmbio, seguro, chips e reservas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="inline-flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.2} />
          <span>Nova Tarefa</span>
        </button>
      </div>

      {/* Progress Card */}
      <div className="rounded-xl border border-white/[0.06] bg-[#09090b] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2 flex-wrap">
            <span>Progresso das Pendências</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-200 border border-white/[0.08]">
              {completedCount} de {tasks.length} concluídas
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {tasks.length - completedCount === 0 && tasks.length > 0
              ? "Tudo pronto para a viagem."
              : `Restam ${tasks.length - completedCount} pendências para resolver.`}
          </p>
        </div>

        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-mono font-semibold text-zinc-400">
            <span>Concluído</span>
            <span className="text-zinc-100">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Suggestions Box */}
      <div className="rounded-xl border border-white/[0.06] bg-[#09090b] p-4 space-y-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          <Zap size={13} className="text-zinc-400" />
          <span>Sugestões Rápidas (Clique para Adicionar)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickSuggestions.map((sug, i) => {
            const alreadyAdded = tasks.some(
              (t) => (t.title || "").toLowerCase() === sug.title.toLowerCase()
            );
            return (
              <button
                key={i}
                type="button"
                disabled={alreadyAdded}
                onClick={() => handleAddQuickSuggestion(sug)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  alreadyAdded
                    ? "bg-white/[0.02] border-transparent text-zinc-600 cursor-not-allowed line-through"
                    : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-zinc-300 hover:text-white"
                }`}
              >
                <span>{sug.title}</span>
                {!alreadyAdded && <Plus size={11} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#09090b] border border-white/[0.06] p-3 rounded-xl">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar tarefa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111113] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0">
          <FilterPill active={filterStatus === "ALL"} onClick={() => setFilterStatus("ALL")}>
            Todas ({tasks.length})
          </FilterPill>
          <FilterPill
            active={filterStatus === "PENDING"}
            onClick={() => setFilterStatus("PENDING")}
          >
            Pendentes ({tasks.length - completedCount})
          </FilterPill>
          <FilterPill
            active={filterStatus === "COMPLETED"}
            onClick={() => setFilterStatus("COMPLETED")}
          >
            Concluídas ({completedCount})
          </FilterPill>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={24} />}
          title="Nenhuma tarefa encontrada"
          description={
            tasks.length === 0
              ? "Use as sugestões rápidas acima ou adicione suas tarefas personalizadas."
              : "Nenhuma tarefa corresponde aos filtros aplicados."
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const cat = getCategoryConfig(task.category);
            const CatIcon = cat.icon;

            return (
              <div
                key={task.id}
                className={`group flex items-start justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-colors ${
                  task.completed
                    ? "bg-[#09090b] border-white/[0.04] opacity-60"
                    : "bg-[#09090b] border-white/[0.06] hover:border-white/[0.14]"
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className={`mt-0.5 cursor-pointer transition-colors ${
                      task.completed
                        ? "text-emerald-400 hover:text-zinc-400"
                        : "text-zinc-500 hover:text-zinc-200"
                    }`}
                    title={task.completed ? "Desmarcar tarefa" : "Concluir tarefa"}
                  >
                    {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-medium py-0.5 px-2 rounded-md border flex items-center gap-1 ${cat.color}`}
                      >
                        <CatIcon size={10} />
                        {cat.label}
                      </span>

                      {task.dueDate && (
                        <span className="text-[10px] text-zinc-400 bg-white/[0.04] border border-white/[0.06] py-0.5 px-2 rounded-md flex items-center gap-1">
                          <Calendar size={10} className="text-zinc-500" />
                          Prazo: {task.dueDate}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-semibold leading-snug ${
                        task.completed ? "line-through text-zinc-500" : "text-white"
                      }`}
                    >
                      {task.title}
                    </h4>

                    {task.notes && (
                      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(task)}
                    className="p-1.5 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
                    title="Editar tarefa"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 bg-white/[0.04] hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Excluir tarefa"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Nova / Editar Tarefa */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/80"
          />
          <div className="relative w-full max-w-lg bg-[#111113] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="text-zinc-400" size={18} />
                {editingTask ? "Editar Tarefa" : "Nova Tarefa de Viagem"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Conseguir cartão de ônibus/metrô, Comprar chip eSIM..."
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TripTaskCategory)}
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/25"
                  >
                    <option value="TRANSPORT">Transporte</option>
                    <option value="DOCUMENTS">Documentos & Vistos</option>
                    <option value="FINANCES">Finanças & Moeda</option>
                    <option value="HEALTH_INSURANCE">Saúde & Seguro</option>
                    <option value="BOOKINGS">Reservas & Ingressos</option>
                    <option value="GENERAL">Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Prazo / Data Limite
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Notas & Instruções
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Baixar o aplicativo oficial de transporte para recarregar o cartão..."
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-200 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-colors cursor-pointer"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
