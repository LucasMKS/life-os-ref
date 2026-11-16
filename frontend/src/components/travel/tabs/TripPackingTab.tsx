"use client";

import { useState, useMemo } from "react";
import { Luggage, Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { PackingItem } from "@/lib/types";
import { FilterPill, EmptyState } from "@/components/ui/page-shell";

interface TripPackingTabProps {
  items: PackingItem[];
  onSavePacking: (updated: PackingItem[]) => Promise<void>;
}

export function TripPackingTab({ items, onSavePacking }: TripPackingTabProps) {
  const [newItemText, setNewItemText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("CLOTHES");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const quickLuggageItems = [
    { text: "Protetor solar", category: "HYGIENE" },
    { text: "Adaptador de tomada", category: "ELECTRONICS" },
    { text: "Powerbank (Bateria portátil)", category: "ELECTRONICS" },
    { text: "Escova & pasta de dente", category: "HYGIENE" },
    { text: "Remédios de uso habitual", category: "MEDICINE" },
    { text: "Casaco / Agasalho", category: "CLOTHES" },
    { text: "Fone de ouvido", category: "ELECTRONICS" },
    { text: "Passaporte / RG", category: "DOCUMENTS" },
  ];

  const categories = [
    { id: "CLOTHES", label: "Roupas & Calçados" },
    { id: "HYGIENE", label: "Higiene & Cosméticos" },
    { id: "ELECTRONICS", label: "Eletrônicos & Cabos" },
    { id: "DOCUMENTS", label: "Documentos & Dinheiro" },
    { id: "MEDICINE", label: "Farmácia & Remédios" },
    { id: "OTHER", label: "Outros Acessórios" },
  ];

  const handleAddItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: PackingItem = {
      id: String(Date.now()),
      text: newItemText.trim(),
      category: selectedCategory as any,
      done: false,
    };

    await onSavePacking([...items, newItem]);
    setNewItemText("");
  };

  const handleAddQuick = async (item: { text: string; category: string }) => {
    if (items.some((i) => (i.text || "").toLowerCase() === item.text.toLowerCase())) return;

    const newItem: PackingItem = {
      id: String(Date.now()),
      text: item.text,
      category: item.category as any,
      done: false,
    };
    await onSavePacking([...items, newItem]);
  };

  const handleToggle = async (id: string) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, done: !i.done } : i
    );
    await onSavePacking(updated);
  };

  const handleDelete = async (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    await onSavePacking(updated);
  };

  const doneCount = items.filter((i) => i.done).length;
  const progressPercent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  const filteredItems = useMemo(() => {
    if (filterCategory === "ALL") return items;
    return items.filter((i) => i.category === filterCategory);
  }, [items, filterCategory]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Luggage className="text-zinc-400" size={18} />
          Mala & Bagagem
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Organize roupas, higiene, eletrônicos e documentos para a viagem.
        </p>
      </div>

      {/* Progress Card */}
      <div className="rounded-xl border border-white/[0.06] bg-[#09090b] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2 flex-wrap">
            <span>Itens na Mala</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-zinc-200 border border-white/[0.08]">
              {doneCount} de {items.length}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {items.length - doneCount === 0 && items.length > 0
              ? "Mala 100% pronta para viajar."
              : `Faltam ${items.length - doneCount} itens para guardar.`}
          </p>
        </div>

        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-mono font-semibold text-zinc-400">
            <span>Progresso</span>
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

      {/* Input Form */}
      <form
        onSubmit={handleAddItem}
        className="flex flex-col sm:flex-row gap-2 bg-[#09090b] border border-white/[0.06] p-3 rounded-xl"
      >
        <input
          type="text"
          placeholder="Adicionar item à mala (ex: Protetor solar, Carregador...)"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          className="flex-1 bg-[#111113] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-[#111113] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white/25 shrink-0"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={!newItemText.trim()}
          className="bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus size={14} strokeWidth={2.2} />
          <span>Adicionar</span>
        </button>
      </form>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mr-1">
          Sugestões rápidas:
        </span>
        {quickLuggageItems.map((item, idx) => {
          const exists = items.some(
            (i) => (i.text || "").toLowerCase() === item.text.toLowerCase()
          );
          return (
            <button
              key={idx}
              type="button"
              disabled={exists}
              onClick={() => handleAddQuick(item)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                exists
                  ? "bg-white/[0.02] border-transparent text-zinc-600 line-through cursor-not-allowed"
                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-zinc-300 hover:text-white"
              }`}
            >
              <span>{item.text}</span>
              {!exists && <Plus size={10} />}
            </button>
          );
        })}
      </div>

      {/* Filter by Category */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <FilterPill
          active={filterCategory === "ALL"}
          onClick={() => setFilterCategory("ALL")}
        >
          Todos ({items.length})
        </FilterPill>
        {categories.map((c) => {
          const count = items.filter((i) => i.category === c.id).length;
          return (
            <FilterPill
              key={c.id}
              active={filterCategory === c.id}
              onClick={() => setFilterCategory(c.id)}
            >
              <span>{c.label}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </FilterPill>
          );
        })}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Luggage size={24} />}
          title="Nenhum item nesta categoria"
          description="Adicione roupas e objetos acima para preparar sua mala com segurança."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredItems.map((item) => {
            const cat = categories.find((c) => c.id === item.category);

            return (
              <div
                key={item.id}
                className={`group flex items-center justify-between gap-2.5 p-3 rounded-xl border transition-colors ${
                  item.done
                    ? "bg-[#09090b] border-white/[0.04] opacity-60"
                    : "bg-[#09090b] border-white/[0.06] hover:border-white/[0.14]"
                }`}
              >
                <div
                  onClick={() => handleToggle(item.id)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <button
                    type="button"
                    className={`cursor-pointer transition-colors shrink-0 ${
                      item.done ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {item.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
                  </button>

                  <span
                    className={`text-xs truncate select-none ${
                      item.done ? "line-through text-zinc-500" : "text-zinc-200"
                    }`}
                  >
                    {item.text}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {cat && (
                    <span className="text-[10px] text-zinc-500 hidden sm:inline">
                      {cat.label.split(" ")[0]}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remover item"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
