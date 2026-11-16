"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { readingApi } from "@/lib/api";
import { SmartBookCover } from "@/components/reading/smart-book-cover";
import { X, Star, Save, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface BookReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    id: string;
    title: string;
    author?: string;
    coverUrl?: string | null;
    rating?: number;
    review?: string;
  } | null;
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
      setRating(typeof book.rating === "number" ? book.rating : 0);
      setReview(typeof book.review === "string" ? book.review : "");
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#111113] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 border border-white/[0.08] bg-zinc-900">
              <SmartBookCover
                url={book.coverUrl}
                title={book.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h2
                id="review-modal-title"
                className="text-base font-semibold text-white truncate"
              >
                {book.title}
              </h2>
              <p className="text-xs text-zinc-400 truncate">
                {book.author || "Autor desconhecido"}
              </p>
              <div className="inline-flex items-center gap-1 mt-1.5 text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
                <BookOpen className="w-3 h-3" /> Finalizado
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-2 text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Sua Nota
              </span>
              <span className="text-zinc-100 font-mono font-bold text-lg leading-none tabular-nums">
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
                    className="relative p-2 sm:p-1 select-none touch-manipulation"
                  >
                    <Star className="w-9 h-9 sm:w-8 sm:h-8 text-zinc-700 pointer-events-none" />

                    <div
                      className="absolute top-2 left-2 sm:top-1 sm:left-1 overflow-hidden pointer-events-none transition-all duration-75"
                      style={{ width: `${fillPercentage}%` }}
                    >
                      <Star className="w-9 h-9 sm:w-8 sm:h-8 fill-amber-400 text-amber-400" />
                    </div>

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

            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
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
                    className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                      isSelected
                        ? "bg-white/[0.12] border-white/20 text-white"
                        : "bg-white/[0.04] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08]"
                    }`}
                  >
                    {val.toFixed(1)} ★
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              O que achou? (Opcional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Escreva suas impressões sobre a história..."
              className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl p-3.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/25 transition-colors resize-none h-28"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const finalRating = hoveredRating > 0 ? hoveredRating : rating;
              rateMutation.mutate({
                bookId: book.id,
                rating: finalRating,
                review: review.trim(),
              });
            }}
            disabled={rateMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
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
