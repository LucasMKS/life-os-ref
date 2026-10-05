"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Luggage,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Shirt,
  Sparkles,
  Zap,
} from "lucide-react";
import { PackingItem } from "@/lib/types";

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
    { id: "CLOTHES", label: "Roupas & Calçados", icon: "👕" },
    { id: "HYGIENE", label: "Higiene & Cosméticos", icon: "🧴" },
    { id: "ELECTRONICS", label: "Eletrônicos & Cabos", icon: "🔌" },
    { id: "DOCUMENTS", label: "Documentos & Dinheiro", icon: "🛂" },
    { id: "MEDICINE", label: "Farmácia & Remédios", icon: "💊" },
    { id: "OTHER", label: "Outros Acessórios", icon: "🎒" },
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
    if (items.some((i) => i.text.toLowerCase() === item.text.toLowerCase())) return;

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Luggage className="text-sky-400" size={20} />
          Mala & Bagagem (Packing List)
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Não esqueça nada importante: organize roupas, higiene, eletrônicos e documentos para a viagem.
        </p>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>Itens na Mala</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {doneCount} de {items.length} colocados na mala
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {items.length - doneCount === 0 && items.length > 0
              ? "Mala 100% pronta para viajar! 🧳✈️"
              : `Faltam ${items.length - doneCount} itens para guardar.`}
          </p>
        </div>

        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-mono font-bold text-zinc-400">
            <span>Progresso</span>
            <span className="text-sky-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2 bg-zinc-900/40 border border-white/5 p-3 rounded-2xl">
        <input
          type="text"
          placeholder="Adicionar item à mala (ex: Protetor solar, Carregador...)"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 shrink-0"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={!newItemText.trim()}
          className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Adicionar</span>
        </button>
      </form>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
          Sugestões rápidas:
        </span>
        {quickLuggageItems.map((item, idx) => {
          const exists = items.some((i) => i.text.toLowerCase() === item.text.toLowerCase());
          return (
            <button
              key={idx}
              disabled={exists}
              onClick={() => handleAddQuick(item)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                exists
                  ? "bg-white/5 border-transparent text-zinc-600 line-through cursor-not-allowed"
                  : "bg-white/5 hover:bg-sky-500/15 border-white/5 hover:border-sky-500/30 text-zinc-300 hover:text-white"
              }`}
            >
              <span>{item.text}</span>
              {!exists && <Plus size={10} className="text-sky-400" />}
            </button>
          );
        })}
      </div>

      {/* Filter by Category */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCategory("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filterCategory === "ALL"
              ? "bg-sky-500 text-black font-bold"
              : "bg-white/5 text-zinc-400 hover:text-white"
          }`}
        >
          Todos ({items.length})
        </button>
        {categories.map((c) => {
          const count = items.filter((i) => i.category === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                filterCategory === c.id
                  ? "bg-sky-500 text-black font-bold"
                  : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-900/20 rounded-3xl border border-dashed border-white/10 max-w-lg mx-auto">
          <Luggage className="text-zinc-500 w-10 h-10 mx-auto mb-3 opacity-60" />
          <h4 className="text-sm font-bold text-zinc-300">Nenhum item nesta categoria</h4>
          <p className="text-zinc-500 text-xs mt-1">
            Adicione roupas e objetos acima para preparar sua mala com segurança.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredItems.map((item, idx) => {
            const cat = categories.find((c) => c.id === item.category);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.015 }}
                className={`group flex items-center justify-between gap-2.5 p-3 rounded-xl border transition-all ${
                  item.done
                    ? "bg-zinc-950/40 border-white/5 opacity-60"
                    : "bg-zinc-900/40 border-white/10 hover:border-sky-500/20 hover:bg-zinc-900/60"
                }`}
              >
                <div
                  onClick={() => handleToggle(item.id)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <button
                    type="button"
                    className={`cursor-pointer transition-colors shrink-0 ${
                      item.done ? "text-sky-400" : "text-zinc-500 hover:text-sky-400"
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

                <div className="flex items-center gap-1 shrink-0">
                  {cat && (
                    <span className="text-xs" title={cat.label}>
                      {cat.icon}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remover item"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
