"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

interface TripTasksTabProps {
  tasks: TripTask[];
  onSaveTasks: (updated: TripTask[]) => Promise<void>;
}

export function TripTasksTab({ tasks, onSaveTasks }: TripTasksTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TripTask | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TripTaskCategory>("TRANSPORT");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const quickSuggestions: Array<{ title: string; category: TripTaskCategory; icon: string }> = [
    { title: "Conseguir cartão de transporte (ônibus/metrô)", category: "TRANSPORT", icon: "🚌" },
    { title: "Comprar chip internacional eSIM", category: "GENERAL", icon: "📶" },
    { title: "Contratar seguro viagem", category: "HEALTH_INSURANCE", icon: "🛡️" },
    { title: "Habilitar cartões / Comprar moeda estrangeira", category: "FINANCES", icon: "💳" },
    { title: "Conferir validade do passaporte & documentos", category: "DOCUMENTS", icon: "🛂" },
    { title: "Comprar adaptador de tomada universal", category: "GENERAL", icon: "🔌" },
    { title: "Fazer reserva de ingressos concorridos", category: "BOOKINGS", icon: "🎟️" },
    { title: "Fazer check-in online do voo (24h antes)", category: "TRANSPORT", icon: "✈️" },
  ];

  const handleOpenModal = (task?: TripTask | null) => {
    if (task) {
      setEditingTask(task);
      setTitle(task.title);
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

  const handleAddQuickSuggestion = async (suggestion: { title: string; category: TripTaskCategory }) => {
    // Avoid duplicate title if already present
    if (tasks.some((t) => t.title.toLowerCase() === suggestion.title.toLowerCase())) {
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
        return { label: "Transporte", icon: Bus, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
      case "DOCUMENTS":
        return { label: "Documentos", icon: FileCheck, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      case "FINANCES":
        return { label: "Finanças", icon: CreditCard, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "HEALTH_INSURANCE":
        return { label: "Saúde & Seguro", icon: Shield, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" };
      case "BOOKINGS":
        return { label: "Reservas", icon: Ticket, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      default:
        return { label: "Geral", icon: Sparkles, color: "text-zinc-400 bg-white/5 border-white/10" };
    }
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === "ALL" || t.category === filterCategory;

      const matchesStatus =
        filterStatus === "ALL"
          ? true
          : filterStatus === "COMPLETED"
          ? t.completed
          : !t.completed;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tasks, searchTerm, filterCategory, filterStatus]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="text-purple-400" size={20} />
            O Que Devo Fazer (Tarefas & Preparativos)
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pendências cruciais antes e durante a viagem: transporte, câmbio, seguro, chips e reservas.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-purple-900/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          Nova Tarefa
        </button>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>Progresso das Pendências</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {completedCount} de {tasks.length} concluídas
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {tasks.length - completedCount === 0 && tasks.length > 0
              ? "Tudo pronto para a viagem! Nenhuma pendência restante 🎉"
              : `Restam ${tasks.length - completedCount} pendências para resolver.`}
          </p>
        </div>

        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-mono font-bold text-zinc-400">
            <span>Concluído</span>
            <span className="text-purple-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-sky-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Suggestions Box */}
      <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 uppercase tracking-wider">
          <Zap size={13} className="text-purple-400" />
          <span>Sugestões Rápidas de Viagem (Clique para Adicionar)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickSuggestions.map((sug, i) => {
            const alreadyAdded = tasks.some(
              (t) => t.title.toLowerCase() === sug.title.toLowerCase()
            );
            return (
              <button
                key={i}
                disabled={alreadyAdded}
                onClick={() => handleAddQuickSuggestion(sug)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  alreadyAdded
                    ? "bg-white/5 border-white/5 text-zinc-500 cursor-not-allowed line-through"
                    : "bg-white/5 hover:bg-purple-500/20 border-white/10 hover:border-purple-500/40 text-zinc-300 hover:text-white"
                }`}
              >
                <span>{sug.icon}</span>
                <span>{sug.title}</span>
                {!alreadyAdded && <Plus size={11} className="text-purple-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-zinc-900/40 border border-white/5 p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar tarefa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "ALL"
                ? "bg-purple-600 text-white font-bold"
                : "bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            Todas ({tasks.length})
          </button>
          <button
            onClick={() => setFilterStatus("PENDING")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "PENDING"
                ? "bg-purple-600 text-white font-bold"
                : "bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            Pendentes ({tasks.length - completedCount})
          </button>
          <button
            onClick={() => setFilterStatus("COMPLETED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "COMPLETED"
                ? "bg-purple-600 text-white font-bold"
                : "bg-white/5 text-zinc-400 hover:text-white"
            }`}
          >
            Concluídas ({completedCount})
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10 max-w-lg mx-auto">
          <CheckSquare className="text-zinc-500 w-10 h-10 mx-auto mb-3 opacity-60" />
          <h4 className="text-sm font-bold text-zinc-300">Nenhuma tarefa encontrada</h4>
          <p className="text-zinc-500 text-xs mt-1">
            {tasks.length === 0
              ? "Use as sugestões rápidas acima ou adicione suas tarefas personalizadas para planejar a viagem."
              : "Nenhuma tarefa corresponde aos filtros aplicados."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task, idx) => {
            const cat = getCategoryConfig(task.category);
            const CatIcon = cat.icon;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className={`group flex items-start justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  task.completed
                    ? "bg-zinc-950/40 border-white/5 opacity-60"
                    : "bg-zinc-900/40 border-white/10 hover:border-purple-500/30 hover:bg-zinc-900/60 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`mt-0.5 cursor-pointer transition-colors ${
                      task.completed
                        ? "text-purple-400 hover:text-zinc-400"
                        : "text-zinc-500 hover:text-purple-400"
                    }`}
                    title={task.completed ? "Desmarcar tarefa" : "Concluir tarefa"}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={19} />
                    ) : (
                      <Circle size={19} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-semibold py-0.5 px-2 rounded-lg border flex items-center gap-1 ${cat.color}`}>
                        <CatIcon size={10} />
                        {cat.label}
                      </span>

                      {task.dueDate && (
                        <span className="text-[10px] text-zinc-400 bg-white/5 border border-white/5 py-0.5 px-2 rounded-lg flex items-center gap-1">
                          <Calendar size={10} className="text-purple-400" />
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

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 max-sm:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleOpenModal(task)}
                    className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Editar tarefa"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-400 bg-white/5 hover:bg-red-500/15 rounded-lg transition-colors cursor-pointer"
                    title="Excluir tarefa"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: Nova / Editar Tarefa */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[#0c0c12] border border-white/10 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckSquare className="text-purple-400" size={18} />
                  {editingTask ? "Editar Tarefa" : "Nova Tarefa de Viagem"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Título da Tarefa *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Conseguir cartão de ônibus/metrô, Comprar chip eSIM..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Categoria
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TripTaskCategory)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
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
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Prazo / Data Limite
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Notas & Instruções
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Baixar o aplicativo oficial de transporte para recarregar o cartão no celular..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors cursor-pointer shadow-md shadow-purple-900/30"
                  >
                    Salvar Tarefa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
