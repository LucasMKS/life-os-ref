"use client";

import { useState, useMemo, useRef } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  X,
  Check,
  ClipboardList,
  Tag,
  CheckCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  DollarSign,
  Store,
} from "lucide-react";
import { ShoppingItem } from "@/lib/types";
import { FilterPill, EmptyState } from "@/components/ui/page-shell";
import { toast } from "sonner";

interface TripShoppingTabProps {
  items: ShoppingItem[];
  onSaveShopping: (updated: ShoppingItem[]) => Promise<void>;
}

export function TripShoppingTab({ items, onSaveShopping }: TripShoppingTabProps) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "PURCHASED">("ALL");

  // Quick Add State
  const [quickItemText, setQuickItemText] = useState("");
  const [quickCategory, setQuickCategory] = useState<string>("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const quickInputRef = useRef<HTMLInputElement>(null);

  // Batch Add Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [batchCategory, setBatchCategory] = useState("Geral");

  // Item Edit State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");
  const [detailedModalItem, setDetailedModalItem] = useState<ShoppingItem | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category && i.category.trim()) {
        set.add(i.category.trim());
      }
    });
    return Array.from(set);
  }, [items]);

  const effectiveAddCategory = useMemo(() => {
    if (quickCategory) return quickCategory;
    if (activeCategory !== "ALL") return activeCategory;
    return categories.length > 0 ? categories[0] : "Geral";
  }, [quickCategory, activeCategory, categories]);

  const stats = useMemo(() => {
    const listItems =
      activeCategory === "ALL"
        ? items
        : items.filter((i) => (i.category || "Geral").toLowerCase() === activeCategory.toLowerCase());

    const total = listItems.length;
    const purchased = listItems.filter((i) => i.purchased).length;
    const pending = total - purchased;
    const percent = total > 0 ? Math.round((purchased / total) * 100) : 0;

    let totalCost = 0;
    listItems.forEach((i) => {
      if (typeof i.estimatedPrice === "number" && !isNaN(i.estimatedPrice)) {
        totalCost += i.estimatedPrice;
      }
    });

    return { total, purchased, pending, percent, totalCost };
  }, [items, activeCategory]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((i) => {
      const itemCat = i.category?.trim() || "Geral";
      const matchesCategory =
        activeCategory === "ALL" || itemCat.toLowerCase() === activeCategory.toLowerCase();

      const matchesSearch =
        !q ||
        (i.name || "").toLowerCase().includes(q) ||
        (i.storeOrLocation || "").toLowerCase().includes(q) ||
        itemCat.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "ALL"
          ? true
          : filterStatus === "PURCHASED"
          ? i.purchased
          : !i.purchased;

      return matchesCategory && matchesSearch && matchesStatus;
    });
  }, [items, activeCategory, searchTerm, filterStatus]);

  const groupedItems = useMemo(() => {
    const map = new Map<string, ShoppingItem[]>();

    filteredItems.forEach((item) => {
      const cat = item.category?.trim() || "Geral";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(item);
    });

    return Array.from(map.entries());
  }, [filteredItems]);

  const handleQuickAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = quickItemText.trim();
    if (!text) return;

    const targetCategory = effectiveAddCategory.trim() || "Geral";
    const newItem: ShoppingItem = {
      id: String(Date.now() + Math.random().toString(36).substring(2, 7)),
      name: text,
      category: targetCategory,
      purchased: false,
    };

    await onSaveShopping([...items, newItem]);
    setQuickItemText("");
    quickInputRef.current?.focus();
  };

  const handleBatchAdd = async () => {
    const lines = batchText
      .split("\n")
      .map((l) => l.replace(/^[-*•\d.)\]\s]+/, "").trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      toast.error("Cole ao menos um item válido.");
      return;
    }

    const targetCategory = batchCategory.trim() || "Geral";
    const newItems: ShoppingItem[] = lines.map((name, index) => ({
      id: String(Date.now() + index + Math.random().toString(36).substring(2, 7)),
      name,
      category: targetCategory,
      purchased: false,
    }));

    await onSaveShopping([...items, ...newItems]);
    setIsBatchModalOpen(false);
    setBatchText("");
    setActiveCategory(targetCategory);
    toast.success(`${newItems.length} itens adicionados à lista "${targetCategory}"!`);
  };

  const handleToggle = async (id: string) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, purchased: !i.purchased } : i
    );
    await onSaveShopping(updated);
  };

  const handleDelete = async (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    await onSaveShopping(updated);
  };

  const handleStartEdit = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name || "");
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editingItemName.trim();
    if (!trimmed) {
      setEditingItemId(null);
      return;
    }
    const updated = items.map((i) =>
      i.id === id ? { ...i, name: trimmed } : i
    );
    await onSaveShopping(updated);
    setEditingItemId(null);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setActiveCategory(name);
    setQuickCategory(name);
    setNewCategoryName("");
    setIsCreatingCategory(false);
    quickInputRef.current?.focus();
    toast.success(`Categoria "${name}" criada! Adicione os itens.`);
  };

  const handleMarkAllPurchased = async (purchased: boolean) => {
    const targetIds = new Set(filteredItems.map((i) => i.id));
    const updated = items.map((i) =>
      targetIds.has(i.id) ? { ...i, purchased } : i
    );
    await onSaveShopping(updated);
    toast.success(
      purchased
        ? "Todos os itens marcados como comprados!"
        : "Todos os itens marcados como pendentes!"
    );
  };

  const handleClearPurchased = async () => {
    const purchasedInView = filteredItems.filter((i) => i.purchased);
    if (purchasedInView.length === 0) return;
    if (!confirm(`Remover ${purchasedInView.length} itens já comprados?`)) return;

    const idsToRemove = new Set(purchasedInView.map((i) => i.id));
    const updated = items.filter((i) => !idsToRemove.has(i.id));
    await onSaveShopping(updated);
    toast.success("Itens comprados removidos!");
  };

  const handleSaveDetailedModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedModalItem || !detailedModalItem.name.trim()) return;

    const sanitizedItem: ShoppingItem = {
      ...detailedModalItem,
      name: detailedModalItem.name.trim(),
      category: detailedModalItem.category?.trim() || undefined,
      storeOrLocation: detailedModalItem.storeOrLocation?.trim() || undefined,
      notes: detailedModalItem.notes?.trim() || undefined,
    };

    const updated = items.map((i) =>
      i.id === sanitizedItem.id ? sanitizedItem : i
    );
    await onSaveShopping(updated);
    setDetailedModalItem(null);
    toast.success("Detalhes do item atualizados!");
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag className="text-zinc-400" size={18} />
            Lista de Compras
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Organize compras, lembrancinhas, itens de mercado e despesas para a viagem.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setBatchCategory(activeCategory !== "ALL" ? activeCategory : "Geral");
            setIsBatchModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] font-medium text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          title="Importar vários itens de uma vez"
        >
          <ClipboardList size={14} className="text-zinc-400" />
          <span>Importar em Lote</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <FilterPill
          active={activeCategory === "ALL"}
          onClick={() => {
            setActiveCategory("ALL");
            setQuickCategory("");
          }}
        >
          <span>Todas</span>
          <span className="text-[10px] opacity-70 font-mono">{items.length}</span>
        </FilterPill>

        {categories.map((cat) => {
          const catItems = items.filter(
            (i) => (i.category || "Geral").toLowerCase() === cat.toLowerCase()
          );
          const catCount = catItems.length;
          const catBought = catItems.filter((i) => i.purchased).length;
          const isActive = activeCategory.toLowerCase() === cat.toLowerCase();

          return (
            <FilterPill
              key={cat}
              active={isActive}
              onClick={() => {
                setActiveCategory(cat);
                setQuickCategory(cat);
              }}
            >
              <span>{cat}</span>
              <span className="text-[10px] opacity-70 font-mono">
                {catBought}/{catCount}
              </span>
            </FilterPill>
          );
        })}

        {/* Create new category */}
        {isCreatingCategory ? (
          <form onSubmit={handleCreateCategory} className="flex items-center gap-1 shrink-0">
            <input
              type="text"
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nova lista..."
              className="bg-[#09090b] border border-white/25 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none w-40"
            />
            <button
              type="submit"
              className="bg-zinc-100 text-zinc-950 p-1.5 rounded-xl hover:bg-white cursor-pointer"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingCategory(false)}
              className="text-zinc-500 hover:text-white p-1.5 cursor-pointer"
            >
              <X size={13} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreatingCategory(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-dashed border-white/[0.12] transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <Plus size={12} />
            <span>Nova Categoria</span>
          </button>
        )}
      </div>

      {/* Quick Add Bar */}
      <div className="rounded-xl border border-white/[0.06] bg-[#09090b] p-3 sm:p-3.5">
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative shrink-0 sm:w-44">
            <select
              value={effectiveAddCategory}
              onChange={(e) => {
                setQuickCategory(e.target.value);
                if (activeCategory !== "ALL" && activeCategory !== e.target.value) {
                  setActiveCategory(e.target.value);
                }
              }}
              className="w-full appearance-none bg-[#111113] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-white/25 cursor-pointer"
            >
              {categories.length === 0 ? (
                <option value="Geral">Categoria: Geral</option>
              ) : (
                categories.map((c) => (
                  <option key={c} value={c}>
                    Categoria: {c}
                  </option>
                ))
              )}
              {effectiveAddCategory && !categories.includes(effectiveAddCategory) && (
                <option value={effectiveAddCategory}>
                  Categoria: {effectiveAddCategory}
                </option>
              )}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
          </div>

          <div className="relative flex-1">
            <input
              ref={quickInputRef}
              type="text"
              value={quickItemText}
              onChange={(e) => setQuickItemText(e.target.value)}
              placeholder={`Adicionar item em "${effectiveAddCategory}"...`}
              className="w-full bg-[#111113] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!quickItemText.trim()}
            className="flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Plus size={14} strokeWidth={2.2} />
            <span>Adicionar</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-white/[0.06] text-[11px] text-zinc-500 px-0.5">
          <span className="flex items-center gap-1.5">
            <Sparkles size={11} className="text-zinc-400 shrink-0" />
            <span>
              Pressione{" "}
              <kbd className="bg-white/[0.08] px-1 py-0.5 rounded text-zinc-300 font-mono text-[10px]">
                Enter
              </kbd>{" "}
              para salvar e continuar adicionando.
            </span>
          </span>
          {stats.totalCost > 0 && (
            <span className="font-mono text-zinc-400 font-medium">
              Total estimado:{" "}
              <span className="text-emerald-400">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats.totalCost)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Overview, Filters and Bulk Actions Toolbar */}
      <div className="rounded-xl border border-white/[0.06] bg-[#09090b] p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-zinc-400">
                {activeCategory === "ALL" ? "Progresso Geral" : `Progresso em ${activeCategory}`}
              </span>
              <span className="font-mono font-semibold text-zinc-200">
                {stats.purchased}/{stats.total} ({stats.percent}%)
              </span>
            </div>
            <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleMarkAllPurchased(true)}
              disabled={stats.pending === 0}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] disabled:opacity-40 cursor-pointer transition-colors"
            >
              <CheckCheck size={12} className="text-emerald-400" />
              <span>Marcar todos</span>
            </button>

            <button
              type="button"
              onClick={() => handleMarkAllPurchased(false)}
              disabled={stats.purchased === 0}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] disabled:opacity-40 cursor-pointer transition-colors"
            >
              <RotateCcw size={12} />
              <span>Desmarcar</span>
            </button>

            {stats.purchased > 0 && (
              <button
                type="button"
                onClick={handleClearPurchased}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20 cursor-pointer transition-colors"
              >
                <Trash2 size={12} />
                <span>Limpar ({stats.purchased})</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-white/[0.06]">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar item, categoria ou loja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111113] border border-white/[0.06] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            <FilterPill active={filterStatus === "ALL"} onClick={() => setFilterStatus("ALL")}>
              Todos ({stats.total})
            </FilterPill>
            <FilterPill
              active={filterStatus === "PENDING"}
              onClick={() => setFilterStatus("PENDING")}
            >
              A Comprar ({stats.pending})
            </FilterPill>
            <FilterPill
              active={filterStatus === "PURCHASED"}
              onClick={() => setFilterStatus("PURCHASED")}
            >
              Comprados ({stats.purchased})
            </FilterPill>
          </div>
        </div>
      </div>

      {/* Shopping Checklist Items */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={24} />}
          title="Nenhum item encontrado"
          description={
            items.length === 0
              ? "Adicione itens na barra acima ou use 'Importar em Lote' para colar sua lista."
              : "Nenhum item corresponde à busca ou filtros atuais."
          }
        />
      ) : activeCategory !== "ALL" ? (
        <div className="bg-[#09090b] border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.05]">
          {filteredItems.map((item) => (
            <ShoppingListItemRow
              key={item.id}
              item={item}
              showCategory={false}
              isEditing={editingItemId === item.id}
              editingName={editingItemName}
              onStartEdit={() => handleStartEdit(item)}
              onChangeEditingName={setEditingItemName}
              onSaveEdit={() => handleSaveEdit(item.id)}
              onCancelEdit={() => setEditingItemId(null)}
              onToggle={() => handleToggle(item.id)}
              onDelete={() => handleDelete(item.id)}
              onOpenDetails={() => setDetailedModalItem(item)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          {groupedItems.map(([groupName, groupItems]) => {
            const groupBought = groupItems.filter((i) => i.purchased).length;
            const groupTotal = groupItems.length;

            return (
              <div
                key={groupName}
                className="bg-[#09090b] border border-white/[0.06] rounded-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#111113] border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-zinc-400" />
                    <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                      {groupName}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.06]">
                      {groupBought}/{groupTotal}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory(groupName);
                      setQuickCategory(groupName);
                    }}
                    className="text-[11px] font-medium text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Filtrar lista
                  </button>
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {groupItems.map((item) => (
                    <ShoppingListItemRow
                      key={item.id}
                      item={item}
                      showCategory={false}
                      isEditing={editingItemId === item.id}
                      editingName={editingItemName}
                      onStartEdit={() => handleStartEdit(item)}
                      onChangeEditingName={setEditingItemName}
                      onSaveEdit={() => handleSaveEdit(item.id)}
                      onCancelEdit={() => setEditingItemId(null)}
                      onToggle={() => handleToggle(item.id)}
                      onDelete={() => handleDelete(item.id)}
                      onOpenDetails={() => setDetailedModalItem(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: IMPORTAR ITENS EM LOTE */}
      {isBatchModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={() => setIsBatchModalOpen(false)}
            className="absolute inset-0 bg-black/80"
          />
          <div className="relative w-full max-w-lg bg-[#111113] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ClipboardList className="text-zinc-400" size={18} />
                <h3 className="text-base font-bold text-white">Importar Itens em Lote</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Cole vários itens de uma vez (um por linha). Eles serão adicionados automaticamente à categoria selecionada.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Nome da Categoria / Lista
              </label>
              <input
                type="text"
                value={batchCategory}
                onChange={(e) => setBatchCategory(e.target.value)}
                placeholder="Ex: Farmácia, Supermercado, Lembranças..."
                className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Itens (um por linha)
              </label>
              <textarea
                rows={8}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={`Protetor solar FPS 50\nAdaptador de tomada internacional\nGarrafas de água mineral`}
                className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/25 font-mono leading-relaxed resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-200 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBatchAdd}
                className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>Adicionar Itens</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DO ITEM */}
      {detailedModalItem && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={() => setDetailedModalItem(null)}
            className="absolute inset-0 bg-black/80"
          />
          <div className="relative w-full max-w-md bg-[#111113] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="text-zinc-400" size={16} />
                Detalhes do Item
              </h3>
              <button
                type="button"
                onClick={() => setDetailedModalItem(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDetailedModal} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  required
                  value={detailedModalItem.name}
                  onChange={(e) =>
                    setDetailedModalItem({ ...detailedModalItem, name: e.target.value })
                  }
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/25"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Categoria / Lista
                </label>
                <input
                  type="text"
                  value={detailedModalItem.category || ""}
                  onChange={(e) =>
                    setDetailedModalItem({ ...detailedModalItem, category: e.target.value })
                  }
                  placeholder="Ex: Supermercado, Farmácia..."
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/25"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Preço Estimado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={detailedModalItem.estimatedPrice ?? ""}
                    onChange={(e) =>
                      setDetailedModalItem({
                        ...detailedModalItem,
                        estimatedPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="0,00"
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/25"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Moeda
                  </label>
                  <select
                    value={detailedModalItem.currency || "BRL"}
                    onChange={(e) =>
                      setDetailedModalItem({ ...detailedModalItem, currency: e.target.value })
                    }
                    className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/25"
                  >
                    <option value="BRL">R$ (BRL)</option>
                    <option value="USD">$ (USD)</option>
                    <option value="EUR">€ (EUR)</option>
                    <option value="GBP">£ (GBP)</option>
                    <option value="JPY">¥ (JPY)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Loja / Estabelecimento
                </label>
                <input
                  type="text"
                  value={detailedModalItem.storeOrLocation || ""}
                  onChange={(e) =>
                    setDetailedModalItem({
                      ...detailedModalItem,
                      storeOrLocation: e.target.value,
                    })
                  }
                  placeholder="Ex: Supermercado Local, Farmácia Central..."
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white/25"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={detailedModalItem.notes || ""}
                  onChange={(e) =>
                    setDetailedModalItem({
                      ...detailedModalItem,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Marca, tamanho, sabor ou recomendações..."
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-white/25"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setDetailedModalItem(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-200 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1] rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface ShoppingListItemRowProps {
  item: ShoppingItem;
  showCategory?: boolean;
  isEditing: boolean;
  editingName: string;
  onStartEdit: () => void;
  onChangeEditingName: (name: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onOpenDetails: () => void;
}

function ShoppingListItemRow({
  item,
  showCategory = false,
  isEditing,
  editingName,
  onStartEdit,
  onChangeEditingName,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onDelete,
  onOpenDetails,
}: ShoppingListItemRowProps) {
  return (
    <div
      className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors ${
        item.purchased ? "bg-[#09090b] text-zinc-500" : "hover:bg-white/[0.02] text-zinc-200"
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 cursor-pointer transition-colors ${
            item.purchased ? "text-emerald-400" : "text-zinc-600 hover:text-zinc-300"
          }`}
          title={item.purchased ? "Marcar como pendente" : "Marcar como comprado"}
        >
          {item.purchased ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>

        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1 max-w-md">
            <input
              type="text"
              autoFocus
              value={editingName}
              onChange={(e) => onChangeEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit();
                if (e.key === "Escape") onCancelEdit();
              }}
              className="bg-[#111113] border border-white/25 rounded-lg px-2 py-1 text-xs text-white focus:outline-none w-full"
            />
            <button
              type="button"
              onClick={onSaveEdit}
              className="bg-zinc-100 text-zinc-950 p-1 rounded-lg hover:bg-white cursor-pointer"
            >
              <Check size={12} />
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-zinc-500 hover:text-white p-1 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
            <span
              onClick={onToggle}
              className={`text-xs sm:text-sm font-medium cursor-pointer select-none transition-colors ${
                item.purchased ? "line-through text-zinc-500" : "text-zinc-200 hover:text-white"
              }`}
            >
              {item.name}
            </span>

            {showCategory && item.category && item.category !== "Geral" && (
              <span className="text-[10px] font-medium text-zinc-400 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded shrink-0">
                {item.category}
              </span>
            )}

            {item.estimatedPrice !== undefined && item.estimatedPrice > 0 && (
              <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: item.currency || "BRL",
                }).format(item.estimatedPrice)}
              </span>
            )}

            {item.storeOrLocation && (
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
                <Store size={10} className="text-zinc-400" />
                {item.storeOrLocation}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onStartEdit}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors cursor-pointer"
          title="Editar nome"
        >
          <Edit3 size={13} />
        </button>

        <button
          type="button"
          onClick={onOpenDetails}
          className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
          title="Editar detalhes (preço, local, notas)"
        >
          <DollarSign size={13} />
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
          title="Excluir item"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
