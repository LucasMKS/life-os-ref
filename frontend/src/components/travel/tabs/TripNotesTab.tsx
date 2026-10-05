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

  // Sync internal state if prop changes and user has no unsaved changes
  useEffect(() => {
    if (!hasChanges) {
      setContent(notes || "");
    }
  }, [notes, hasChanges]);

  // Debounced auto-save
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
      } catch (e) {
        console.error("Erro no auto-save de anotações:", e);
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-amber-400" size={20} />
            Anotações da Viagem
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Espaço livre para ideias, dicas locais, receitas, telefones úteis ou lembretes importantes.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopy}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Copiar anotações"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? "Copiado!" : "Copiar"}</span>
          </button>

          <button
            onClick={handleManualSave}
            disabled={isSaving || !hasChanges}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hasChanges
                ? "bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20"
                : "bg-zinc-800/60 text-zinc-400 border border-white/5 cursor-default opacity-80"
            }`}
          >
            {isSaving ? (
              <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs text-zinc-400">
        <span className="text-[11px] font-semibold text-zinc-500 mr-1 flex items-center gap-1 shrink-0">
          <Sparkles size={12} className="text-amber-400" /> Inserir modelo:
        </span>

        <button
          type="button"
          onClick={() => insertSnippet("## 🍲 Receita / Preparo\n- Ingrediente 1\n- Ingrediente 2\n- Modo de fazer:\n")}
          className="flex items-center gap-1 bg-white/5 hover:bg-white/10 hover:text-white px-2.5 py-1 rounded-lg border border-white/5 transition-colors cursor-pointer shrink-0 text-[11px]"
        >
          <Utensils size={11} className="text-amber-400" />
          Receita
        </button>

        <button
          type="button"
          onClick={() => insertSnippet("## 💡 Dicas & Recomendações Locais\n- Onde comer:\n- Melhor horário para visitar:\n- Atenção para:\n")}
          className="flex items-center gap-1 bg-white/5 hover:bg-white/10 hover:text-white px-2.5 py-1 rounded-lg border border-white/5 transition-colors cursor-pointer shrink-0 text-[11px]"
        >
          <Info size={11} className="text-sky-400" />
          Dicas Locais
        </button>

        <button
          type="button"
          onClick={() => insertSnippet("## 📞 Contatos & Emergência\n- Hotel / Anfitrião:\n- Hospital / Farmácia mais próxima:\n- Seguro Viagem:\n")}
          className="flex items-center gap-1 bg-white/5 hover:bg-white/10 hover:text-white px-2.5 py-1 rounded-lg border border-white/5 transition-colors cursor-pointer shrink-0 text-[11px]"
        >
          <Phone size={11} className="text-emerald-400" />
          Contatos Úteis
        </button>

        <button
          type="button"
          onClick={() => insertSnippet("- ")}
          className="flex items-center gap-1 bg-white/5 hover:bg-white/10 hover:text-white px-2.5 py-1 rounded-lg border border-white/5 transition-colors cursor-pointer shrink-0 text-[11px]"
        >
          <List size={11} />
          Marcador (-)
        </button>

        <button
          type="button"
          onClick={() => insertSnippet("[ ] ")}
          className="flex items-center gap-1 bg-white/5 hover:bg-white/10 hover:text-white px-2.5 py-1 rounded-lg border border-white/5 transition-colors cursor-pointer shrink-0 text-[11px]"
        >
          <CheckSquare size={11} />
          Check ([ ])
        </button>
      </div>

      {/* Editor Container */}
      <div className="relative rounded-2xl border border-white/10 bg-zinc-950/60 shadow-inner overflow-hidden focus-within:border-amber-500/50 transition-colors">
        <textarea
          value={content}
          onChange={handleChange}
          rows={16}
          placeholder="Escreva livremente qualquer detalhe sobre sua viagem...

Exemplos:
• Ideias para o jantar ou receitas especiais
• Dicas de restaurantes passadas por amigos
• Senhas de Wi-Fi, códigos de acesso ou reservas
• O que não esquecer de perguntar no check-in"
          className="w-full bg-transparent p-4 sm:p-5 text-sm sm:text-base text-zinc-100 placeholder-zinc-600 focus:outline-none resize-y min-h-[320px] leading-relaxed font-sans"
        />

        {/* Footer Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900/60 border-t border-white/5 text-[11px] text-zinc-500">
          <div className="flex items-center gap-4">
            <span>{wordCount} palavras</span>
            <span>•</span>
            <span>{charCount} caracteres</span>
          </div>

          <div className="flex items-center gap-2">
            {isSaving ? (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Salvando alterações...
              </span>
            ) : hasChanges ? (
              <span className="text-zinc-400 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                Alterações pendentes (salvamento automático em 2s)
              </span>
            ) : (
              <span className="text-emerald-400/80 flex items-center gap-1">
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
