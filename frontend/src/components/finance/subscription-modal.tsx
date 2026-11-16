"use client";

import { useEffect, useState } from "react";
import { Edit3, Loader2, PlusCircle, X } from "lucide-react";
import { toast } from "sonner";
import {
  ALLOWED_CATEGORIES,
  ALLOWED_CYCLES,
  PRESET_COLORS,
  parseSafeDate,
  sanitizeHexColor,
  type SubscriptionItem,
  type SubscriptionPayload,
} from "./types";

interface SubscriptionModalProps {
  isOpen: boolean;
  editingSubscription: SubscriptionItem | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (payload: SubscriptionPayload) => void;
}

const MAX_PRICE = 1_000_000;

export default function SubscriptionModal({
  isOpen,
  editingSubscription,
  isPending,
  onClose,
  onSubmit,
}: SubscriptionModalProps) {
  const [name, setName] = useState(editingSubscription?.name ?? "");
  const [category, setCategory] = useState<string>(
    editingSubscription?.category || ALLOWED_CATEGORIES[0],
  );
  const [price, setPrice] = useState(
    editingSubscription && editingSubscription.price > 0
      ? editingSubscription.price.toFixed(2)
      : "",
  );
  const [billingCycle, setBillingCycle] = useState<string>(
    editingSubscription?.billingCycle || ALLOWED_CYCLES[0],
  );
  const [nextPayment, setNextPayment] = useState(
    editingSubscription?.nextPayment || "",
  );
  const [color, setColor] = useState<string>(
    editingSubscription
      ? sanitizeHexColor(editingSubscription.color)
      : PRESET_COLORS[0],
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 80) {
      toast.error("Informe um nome válido para o serviço (máx. 80 caracteres).");
      return;
    }

    const normalizedPriceStr = price.trim().replace(",", ".");
    const parsedPrice = Number(normalizedPriceStr);
    if (
      !normalizedPriceStr ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice <= 0 ||
      parsedPrice > MAX_PRICE
    ) {
      toast.error(
        `Informe um valor válido entre R$ 0,01 e R$ ${MAX_PRICE.toLocaleString("pt-BR")}.`,
      );
      return;
    }

    if (!parseSafeDate(nextPayment)) {
      toast.error("Informe uma data de vencimento válida.");
      return;
    }

    const safePrice = Math.round(parsedPrice * 100) / 100;
    const safeCategory =
      ALLOWED_CATEGORIES.find((c) => c === category) ?? "Outros";
    const safeCycle =
      ALLOWED_CYCLES.find((c) => c === billingCycle) ?? "Mensal";

    onSubmit({
      ...(editingSubscription ? { id: editingSubscription.id } : {}),
      name: trimmedName,
      category: safeCategory,
      price: safePrice,
      billingCycle: safeCycle,
      nextPayment: nextPayment.trim(),
      color: sanitizeHexColor(color),
    });
  };

  const inputClass =
    "w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/25 transition-colors";
  const labelClass =
    "block text-[11px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finance-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-white/[0.06]">
          <h3
            id="finance-modal-title"
            className="text-base sm:text-lg font-semibold text-white flex items-center gap-2"
          >
            {editingSubscription ? (
              <Edit3 className="w-4 h-4 text-zinc-400" />
            ) : (
              <PlusCircle className="w-4 h-4 text-zinc-400" />
            )}
            {editingSubscription ? "Editar assinatura" : "Nova assinatura"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sub-name" className={labelClass}>
              Serviço
            </label>
            <input
              id="sub-name"
              type="text"
              maxLength={80}
              required
              placeholder="Ex: Netflix, AWS, Spotify..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sub-price" className={labelClass}>
                Valor (R$)
              </label>
              <input
                id="sub-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                max={MAX_PRICE}
                required
                placeholder="29,90"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`${inputClass} tabular-nums`}
              />
            </div>

            <div>
              <label htmlFor="sub-cycle" className={labelClass}>
                Ciclo de cobrança
              </label>
              <select
                id="sub-cycle"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="Mensal">Mensal</option>
                <option value="Anual dividida">Anual (12x no mês)</option>
                <option value="Anual integral">Anual (à vista)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sub-category" className={labelClass}>
                Categoria
              </label>
              <select
                id="sub-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                {ALLOWED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sub-next-payment" className={labelClass}>
                Próximo vencimento
              </label>
              <input
                id="sub-next-payment"
                type="date"
                required
                value={nextPayment}
                onChange={(e) => setNextPayment(e.target.value)}
                className={`${inputClass} cursor-pointer`}
                style={{ colorScheme: "dark" }}
              />
            </div>
          </div>

          <div>
            <span className={labelClass}>Cor identificadora</span>
            <div className="flex items-center justify-between gap-2 bg-[#09090b] p-2.5 rounded-xl border border-white/[0.06]">
              {PRESET_COLORS.map((preset) => {
                const selected = color.toLowerCase() === preset.toLowerCase();
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-label={`Selecionar cor ${preset}`}
                    aria-pressed={selected}
                    onClick={() => setColor(preset)}
                    className={`w-7 h-7 rounded-full transition-transform border border-white/15 ${
                      selected
                        ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#09090b]"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset }}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-2.5 px-4 bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 px-4 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingSubscription ? (
                "Salvar alterações"
              ) : (
                "Adicionar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
