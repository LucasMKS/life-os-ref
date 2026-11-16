"use client";

import { lazy, Suspense, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  Calendar,
  CheckCircle2,
  CreditCard,
  Edit3,
  Layers,
  Loader2,
  MonitorPlay,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  Wallet,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import {
  EmptyState,
  FilterPill,
  StatCard,
  SurfacePanel,
} from "@/components/ui/page-shell";
import { financeApi } from "@/lib/api";
import {
  ALLOWED_CATEGORIES,
  formatCurrency,
  formatDate,
  getDaysUntil,
  isUrgent,
  normalizeSubscription,
  parseSafeDate,
  type SubscriptionItem,
  type SubscriptionPayload,
} from "./types";

const SubscriptionModal = lazy(() => import("./subscription-modal"));

interface ChartEntry {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartEntry }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-[#161619] border border-white/[0.08] px-3 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5">
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: data.color }}
      />
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          {data.name}
        </p>
        <p className="text-sm font-semibold text-white tabular-nums">
          {formatCurrency(data.value)}
        </p>
      </div>
    </div>
  );
}

function getCategoryIcon(category: string) {
  const cat = category.toLowerCase();
  if (
    cat.includes("dev") ||
    cat.includes("infra") ||
    cat.includes("hospedagem") ||
    cat.includes("software")
  ) {
    return Server;
  }
  if (
    cat.includes("entretenimento") ||
    cat.includes("streaming") ||
    cat.includes("mídia")
  ) {
    return MonitorPlay;
  }
  return Wallet;
}

function formatMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return monthKey;
  const date = new Date(Date.UTC(year, month - 1, 15));
  return date.toLocaleDateString("pt-BR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getMonthlyImpact(
  sub: SubscriptionItem,
  currentMonth: number,
  currentYear: number,
): number {
  if (sub.billingCycle === "Anual dividida") {
    return sub.price / 12;
  }
  if (sub.billingCycle === "Anual integral") {
    const paymentDate = parseSafeDate(sub.nextPayment);
    if (
      paymentDate &&
      paymentDate.getUTCMonth() === currentMonth &&
      paymentDate.getUTCFullYear() === currentYear
    ) {
      return sub.price;
    }
    return 0;
  }
  return sub.price;
}

export function FinanceDashboard() {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [selectedMonth, setSelectedMonth] = useState<string>("Todos");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [referenceDate] = useState(() => new Date());

  const {
    data: rawSubscriptions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["finance-subscriptions"],
    queryFn: financeApi.getSubscriptions,
  });

  const subscriptions = useMemo<SubscriptionItem[]>(() => {
    if (!Array.isArray(rawSubscriptions)) return [];
    return rawSubscriptions
      .map(normalizeSubscription)
      .filter((item): item is SubscriptionItem => item !== null);
  }, [rawSubscriptions]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSub(null);
  };

  const addMutation = useMutation({
    mutationFn: (payload: SubscriptionPayload) =>
      financeApi.addSubscription(payload),
    onSuccess: () => {
      toast.success("Assinatura adicionada.");
      queryClient.invalidateQueries({ queryKey: ["finance-subscriptions"] });
      closeModal();
    },
    onError: () => toast.error("Não foi possível salvar a assinatura."),
  });

  const editMutation = useMutation({
    mutationFn: (payload: SubscriptionPayload) =>
      financeApi.editSubscription(payload),
    onSuccess: () => {
      toast.success("Assinatura atualizada.");
      queryClient.invalidateQueries({ queryKey: ["finance-subscriptions"] });
      closeModal();
    },
    onError: () => toast.error("Não foi possível atualizar a assinatura."),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => financeApi.markAsPaid(id),
    onSuccess: () => {
      toast.success("Ciclo renovado.");
      queryClient.invalidateQueries({ queryKey: ["finance-subscriptions"] });
    },
    onError: () => toast.error("Não foi possível renovar o ciclo."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeApi.deleteSubscription(id),
    onSuccess: () => {
      toast.success("Assinatura removida.");
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["finance-subscriptions"] });
    },
    onError: () => toast.error("Não foi possível remover a assinatura."),
  });

  const { totalMonthly, totalAnnual, monthlyCount, annualCount } = useMemo(() => {
    const currentMonth = referenceDate.getUTCMonth();
    const currentYear = referenceDate.getUTCFullYear();

    let monthlySum = 0;
    let annualSum = 0;
    let mCount = 0;
    let aCount = 0;

    for (const sub of subscriptions) {
      monthlySum += getMonthlyImpact(sub, currentMonth, currentYear);
      if (sub.billingCycle.startsWith("Anual")) {
        annualSum += sub.price;
        aCount += 1;
      } else {
        annualSum += sub.price * 12;
        mCount += 1;
      }
    }

    return {
      totalMonthly: monthlySum,
      totalAnnual: annualSum,
      monthlyCount: mCount,
      annualCount: aCount,
    };
  }, [subscriptions, referenceDate]);

  const nextDueSubscription = useMemo(() => {
    const upcoming = subscriptions
      .map((sub) => ({ sub, days: getDaysUntil(sub.nextPayment) }))
      .filter(
        (entry): entry is { sub: SubscriptionItem; days: number } =>
          entry.days !== null && entry.days >= 0,
      )
      .sort((a, b) => a.days - b.days);
    return upcoming[0]?.sub ?? null;
  }, [subscriptions]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>(ALLOWED_CATEGORIES);
    for (const sub of subscriptions) {
      if (sub.category) set.add(sub.category);
    }
    return ["Todas", ...Array.from(set)];
  }, [subscriptions]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const sub of subscriptions) {
      if (sub.nextPayment && sub.nextPayment.length >= 7) {
        months.add(sub.nextPayment.slice(0, 7));
      }
    }
    return Array.from(months).sort();
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesCategory =
        selectedCategory === "Todas" || sub.category === selectedCategory;
      const matchesMonth =
        selectedMonth === "Todos" ||
        sub.nextPayment.startsWith(selectedMonth);
      return matchesCategory && matchesMonth;
    });
  }, [subscriptions, selectedCategory, selectedMonth]);

  const chartData = useMemo<ChartEntry[]>(() => {
    const source = filteredSubscriptions;
    if (source.length === 0) return [];

    const grouped = new Map<string, ChartEntry>();
    for (const sub of source) {
      const existing = grouped.get(sub.category);
      if (existing) {
        existing.value += sub.price;
      } else {
        grouped.set(sub.category, {
          name: sub.category,
          value: sub.price,
          color: sub.color,
        });
      }
    }
    return Array.from(grouped.values()).sort((a, b) => b.value - a.value);
  }, [filteredSubscriptions]);

  const chartTotal = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData],
  );

  const handleOpenCreate = () => {
    setEditingSub(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: SubscriptionItem) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (payload: SubscriptionPayload) => {
    if (payload.id) {
      editMutation.mutate(payload);
    } else {
      addMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[360px]">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<Wallet className="w-5 h-5" />}
        title="Erro ao carregar assinaturas"
        description="Não foi possível buscar seus dados financeiros no momento."
        action={
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold rounded-xl text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        }
      />
    );
  }

  const nextDueUrgent = nextDueSubscription
    ? isUrgent(nextDueSubscription.nextPayment)
    : false;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* KPI SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Gasto Mensal Previsto"
          value={formatCurrency(totalMonthly)}
          hint={`Projeção anual: ${formatCurrency(totalAnnual)}`}
          icon={<CreditCard className="w-4 h-4 text-cyan-400" />}
          accent="cyan"
        />

        <StatCard
          label="Assinaturas Ativas"
          value={subscriptions.length}
          hint={`${monthlyCount} mensais · ${annualCount} anuais`}
          icon={<Layers className="w-4 h-4 text-cyan-400" />}
          accent="cyan"
        />

        <StatCard
          label="Próximo Vencimento"
          value={nextDueSubscription ? nextDueSubscription.name : "Tudo em dia"}
          hint={
            nextDueSubscription
              ? `${nextDueUrgent ? "Urgente · " : ""}Vence em ${formatDate(nextDueSubscription.nextPayment)} · ${formatCurrency(nextDueSubscription.price)}`
              : "Nenhum vencimento próximo"
          }
          icon={
            nextDueUrgent ? (
              <BellRing className="w-4 h-4 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )
          }
          accent="cyan"
        />
      </div>

      {/* FILTER & ACTION TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {availableCategories.map((cat) => (
            <FilterPill
              key={cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
              accent="cyan"
            >
              {cat}
            </FilterPill>
          ))}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {availableMonths.length > 0 && (
            <select
              aria-label="Filtrar por mês de vencimento"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#111113] border border-white/[0.06] hover:border-white/[0.12] rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 focus:outline-none focus:border-white/20 cursor-pointer"
            >
              <option value="Todos">Todos os meses</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold rounded-xl text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova assinatura
          </button>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* SUBSCRIPTIONS LIST */}
        <SurfacePanel
          className="lg:col-span-8"
          title="Assinaturas"
          icon={<Wallet className="w-4 h-4 text-cyan-400" />}
          accent="cyan"
          action={
            <span className="text-xs text-zinc-500 tabular-nums">
              {filteredSubscriptions.length}{" "}
              {filteredSubscriptions.length === 1 ? "item" : "itens"}
            </span>
          }
          noPadding
        >
          {filteredSubscriptions.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Wallet className="w-5 h-5" />}
                title={
                  subscriptions.length === 0
                    ? "Nenhuma assinatura cadastrada"
                    : "Nenhum resultado para o filtro"
                }
                description={
                  subscriptions.length === 0
                    ? "Adicione seus serviços recorrentes para acompanhar vencimentos e custos mensais."
                    : "Tente selecionar outra categoria ou mês de vencimento."
                }
                action={
                  subscriptions.length === 0 ? (
                    <button
                      type="button"
                      onClick={handleOpenCreate}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold rounded-xl text-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar assinatura
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Todas");
                        setSelectedMonth("Todos");
                      }}
                      className="px-3.5 py-2 bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] rounded-xl text-xs font-medium transition-colors"
                    >
                      Limpar filtros
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {filteredSubscriptions.map((sub) => {
                const Icon = getCategoryIcon(sub.category);
                const urgent = isUrgent(sub.nextPayment);
                const isConfirmingDelete = confirmDeleteId === sub.id;

                return (
                  <li
                    key={sub.id}
                    className="px-4 sm:px-5 py-3.5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 relative">
                        <Icon className="w-4 h-4 text-zinc-300" />
                        <span
                          aria-hidden="true"
                          className="w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 border border-[#111113]"
                          style={{ backgroundColor: sub.color }}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {sub.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {sub.category} · {sub.billingCycle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-13 sm:pl-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border tabular-nums ${
                          urgent
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-white/[0.03] text-zinc-300 border-white/[0.06]"
                        }`}
                      >
                        <Calendar className="w-3 h-3 shrink-0" />
                        {formatDate(sub.nextPayment)}
                      </span>

                      <span className="text-sm font-semibold text-white tabular-nums min-w-[84px] text-right">
                        {formatCurrency(sub.price)}
                      </span>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(sub.id)}
                            disabled={deleteMutation.isPending}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                          >
                            Remover
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => payMutation.mutate(sub.id)}
                            disabled={payMutation.isPending}
                            title="Renovar ciclo"
                            aria-label={`Renovar ${sub.name}`}
                            className="p-2 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sub)}
                            title="Editar assinatura"
                            aria-label={`Editar ${sub.name}`}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(sub.id)}
                            title="Remover assinatura"
                            aria-label={`Remover ${sub.name}`}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SurfacePanel>

        {/* CATEGORY DISTRIBUTION CHART */}
        <SurfacePanel
          className="lg:col-span-4"
          title="Distribuição por Categoria"
          icon={<PieChartIcon className="w-4 h-4 text-cyan-400" />}
          accent="cyan"
        >
          {chartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              Sem dados suficientes para exibir o gráfico.
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="w-full h-[210px]">
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
                      innerRadius={62}
                      outerRadius={86}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {chartData.map((item) => {
                  const pct =
                    chartTotal > 0
                      ? Math.round((item.value / chartTotal) * 100)
                      : 0;
                  return (
                    <div
                      key={item.name}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs font-medium text-zinc-300 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 tabular-nums">
                        <span className="text-[11px] text-zinc-500">
                          {pct}%
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </SurfacePanel>
      </div>

      {/* LAZY MODAL */}
      {isModalOpen && (
        <Suspense fallback={null}>
          <SubscriptionModal
            key={editingSub?.id ?? "new"}
            isOpen={isModalOpen}
            editingSubscription={editingSub}
            isPending={addMutation.isPending || editMutation.isPending}
            onClose={closeModal}
            onSubmit={handleModalSubmit}
          />
        </Suspense>
      )}
    </div>
  );
}
