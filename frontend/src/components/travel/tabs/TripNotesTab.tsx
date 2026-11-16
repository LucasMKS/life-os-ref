"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Save,
  Check,
  Copy,
  Sparkles,
  List,
  CheckSquare,
  Utensils,
  Phone,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface TripNotesTabProps {
  notes?: string;
  onSaveNotes: (notes: string) => Promise<void>;
}

export function TripNotesTab({ notes = "", onSaveNotes }: TripNotesTabProps) {
  const [content, setContent] = useState(notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasChanges) {
      setContent(notes || "");
    }
  }, [notes, hasChanges]);

  useEffect(() => {
    if (!hasChanges) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await onSaveNotes(content);
        setHasChanges(false);
      } catch {
        // Error handled by parent toast
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, hasChanges, onSaveNotes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleManualSave = async () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    try {
      setIsSaving(true);
      await onSaveNotes(content);
      setHasChanges(false);
      toast.success("Anotações salvas com sucesso!");
    } catch {
      toast.error("Não foi possível salvar as anotações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!content.trim()) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Anotações copiadas para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar.");
    }
  };

  const insertSnippet = (snippet: string) => {
    setContent((prev) => {
      const separator = prev.trim() ? "\n\n" : "";
      return prev + separator + snippet;
    });
    setHasChanges(true);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="text-zinc-400" size={18} />
            Anotações da Viagem
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Espaço livre para ideias, dicas locais, telefones úteis ou lembretes importantes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.08] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Copiar anotações"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? "Copiado" : "Copiar"}</span>
          </button>

          <button
            type="button"
            onClick={handleManualSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              hasChanges
                ? "bg-zinc-100 hover:bg-white text-zinc-950"
                : "bg-white/[0.04] text-zinc-400 border border-white/[0.06] cursor-default"
            }`}
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : hasChanges ? (
              <Save size={14} />
            ) : (
              <Check size={14} className="text-emerald-400" />
            )}
            <span>
              {isSaving ? "Salvando..." : hasChanges ? "Salvar Anotações" : "Salvo"}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Insert / Template Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-zinc-400">
        <span className="text-[11px] font-medium text-zinc-500 mr-1 flex items-center gap-1 shrink-0">
          <Sparkles size={12} /> Inserir modelo:
        </span>

        <button
          type="button"
          onClick={() =>
            insertSnippet("## Receita / Preparo\n- Ingrediente 1\n- Ingrediente 2\n- Modo de fazer:\n")
          }
          className="flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white px-2.5 py-1 rounded-lg border border-white/[0.06] transition-colors cursor-pointer shrink-0 text-[11px]"
        >
          <Utensils size={11} />
          Receita
        </button>

        <button
          type="button"
          onClick={() =>
            insertSnippet(
              "## Dicas & Recomendações Locais\n- Onde comer:\n- Melhor horário para visitar:\n- Atenção para:\n"
            )
          }
          className="flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white px-2.5 py-1 rounded-lg border border-white/[0.06] transition-colors cursor-pointer shrink-0 text-[11px]"
        >
          <Info size={11} />
          Dicas Locais
        </button>

        <button
          type="button"
          onClick={() =>
            insertSnippet(
              "## Contatos & Emergência\n- Hotel / Anfitrião:\n- Hospital / Farmácia mais próxima:\n- Seguro Viagem:\n"
            )
          }
          className="flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white px-2.5 py-1 rounded-lg border border-white/[0.06] transition-colors cursor-pointer shrink-0 text-[11px]"
        >
          <Phone size={11} />
          Contatos Úteis
        </button>

        <button
          type="button"
          onClick={() => insertSnippet("- ")}
          className="flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white px-2.5 py-1 rounded-lg border border-white/[0.06] transition-colors cursor-pointer shrink-0 text-[11px]"
        >
          <List size={11} />
          Marcador (-)
        </button>

        <button
          type="button"
          onClick={() => insertSnippet("[ ] ")}
          className="flex items-center gap-1 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white px-2.5 py-1 rounded-lg border border-white/[0.06] transition-colors cursor-pointer shrink-0 text-[11px]"
        >
          <CheckSquare size={11} />
          Check ([ ])
        </button>
      </div>

      {/* Editor Container */}
      <div className="relative rounded-2xl border border-white/[0.08] bg-[#09090b] overflow-hidden focus-within:border-white/25 transition-colors">
        <textarea
          value={content}
          onChange={handleChange}
          rows={15}
          placeholder="Escreva livremente qualquer detalhe sobre sua viagem..."
          className="w-full bg-transparent p-4 sm:p-5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-y min-h-[300px] leading-relaxed font-sans"
        />

        {/* Footer Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#111113] border-t border-white/[0.06] text-[11px] text-zinc-500">
          <div className="flex items-center gap-3 font-mono">
            <span>{wordCount} palavras</span>
            <span>·</span>
            <span>{charCount} caracteres</span>
          </div>

          <div className="flex items-center gap-2">
            {isSaving ? (
              <span className="text-zinc-300">Salvando alterações...</span>
            ) : hasChanges ? (
              <span className="text-zinc-400">Alterações pendentes (salvamento em 2s)</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check size={11} />
                Todas as alterações salvas
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
