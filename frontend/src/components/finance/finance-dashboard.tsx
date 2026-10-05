"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wallet,
  CreditCard,
  BellRing,
  Calendar,
  ArrowUpRight,
  PlusCircle,
  Server,
  MonitorPlay,
  Loader2,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  PieChart as PieChartIcon,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { financeApi } from "@/lib/api";
import { toast } from "sonner";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T12:00:00Z");
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const isUrgent = (dateStr: string) => {
  if (!dateStr) return false;
  const today = new Date();
  const paymentDate = new Date(dateStr + "T12:00:00Z");
  const diffDays = Math.ceil(
    (paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays <= 3 && diffDays >= 0;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#09090b]/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          style={{ backgroundColor: data.color }}
        />
        <div>
          <p className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold mb-1">
            {data.name}
          </p>
          <p className="text-white font-mono font-bold text-sm drop-shadow-md">
            R$ {data.value.toFixed(2).replace(".", ",")}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const getCategoryIcon = (category: string) => {
  const cat = category?.toLowerCase() || "";
  if (
    cat.includes("dev") ||
    cat.includes("infra") ||
    cat.includes("hospedagem") ||
    cat.includes("software")
  )
    return Server;
  if (
    cat.includes("entretenimento") ||
    cat.includes("streaming") ||
    cat.includes("mídia")
  )
    return MonitorPlay;
  return Wallet;
};

const PRESET_COLORS = [
  "#e50914",
  "#1db954",
  "#0080ff",
  "#a855f7",
  "#eab308",
  "#ffffff",
  "#52525b",
];

export function FinanceDashboard() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Entretenimento",
    price: "",
    billingCycle: "Mensal",
    nextPayment: "",
    color: PRESET_COLORS[0],
  });

  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ["finance-subscriptions"],
    queryFn: financeApi.getSubscriptions,
  });

  const addMutation = useMutation({
    mutationFn: financeApi.addSubscription,
    onSuccess: () => {
      toast.success("Assinatura salva!");
      queryClient.invalidateQueries({ queryKey: ["finance-subscriptions"] });
      closeModal();
    },
    onError: () => toast.error("Erro ao salvar assinatura."),
  });

  const editMutation = useMutation({
    mutationFn: financeApi.editSubscription,
    onSuccess: () => {
      toast.success("Assinatura atualizada!");
      queryClient.invalidateQueries({ queryKey: ["finance-subscriptions"] });
      closeModal();
    },
    onError: () => toast.error("Erro ao editar assinatura."),
  });

  const payMutation = useMutation({
    mutationFn: financeApi.markAsPaid,
    onSuccess: () => {
      toast.success("Assinatura renovada!");
      queryClient.invalidateQueries({ queryKey: ["finance-subscriptions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: financeApi.deleteSubscription,
    onSuccess: () => {
      toast.success("Assinatura removida.");
      queryClient.invalidateQueries({ queryKey: ["finance-subscriptions"] });
    },
  });

  const totalMonthly = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return subscriptions.reduce((acc: number, curr: any) => {
      let monthlyImpact = 0;

      if (curr.billingCycle === "Anual dividida") {
        monthlyImpact = curr.price / 12;
      } else if (curr.billingCycle === "Anual integral") {
        const paymentDate = new Date(curr.nextPayment + "T12:00:00Z");
        if (
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        ) {
          monthlyImpact = curr.price;
        }
      } else {
        monthlyImpact = curr.price;
      }

      return acc + (monthlyImpact || 0);
    }, 0);
  }, [subscriptions]);

  const chartData = useMemo(() => {
    if (!subscriptions.length) return [];
    const grouped = subscriptions.reduce((acc: any, sub: any) => {
      if (!acc[sub.category]) {
        acc[sub.category] = {
          name: sub.category,
          value: 0,
          color: sub.color || "#52525b",
        };
      }
      acc[sub.category].value += sub.price;
      return acc;
    }, {});
    return Object.values(grouped);
  }, [subscriptions]);

  const urgentSubscription = subscriptions.find((sub: any) =>
    isUrgent(sub.nextPayment),
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "",
      category: "Entretenimento",
      price: "",
      billingCycle: "Mensal",
      nextPayment: "",
      color: PRESET_COLORS[0],
    });
  };

  const openEditModal = (sub: any) => {
    setEditingId(sub.id);
    setFormData({
      name: sub.name,
      category: sub.category,
      price: sub.price.toString(),
      billingCycle: sub.billingCycle || "Mensal",
      nextPayment: sub.nextPayment,
      color: sub.color || PRESET_COLORS[0],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.nextPayment) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const payload = {
      ...formData,
      price: parseFloat(formData.price.replace(",", ".")),
    };

    if (editingId) {
      editMutation.mutate({ id: editingId, ...payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500/50" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-5 md:gap-8 h-full relative">
      {/* MODAL DE ADIÇÃO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#121214]/95 backdrop-blur-2xl border border-white/10 border-t-amber-500/50 rounded-3xl p-5 md:p-6 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-5 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                {editingId ? (
                  <Edit3 className="w-5 h-5 text-amber-500" />
                ) : (
                  <PlusCircle className="w-5 h-5 text-amber-500" />
                )}
                {editingId ? "Editar Assinatura" : "Nova Assinatura"}
              </h3>
              <button
                onClick={closeModal}
                className="text-zinc-500 hover:text-white transition-colors p-1 bg-white/5 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                  Serviço
                </label>
                <input
                  type="text"
                  placeholder="Ex: Netflix, AWS..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 mt-1 shadow-inner"
                  autoFocus
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="29.90"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 mt-1 shadow-inner"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                    Ciclo
                  </label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) =>
                      setFormData({ ...formData, billingCycle: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 mt-1 appearance-none shadow-inner cursor-pointer"
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Anual dividida">
                      Anual (Dividida em 12x)
                    </option>
                    <option value="Anual integral">Anual (Paga à vista)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 mt-1 appearance-none shadow-inner cursor-pointer"
                  >
                    <option value="Entretenimento">Entretenimento</option>
                    <option value="Infra & Dev">Infra & Dev</option>
                    <option value="Serviços Essenciais">
                      Serviços Essenciais
                    </option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                    Próx. Vencimento
                  </label>
                  <input
                    type="date"
                    value={formData.nextPayment}
                    onChange={(e) =>
                      setFormData({ ...formData, nextPayment: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 mt-1 shadow-inner cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                  Cor da Marca
                </label>
                <div className="flex items-center justify-between gap-1 md:gap-2 mt-2 mb-2 bg-black/20 p-3 rounded-xl border border-white/5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-6 h-6 md:w-8 md:h-8 rounded-full transition-all duration-300 ${formData.color === color ? "scale-110 ring-2 ring-offset-2 ring-offset-[#121214] ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "hover:scale-110 opacity-70 hover:opacity-100"}`}
                      style={{
                        backgroundColor: color,
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={addMutation.isPending || editMutation.isPending}
                className="w-full py-3 md:py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] mt-2 flex items-center justify-center gap-2"
              >
                {addMutation.isPending || editMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : editingId ? (
                  "Salvar Alterações"
                ) : (
                  "Salvar Assinatura"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- CARDS SUPERIORES --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="sm:col-span-2 md:col-span-1 bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-amber-500/50 rounded-3xl p-4 md:p-8 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Wallet className="w-20 h-20 md:w-24 md:h-24 text-amber-500 -rotate-12" />
          </div>
          <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2 relative z-10">
            <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-500" />{" "}
            Gasto Previsto no Mês
          </p>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-amber-500/50 font-medium text-sm md:text-base">
              R$
            </span>
            <span className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {totalMonthly.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-blue-500/50 rounded-3xl p-4 md:p-8 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Server className="w-20 h-20 md:w-24 md:h-24 text-blue-500 -rotate-12" />
          </div>
          <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2 relative z-10">
            <Server className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />{" "}
            Assinaturas Ativas
          </p>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {subscriptions.length}
            </span>
            <span className="text-zinc-500 text-xs md:text-sm font-medium">
              serviços rodando
            </span>
          </div>
        </div>

        {urgentSubscription ? (
          <div className="bg-red-950/20 backdrop-blur-xl border border-red-500/20 border-t-red-500/60 rounded-3xl p-4 md:p-8 shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-70"></div>
            <div className="absolute top-4 right-5 md:top-5 md:right-6 z-10">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full animate-ping absolute opacity-75"></div>
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full relative shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
            </div>
            <p className="text-[10px] md:text-xs font-bold text-red-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2 relative z-10">
              <BellRing className="w-3.5 h-3.5 md:w-4 md:h-4" /> Urgente
            </p>
            <p className="text-lg md:text-xl font-bold text-white leading-tight mb-1 truncate drop-shadow-md relative z-10">
              {urgentSubscription.name}
            </p>
            <p className="text-xs md:text-sm font-mono font-medium text-red-400/80 relative z-10">
              Vence em {formatDate(urgentSubscription.nextPayment)} • R${" "}
              {urgentSubscription.price.toFixed(2).replace(".", ",")}
            </p>
          </div>
        ) : (
          <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-emerald-500/50 rounded-3xl p-4 md:p-8 shadow-xl flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-transform duration-300">
            <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-emerald-500 mb-2 md:mb-3 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
            <p className="text-sm md:text-base font-bold text-white">
              Tudo tranquilo!
            </p>
            <p className="text-[10px] md:text-xs text-zinc-500 font-medium mt-1">
              Nenhum vencimento próximo.
            </p>
          </div>
        )}
      </div>

      {/* --- DASHBOARD INFERIOR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 w-full animate-in fade-in duration-700">
        <div className="lg:col-span-8 bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-amber-500/50 rounded-3xl p-4 md:p-8 shadow-2xl flex flex-col h-full min-h-[400px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>

          <div className="flex items-center justify-between mb-6 md:mb-8 relative z-10">
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />{" "}
              Meus Contratos
            </h2>
            <button
              onClick={() => {
                setEditingId(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-amber-400 bg-white/5 border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/10 px-3 py-1.5 md:px-4 md:py-2 rounded-xl transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5 md:w-4 md:h-4" /> Nova
            </button>
          </div>

          <div className="flex-grow overflow-y-auto pr-1 md:pr-2 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent relative z-10">
            {subscriptions.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center bg-black/20 rounded-2xl border border-white/5 border-dashed">
                <Wallet className="w-10 h-10 md:w-12 md:h-12 text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-xs md:text-sm font-medium mb-3">
                  Nenhuma assinatura cadastrada.
                </p>
              </div>
            ) : (
              subscriptions.map((sub: any) => {
                const Icon = getCategoryIcon(sub.category);
                const urgent = isUrgent(sub.nextPayment);

                return (
                  <div
                    key={sub.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-white/5 bg-black/40 hover:bg-white/[0.03] hover:border-amber-500/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-[0_8px_20px_-10px_rgba(245,158,11,0.2)] hover:-translate-y-0.5 gap-4 sm:gap-0"
                  >
                    <div className="flex items-center justify-between w-full sm:w-auto">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div
                          className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner backdrop-blur-md transition-transform group-hover:scale-110 duration-300"
                          style={{
                            backgroundColor: `${sub.color}15`,
                            border: `1px solid ${sub.color}40`,
                          }}
                        >
                          <Icon
                            className="w-4 h-4 md:w-5 md:h-5 drop-shadow-lg"
                            style={{ color: sub.color }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-zinc-100 group-hover:text-white transition-colors">
                            {sub.name}
                          </span>
                          <span className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 md:mt-1">
                            {sub.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end sm:hidden">
                        <span className="font-mono font-bold text-white text-sm drop-shadow-md">
                          R$ {sub.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-[9px] font-bold text-amber-500/70 uppercase mt-0.5">
                          {sub.billingCycle || "Mensal"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-8 border-t border-white/5 pt-3 sm:border-0 sm:pt-0 w-full sm:w-auto relative">
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                          Vencimento
                        </span>
                        <div
                          className={`flex items-center gap-1.5 text-[10px] md:text-xs font-mono font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border ${urgent ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "bg-black/50 text-zinc-300 border-white/10"}`}
                        >
                          <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {formatDate(sub.nextPayment)}
                        </div>
                      </div>

                      <div className="hidden sm:flex flex-col items-end min-w-[80px]">
                        <span className="font-mono font-bold text-white text-base drop-shadow-md">
                          R$ {sub.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-[10px] font-bold text-amber-500/70 uppercase mt-0.5">
                          {sub.billingCycle || "Mensal"}
                        </span>
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all ml-0 md:ml-2">
                        <button
                          onClick={() => payMutation.mutate(sub.id)}
                          disabled={payMutation.isPending}
                          className="p-2 text-emerald-500 bg-white/5 lg:bg-transparent hover:bg-emerald-500/20 rounded-md transition-colors border border-transparent hover:border-emerald-500/30"
                          title="Renovar ciclo"
                        >
                          <CheckCircle2 className="w-4 h-4 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(sub)}
                          className="p-2 text-blue-500 bg-white/5 lg:bg-transparent hover:bg-blue-500/20 rounded-md transition-colors border border-transparent hover:border-blue-500/30"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja remover ${sub.name}?`))
                              deleteMutation.mutate(sub.id);
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-red-500 bg-white/5 lg:bg-transparent hover:bg-red-500/20 rounded-md transition-colors border border-transparent hover:border-red-500/30"
                          title="Remover assinatura"
                        >
                          <Trash2 className="w-4 h-4 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* GRÁFICO DE DISTRIBUIÇÃO */}
        <div className="lg:col-span-4 bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-orange-500/50 rounded-3xl p-4 md:p-8 shadow-2xl flex flex-col h-full min-h-[380px] md:min-h-[400px] relative overflow-hidden group">
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
          <PieChartIcon
            className="absolute -bottom-10 -right-10 w-48 h-48 md:w-64 md:h-64 text-white opacity-[0.015] pointer-events-none -rotate-12"
            strokeWidth={1}
          />
          <h2 className="text-lg md:text-xl font-bold text-white mb-1 relative z-10">
            Distribuição
          </h2>
          <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 md:mb-8 relative z-10">
            Gastos por Categoria
          </p>

          <div className="flex-grow w-full relative z-10 flex items-center justify-center min-h-[200px] md:min-h-[210px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                    animationDuration={1500}
                  >
                    {chartData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="hover:opacity-80 transition-opacity duration-300 outline-none drop-shadow-xl"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-zinc-600 text-xs md:text-sm font-medium bg-black/20 px-5 py-3 md:px-6 md:py-4 rounded-xl border border-white/5 border-dashed">
                Sem dados para o gráfico.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-6 relative z-10">
            {chartData.map((item: any) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-black/20 hover:bg-black/40 border border-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 10px ${item.color}60`,
                    }}
                  />
                  <span className="text-[10px] md:text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    {item.name}
                  </span>
                </div>
                <span className="font-mono text-xs md:text-sm font-bold text-white drop-shadow-md">
                  R$ {item.value.toFixed(2).replace(".", ",")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
