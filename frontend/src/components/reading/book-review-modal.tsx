"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readingApi } from "@/lib/api";
import { X, Star, Save, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface BookReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: any | null;
}

export function BookReviewModal({
  isOpen,
  onClose,
  book,
}: BookReviewModalProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const starsContainerRef = useRef<HTMLDivElement>(null);
  const [review, setReview] = useState("");

  useEffect(() => {
    if (book) {
      // eslint-disable-next-line
      setRating(book.rating || 0);
      setReview(book.review || "");
    }
  }, [book]);

  const rateMutation = useMutation({
    mutationFn: readingApi.rateBook,
    onSuccess: () => {
      toast.success("Avaliação salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["reading-library"] });
      onClose();
    },
    onError: () => {
      toast.error("Erro ao salvar avaliação.");
    },
  });

  const handleTouchRating = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target) {
      const btn = target.closest("[data-rating-value]");
      if (btn) {
        const val = parseFloat(btn.getAttribute("data-rating-value") || "0");
        if (val > 0) {
          setHoveredRating(val);
          return;
        }
      }
    }

    if (starsContainerRef.current) {
      const rect = starsContainerRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const clampedX = Math.max(0, Math.min(rect.width, x));
      const starWidth = rect.width / 5;
      const starIndex = Math.min(5, Math.floor(clampedX / starWidth) + 1);
      const offsetInStar = (clampedX % starWidth) / starWidth;
      const calculated = offsetInStar < 0.5 ? starIndex - 0.5 : starIndex;
      const safeRating = Math.max(0.5, Math.min(5.0, calculated));
      setHoveredRating(safeRating);
    }
  };

  const handleTouchEnd = () => {
    setHoveredRating((currentHover) => {
      if (currentHover > 0) {
        setRating(currentHover);
      }
      return 0;
    });
  };

  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Glow Superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Cabeçalho */}
        <div className="flex items-start justify-between p-6 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-16 rounded-md overflow-hidden shrink-0 border border-white/10 shadow-md">
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white line-clamp-1">
                {book.title}
              </h2>
              <p className="text-xs text-zinc-400">{book.author}</p>
              <div className="flex items-center gap-1 mt-1 text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                <BookOpen className="w-3 h-3" /> Finalizado
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo: Estrelas e Resenha */}
        <div className="p-6 flex flex-col gap-6 relative z-10">
          {/* Estrelas Flexíveis (0.5 a 5.0) */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                Sua Nota
              </span>
              <span className="text-amber-500 font-mono font-bold text-lg leading-none">
                {(hoveredRating > 0 ? hoveredRating : rating).toFixed(1)}
              </span>
            </div>

            <div
              ref={starsContainerRef}
              className="flex items-center gap-1 touch-none"
              onTouchStart={handleTouchRating}
              onTouchMove={handleTouchRating}
              onTouchEnd={handleTouchEnd}
              onMouseLeave={() => setHoveredRating(0)}
            >
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const currentDisplayRating =
                  hoveredRating > 0 ? hoveredRating : rating;

                let fillPercentage = 0;
                if (currentDisplayRating >= starIndex) {
                  fillPercentage = 100;
                } else if (currentDisplayRating >= starIndex - 0.5) {
                  fillPercentage = 50;
                }

                const leftRating = starIndex - 0.5;
                const rightRating = starIndex;

                return (
                  <div
                    key={starIndex}
                    className="relative p-2 sm:p-1 select-none transition-transform hover:scale-110 touch-manipulation"
                  >
                    {/* Estrela de Fundo */}
                    <Star className="w-9 h-9 sm:w-8 sm:h-8 text-zinc-700 pointer-events-none" />

                    {/* Estrela Sobreposta  */}
                    <div
                      className="absolute top-2 left-2 sm:top-1 sm:left-1 overflow-hidden pointer-events-none transition-all duration-75"
                      style={{ width: `${fillPercentage}%` }}
                    >
                      <Star className="w-9 h-9 sm:w-8 sm:h-8 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    </div>

                    {/* Metade Esquerda (ex: 4.5) */}
                    <button
                      type="button"
                      data-rating-value={leftRating}
                      aria-label={`${leftRating} estrelas`}
                      onClick={() => {
                        setRating(leftRating);
                        setHoveredRating(0);
                      }}
                      onMouseEnter={() => setHoveredRating(leftRating)}
                      className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
                    />

                    {/* Metade Direita (ex: 5.0) */}
                    <button
                      type="button"
                      data-rating-value={rightRating}
                      aria-label={`${rightRating} estrelas`}
                      onClick={() => {
                        setRating(rightRating);
                        setHoveredRating(0);
                      }}
                      onMouseEnter={() => setHoveredRating(rightRating)}
                      className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>

            {/* Atalhos rápidos */}
            <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
              {[1, 2, 3, 3.5, 4, 4.5, 5].map((val) => {
                const activeRating = hoveredRating > 0 ? hoveredRating : rating;
                const isSelected = activeRating === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setRating(val);
                      setHoveredRating(0);
                    }}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md border transition-all ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {val.toFixed(1)} ★
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resenha */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest px-1">
              O que achou? (Opcional)
            </span>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Escreva suas impressões sobre a história..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors shadow-inner resize-none h-32 scrollbar-thin"
            />
          </div>

          {/* Botão de Salvar */}
          <button
            onClick={() => {
              const finalRating = hoveredRating > 0 ? hoveredRating : rating;
              rateMutation.mutate({ bookId: book.id, rating: finalRating, review });
            }}
            disabled={rateMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-black py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {rateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Avaliação
          </button>
        </div>
      </div>
    </div>
  );
}
