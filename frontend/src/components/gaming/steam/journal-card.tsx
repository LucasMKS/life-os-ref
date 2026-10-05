"use client";

import { useState } from "react";
import { Star, Trash2, Pencil, Check, X } from "lucide-react";

export const STATUS_LABELS: Record<string, string> = {
  PLAYING: "Jogando",
  COMPLETED: "Concluído",
  ABANDONED: "Abandonado",
  ON_HOLD: "Em pausa",
};

interface JournalCardProps {
  game: any;
  onUpdate: (patch: { rating?: number; generalComments?: string; status?: string }) => void;
  onDelete: () => void;
}

export function JournalCard({ game, onUpdate, onDelete }: JournalCardProps) {
  const [editingComment, setEditingComment] = useState(false);
  const [comment, setComment] = useState(game.generalComments ?? "");
  const [hoverRating, setHoverRating] = useState(0);

  const statusColor =
    game.status === "COMPLETED"
      ? "bg-green-500/10 text-green-400"
      : game.status === "ABANDONED"
        ? "bg-red-500/10 text-red-400"
        : game.status === "ON_HOLD"
          ? "bg-yellow-500/10 text-yellow-400"
          : "bg-blue-500/10 text-blue-400";

  return (
    <div className="bg-[#121214]/60 border border-white/5 rounded-3xl p-5 hover:border-white/10 transition-colors flex flex-col gap-4">
      <div className="flex gap-4">
        <img
          src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/header.jpg`}
          className="w-28 h-16 rounded-xl object-cover shadow-lg shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h5 className="text-base font-bold text-white leading-tight truncate">
              {game.name}
            </h5>
            <button
              onClick={onDelete}
              title="Remover do diário"
              className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => onUpdate({ status: value })}
                className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase transition-colors ${
                  game.status === value
                    ? statusColor
                    : "bg-white/5 text-zinc-600 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onUpdate({ rating: star })}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                star <= (hoverRating || game.rating || 0)
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-zinc-700"
              }`}
            />
          </button>
        ))}
        {game.rating > 0 && (
          <span className="text-[10px] text-zinc-500 ml-1">{game.rating}/5</span>
        )}
      </div>

      {editingComment ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Adicione um comentário..."
            className="w-full bg-black/40 border border-white/10 focus:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none resize-none transition-colors"
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                onUpdate({ generalComments: comment });
                setEditingComment(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors"
            >
              <Check className="w-3 h-3" /> Salvar
            </button>
            <button
              onClick={() => {
                setComment(game.generalComments ?? "");
                setEditingComment(false);
              }}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : game.generalComments ? (
        <button
          onClick={() => setEditingComment(true)}
          className="flex items-start gap-2 w-full text-left bg-zinc-800/50 hover:bg-zinc-800/70 p-3 rounded-xl border border-zinc-600/30 hover:border-zinc-500/50 transition-colors group"
        >
          <Pencil className="w-3 h-3 text-zinc-400 group-hover:text-zinc-200 mt-0.5 shrink-0 transition-colors" />
          <p className="text-xs text-zinc-200 group-hover:text-white line-clamp-3 transition-colors leading-relaxed">
            {game.generalComments}
          </p>
        </button>
      ) : (
        <button
          onClick={() => setEditingComment(true)}
          className="flex items-start gap-2 w-full text-left bg-black/20 hover:bg-black/30 p-3 rounded-xl border border-dashed border-white/10 hover:border-white/20 transition-colors group"
        >
          <Pencil className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 mt-0.5 shrink-0 transition-colors" />
          <p className="text-xs text-zinc-600 group-hover:text-zinc-500 transition-colors">
            Clique para adicionar um comentário...
          </p>
        </button>
      )}
    </div>
  );
}
