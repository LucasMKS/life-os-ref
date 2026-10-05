"use client";

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { toast } from "sonner";

interface TripShoppingTabProps {
  items: ShoppingItem[];
  onSaveShopping: (updated: ShoppingItem[]) => Promise<void>;
}

export function TripShoppingTab({ items, onSaveShopping }: TripShoppingTabProps) {
  // Navigation / active list filter
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

  // Derive unique categories/lists from items
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category && i.category.trim()) {
        set.add(i.category.trim());
      }
    });
    return Array.from(set);
  }, [items]);

  // Determine current effective category for adding
  const effectiveAddCategory = useMemo(() => {
    if (quickCategory) return quickCategory;
    if (activeCategory !== "ALL") return activeCategory;
    return categories.length > 0 ? categories[0] : "Geral";
  }, [quickCategory, activeCategory, categories]);

  // Stats
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
      if (i.estimatedPrice) totalCost += i.estimatedPrice;
    });

    return { total, purchased, pending, percent, totalCost };
  }, [items, activeCategory]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const itemCat = i.category?.trim() || "Geral";
      const matchesCategory =
        activeCategory === "ALL" || itemCat.toLowerCase() === activeCategory.toLowerCase();

      const matchesSearch =
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.storeOrLocation && i.storeOrLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        itemCat.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "ALL"
          ? true
          : filterStatus === "PURCHASED"
          ? i.purchased
          : !i.purchased;

      return matchesCategory && matchesSearch && matchesStatus;
    });
  }, [items, activeCategory, searchTerm, filterStatus]);

  // Grouped items by category for the "ALL" view
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

  // Quick Add Item
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
    if (quickInputRef.current) {
      quickInputRef.current.focus();
    }
  };

  // Batch Add Items (split lines)
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

  // Toggle purchased
  const handleToggle = async (id: string) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, purchased: !i.purchased } : i
    );
    await onSaveShopping(updated);
  };

  // Delete item
  const handleDelete = async (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    await onSaveShopping(updated);
  };

  // Start inline edit
  const handleStartEdit = (item: ShoppingItem) => {
    setEditingItemId(item.id);
    setEditingItemName(item.name);
  };

  // Save inline edit
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

  // Create new category/list
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setActiveCategory(name);
    setQuickCategory(name);
    setNewCategoryName("");
    setIsCreatingCategory(false);
    if (quickInputRef.current) {
      quickInputRef.current.focus();
    }
    toast.success(`Categoria "${name}" criada! Adicione os itens.`);
  };

  // Bulk actions
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

  // Detailed modal save
  const handleSaveDetailedModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedModalItem) return;

    const updated = items.map((i) =>
      i.id === detailedModalItem.id ? detailedModalItem : i
    );
    await onSaveShopping(updated);
    setDetailedModalItem(null);
    toast.success("Detalhes do item atualizados!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShoppingBag size={18} />
            </span>
            Lista de Compras
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Organize compras, lembrancinhas, itens de mercado e despesas para sua viagem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setBatchCategory(activeCategory !== "ALL" ? activeCategory : "Geral");
              setIsBatchModalOpen(true);
            }}
            className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 font-semibold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            title="Importar vários itens de uma vez"
          >
            <ClipboardList size={14} className="text-emerald-400" />
            <span>Importar em Lote</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
        <button
          onClick={() => {
            setActiveCategory("ALL");
            setQuickCategory("");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
            activeCategory === "ALL"
              ? "bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm"
              : "bg-zinc-900/60 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800"
          }`}
        >
          <span>Todas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15 text-inherit font-mono">
            {items.length}
          </span>
        </button>

        {categories.map((cat) => {
          const catItems = items.filter((i) => (i.category || "Geral").toLowerCase() === cat.toLowerCase());
          const catCount = catItems.length;
          const catBought = catItems.filter((i) => i.purchased).length;
          const isActive = activeCategory.toLowerCase() === cat.toLowerCase();

          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setQuickCategory(cat);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                isActive
                  ? "bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm"
                  : "bg-zinc-900/60 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-black/20 text-black" : "bg-white/10 text-zinc-300"
                }`}
              >
                {catBought}/{catCount}
              </span>
            </button>
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
              placeholder="Nova lista/categoria..."
              className="bg-zinc-900 border border-emerald-500/50 rounded-xl px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none w-44"
            />
            <button
              type="submit"
              className="bg-emerald-500 text-black p-1.5 rounded-xl hover:bg-emerald-400 cursor-pointer"
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
            onClick={() => setIsCreatingCategory(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-dashed border-white/15 transition-all whitespace-nowrap cursor-pointer shrink-0"
          >
            <Plus size={12} />
            <span>Nova Categoria</span>
          </button>
        )}
      </div>

      {/* Quick Add Bar */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-3 sm:p-3.5 shadow-md">
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Target List Selector */}
          <div className="relative shrink-0 sm:w-44">
            <select
              value={effectiveAddCategory}
              onChange={(e) => {
                setQuickCategory(e.target.value);
                if (activeCategory !== "ALL" && activeCategory !== e.target.value) {
                  setActiveCategory(e.target.value);
                }
              }}
              className="w-full appearance-none bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500 cursor-pointer"
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
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>

          {/* Quick Input */}
          <div className="relative flex-1">
            <input
              ref={quickInputRef}
              type="text"
              value={quickItemText}
              onChange={(e) => setQuickItemText(e.target.value)}
              placeholder={`Adicionar item em "${effectiveAddCategory}"... (ex: Protetor solar, Vinho regional, Lembrancinhas)`}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!quickItemText.trim()}
            className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Adicionar</span>
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[11px] text-zinc-500 px-1">
          <span className="flex items-center gap-1.5">
            <Sparkles size={11} className="text-emerald-400 shrink-0" />
            <span>Pressione <kbd className="bg-white/10 px-1 py-0.5 rounded text-zinc-300 font-mono text-[10px]">Enter</kbd> para salvar e continuar adicionando.</span>
          </span>
          {stats.totalCost > 0 && (
            <span className="font-mono text-zinc-400 font-semibold">
              Total estimado: <span className="text-emerald-400">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalCost)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Overview, Filters and Bulk Actions Toolbar */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/30 p-3.5 space-y-3">
        {/* Progress & Quick Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-zinc-400">
                {activeCategory === "ALL" ? "Progresso Geral" : `Progresso em ${activeCategory}`}
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {stats.purchased}/{stats.total} ({stats.percent}%)
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => handleMarkAllPurchased(true)}
              disabled={stats.pending === 0}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
              title="Marcar todos como comprados"
            >
              <CheckCheck size={12} className="text-emerald-400" />
              <span>Marcar todos</span>
            </button>

            <button
              onClick={() => handleMarkAllPurchased(false)}
              disabled={stats.purchased === 0}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
              title="Desmarcar todos"
            >
              <RotateCcw size={12} />
              <span>Desmarcar todos</span>
            </button>

            {stats.purchased > 0 && (
              <button
                onClick={handleClearPurchased}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer transition-colors"
                title="Remover itens comprados"
              >
                <Trash2 size={12} />
                <span>Limpar comprados ({stats.purchased})</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-white/5">
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar item, categoria ou loja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950/80 border border-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === "ALL"
                  ? "bg-zinc-800 text-white font-bold"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus("PENDING")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === "PENDING"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              A Comprar ({stats.pending})
            </button>
            <button
              onClick={() => setFilterStatus("PURCHASED")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === "PURCHASED"
                  ? "bg-zinc-700/50 text-zinc-200 border border-zinc-600/30 font-bold"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              Comprados ({stats.purchased})
            </button>
          </div>
        </div>
      </div>

      {/* Shopping Checklist Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10 max-w-md mx-auto">
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <ShoppingBag size={20} />
          </div>
          <h4 className="text-sm font-bold text-zinc-300">Nenhum item encontrado</h4>
          <p className="text-zinc-500 text-xs mt-1">
            {items.length === 0
              ? "Adicione itens na barra acima ou use 'Importar em Lote' para colar sua lista."
              : "Nenhum item corresponde à busca ou filtros atuais."}
          </p>
        </div>
      ) : activeCategory !== "ALL" ? (
        /* Single Active Category View */
        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5">
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
        /* Grouped By Category View */
        <div className="space-y-4">
          {groupedItems.map(([groupName, groupItems]) => {
            const groupBought = groupItems.filter((i) => i.purchased).length;
            const groupTotal = groupItems.length;

            return (
              <div
                key={groupName}
                className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden"
              >
                {/* Group Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-emerald-400" />
                    <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                      {groupName}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      {groupBought}/{groupTotal}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveCategory(groupName);
                      setQuickCategory(groupName);
                    }}
                    className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    Ver somente esta lista
                  </button>
                </div>

                {/* Group Items */}
                <div className="divide-y divide-white/5">
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

      {/* ========================================================
         MODAL: IMPORTAR ITENS EM LOTE
         ======================================================== */}
      <AnimatePresence>
        {isBatchModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBatchModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[#0c0c12] border border-white/10 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-emerald-400" size={18} />
                  <h3 className="text-base font-bold text-white">
                    Importar Itens em Lote
                  </h3>
                </div>
                <button
                  onClick={() => setIsBatchModalOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Cole vários itens de uma vez (um por linha). Eles serão adicionados automaticamente à categoria selecionada.
              </p>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nome da Categoria / Lista:
                </label>
                <input
                  type="text"
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  placeholder="Ex: Farmácia, Supermercado, Lembranças..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Itens (um por linha):
                </label>
                <textarea
                  rows={8}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={`Protetor solar FPS 50\nAdaptador de tomada internacional\nGarrafas de água mineral\nSnacks para viagem`}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleBatchAdd}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <Plus size={15} />
                  <span>Adicionar Itens</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
         MODAL: DETALHES DO ITEM (PREÇO, LOJA, NOTAS)
         ======================================================== */}
      <AnimatePresence>
        {detailedModalItem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailedModalItem(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-[#0c0c12] border border-white/10 rounded-3xl p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="text-emerald-400" size={17} />
                  Detalhes do Item
                </h3>
                <button
                  onClick={() => setDetailedModalItem(null)}
                  className="text-zinc-500 hover:text-white p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveDetailedModal} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Nome do Item *
                  </label>
                  <input
                    type="text"
                    required
                    value={detailedModalItem.name}
                    onChange={(e) =>
                      setDetailedModalItem({ ...detailedModalItem, name: e.target.value })
                    }
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Categoria / Lista
                  </label>
                  <input
                    type="text"
                    value={detailedModalItem.category || ""}
                    onChange={(e) =>
                      setDetailedModalItem({ ...detailedModalItem, category: e.target.value })
                    }
                    placeholder="Ex: Supermercado, Farmácia..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Preço Estimado
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={detailedModalItem.estimatedPrice || ""}
                      onChange={(e) =>
                        setDetailedModalItem({
                          ...detailedModalItem,
                          estimatedPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="0,00"
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Moeda
                    </label>
                    <select
                      value={detailedModalItem.currency || "BRL"}
                      onChange={(e) =>
                        setDetailedModalItem({ ...detailedModalItem, currency: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Loja / Estabelecimento / Local
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
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
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
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setDetailedModalItem(null)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-white/5 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    Salvar
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

// Sub-component: Shopping List Row with Checklist UX
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
        item.purchased
          ? "bg-zinc-950/40 text-zinc-500"
          : "hover:bg-white/[0.02] text-zinc-200"
      }`}
    >
      {/* Left side: Checkbox + Name + Details */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={onToggle}
          className={`shrink-0 cursor-pointer transition-transform active:scale-90 ${
            item.purchased
              ? "text-emerald-400"
              : "text-zinc-600 hover:text-emerald-400"
          }`}
          title={item.purchased ? "Marcar como pendente" : "Marcar como comprado"}
        >
          {item.purchased ? (
            <CheckCircle2 size={18} className="fill-emerald-500/20" />
          ) : (
            <Circle size={18} />
          )}
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
              className="bg-zinc-950 border border-emerald-500 rounded-lg px-2 py-1 text-xs text-white focus:outline-none w-full"
            />
            <button
              onClick={onSaveEdit}
              className="bg-emerald-500 text-black p-1 rounded-lg hover:bg-emerald-400 cursor-pointer"
            >
              <Check size={12} />
            </button>
            <button
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
              className={`text-xs sm:text-sm font-medium cursor-pointer select-none transition-all ${
                item.purchased
                  ? "line-through text-zinc-500"
                  : "text-zinc-200 hover:text-emerald-300"
              }`}
            >
              {item.name}
            </span>

            {showCategory && item.category && item.category !== "Geral" && (
              <span className="text-[10px] font-medium text-zinc-400 bg-white/5 border border-white/5 px-2 py-0.2 rounded shrink-0">
                {item.category}
              </span>
            )}

            {item.estimatedPrice !== undefined && item.estimatedPrice > 0 && (
              <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: item.currency || "BRL",
                }).format(item.estimatedPrice)}
              </span>
            )}

            {item.storeOrLocation && (
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 bg-white/5 px-1.5 py-0.2 rounded shrink-0">
                <Store size={10} className="text-emerald-400" />
                {item.storeOrLocation}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={onStartEdit}
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          title="Editar nome"
        >
          <Edit3 size={13} />
        </button>

        <button
          onClick={onOpenDetails}
          className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
          title="Editar detalhes (preço, local, notas)"
        >
          <DollarSign size={13} />
        </button>

        <button
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
