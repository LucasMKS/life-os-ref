"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckCircle2,
  Bookmark,
  PlusCircle,
  Search,
  Loader2,
  X,
  Edit2,
  Trash2,
  Library,
  Star,
} from "lucide-react";
import { readingApi } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { ReadingStatsSection } from "@/components/reading/reading-stats-section";

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number;
  readPages: number;
  status: "READING" | "READ" | "WANT_TO_READ";
  genres: string[];
  startedAt?: string;
  finishedAt?: string;
  rating?: number;
  review?: string;
}

const ReadingSkeleton = () => (
  <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden animate-pulse flex flex-col h-full">
    <div className="h-40 md:h-48 w-full bg-white/5 shrink-0"></div>
    <div className="p-4 md:p-6 flex-grow flex flex-col justify-end gap-3">
      <div className="h-4 w-full bg-white/5 rounded"></div>
      <div className="h-2 w-full bg-white/10 rounded-full"></div>
      <div className="h-10 w-full bg-white/5 rounded-xl"></div>
    </div>
  </div>
);

const SmartBookCover = ({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) => {
  const [src, setSrc] = useState(url);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    let isMounted = true;

    // Se não for uma URL do Google Books, não tentamos o "enhance"
    if (!url.includes("google.com")) {
      // eslint-disable-next-line
      setSrc(url);
      return;
    }

    const tryZoom = async (zoomLevel: number): Promise<boolean> => {
      return new Promise((resolve) => {
        const testUrl = url.includes("zoom=")
          ? url.replace(/zoom=\d/, `zoom=${zoomLevel}`)
          : `${url}&zoom=${zoomLevel}`;

        const img = new window.Image();
        img.onload = () => {
          if (!isMounted) return;
          
          // Detecção de placeholder do Google Books:
          // 1. Dimensões específicas (575x750 é comum em zoom alto, 128x128 em zoom baixo)
          // 2. Imagens muito pequenas ou quadradas costumam ser o "not available"
          const isPlaceholder = 
            (img.naturalWidth === 575 && img.naturalHeight === 750) ||
            (img.naturalWidth === 128 && img.naturalHeight === 128) ||
            (img.naturalWidth <= 2 && img.naturalHeight <= 2);

          // Se for placeholder, não resolvemos como true para tentar o próximo zoom
          if (isPlaceholder) {
            resolve(false);
          } else {
            setSrc(testUrl);
            resolve(true);
          }
        };
        img.onerror = () => resolve(false);
        img.src = testUrl;
      });
    };

    const enhanceProgressively = async () => {
      // Tenta Zoom 3 (Alta Qualidade)
      const success3 = await tryZoom(3);
      if (success3 || !isMounted) return;

      // Tenta Zoom 2 (Média Qualidade - já é o que o backend manda)
      const success2 = await tryZoom(2);
      if (success2 || !isMounted) return;

      // Tenta Zoom 1 (Thumbnail padrão - mais garantido)
      const success1 = await tryZoom(1);
      if (success1 || !isMounted) return;
      
      // Se nada funcionar, mantém a URL original mas marca erro para mostrar o ícone se necessário
      setError(true);
    };

    enhanceProgressively();

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (error || !src) {
    return (
      <div className={`${className} flex items-center justify-center bg-zinc-900`}>
        <BookOpen className="w-8 h-8 text-zinc-800" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      className={className}
      onError={() => setError(true)}
    />
  );
};

export function ReadingDashboard() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"PROGRESS" | "TOTAL" | null>(
    null,
  );
  const [inlineValue, setInlineValue] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: library = [], isLoading: loadingLibrary } = useQuery<Book[]>({
    queryKey: ["reading-library"],
    queryFn: readingApi.getLibrary,
    staleTime: 1000 * 60 * 5,
  });

  const { data: searchResults = [], isFetching: isSearching } = useQuery<
    Book[]
  >({
    queryKey: ["reading-search", debouncedSearch],
    queryFn: () => readingApi.searchBooks(debouncedSearch),
    enabled: debouncedSearch.trim().length >= 3,
  });

  const addBookMutation = useMutation({
    mutationFn: readingApi.addBook,
    onSuccess: () => {
      toast.success("Livro adicionado à estante!");
      queryClient.invalidateQueries({ queryKey: ["reading-library"] });
      setSearchQuery("");
    },
    onError: () => toast.error("Erro ao adicionar o livro."),
  });

  const updateProgressMutation = useMutation({
    mutationFn: readingApi.updateProgress,
    onSuccess: () => {
      toast.success("Progresso atualizado!");
      queryClient.invalidateQueries({ queryKey: ["reading-library"] });
      cancelEdit();
    },
    onError: () => toast.error("Erro ao salvar as informações."),
  });

  const deleteBookMutation = useMutation({
    mutationFn: readingApi.deleteBook,
    onSuccess: () => {
      toast.success("Livro removido da estante!");
      queryClient.invalidateQueries({ queryKey: ["reading-library"] });
    },
    onError: () => toast.error("Erro ao remover o livro."),
  });

  const startReadingInstant = (book: Book) => {
    updateProgressMutation.mutate({
      id: book.id,
      pagesRead: 1,
      totalPages: book.totalPages,
    });
  };

  const startEditingProgress = (book: Book) => {
    setEditingId(book.id);
    setEditingType("PROGRESS");
    setInlineValue(book.readPages.toString());
  };

  const startEditingTotal = (book: Book) => {
    setEditingId(book.id);
    setEditingType("TOTAL");
    setInlineValue(book.totalPages.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingType(null);
    setInlineValue("");
  };

  const saveInlineEdit = (book: Book) => {
    const val = parseInt(inlineValue) || 0;
    if (val < 0) {
      toast.error("O valor não pode ser negativo.");
      return;
    }

    if (editingType === "PROGRESS") {
      if (val > book.totalPages && book.totalPages > 0) {
        toast.error(
          `A página lida não pode ser maior que o total (${book.totalPages}).`,
        );
        return;
      }
      updateProgressMutation.mutate({
        id: book.id,
        pagesRead: val,
        totalPages: book.totalPages,
      });
    } else if (editingType === "TOTAL") {
      if (val < book.readPages) {
        toast.error(
          `O total não pode ser menor que as páginas já lidas (${book.readPages}).`,
        );
        return;
      }
      updateProgressMutation.mutate({
        id: book.id,
        pagesRead: book.readPages,
        totalPages: val,
      });
    }
  };

  const markAsRead = (book: Book) => {
    updateProgressMutation.mutate({
      id: book.id,
      pagesRead: book.totalPages,
      totalPages: book.totalPages,
    });
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (confirm("Deseja mesmo remover da sua estante?")) {
      deleteBookMutation.mutate(id);
    }
  };

  const currentlyReading = library.filter((b) => b.status === "READING");
  const read = library.filter((b) => b.status === "READ");
  const wantToRead = library.filter((b) => b.status === "WANT_TO_READ");

  const isShowingSearch = searchQuery.trim().length > 0;

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8 relative min-h-[600px]">
      {/* BARRA DE BUSCA */}
      <div className="relative w-full max-w-2xl mx-auto z-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar novo livro, autor ou ISBN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl py-3 md:py-3.5 pl-11 md:pl-12 pr-12 text-xs md:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isShowingSearch ? (
        <div className="w-full bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-emerald-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-5 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
              Resultados da Busca
            </h2>
          </div>

          {isSearching ? (
            <div className="flex justify-center py-16 md:py-20">
              <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-emerald-500/50" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  className="group relative aspect-[2/3] bg-black/40 rounded-2xl border border-white/5 overflow-hidden shadow-lg hover:border-emerald-500/50 hover:-translate-y-1 transition-all duration-300"
                >
                  {book.coverUrl ? (
                    <SmartBookCover
                      url={book.coverUrl}
                      title={book.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-30 transition-opacity duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                      <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-zinc-800" />
                    </div>
                  )}

                  <div className="absolute inset-0 flex flex-col justify-between p-3 md:p-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 bg-black/60 lg:translate-y-2 lg:group-hover:translate-y-0 backdrop-blur-[2px]">
                    <div>
                      <h3 className="font-bold text-xs md:text-sm text-white line-clamp-2 md:line-clamp-3 leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-[9px] md:text-[11px] font-medium text-emerald-400 mt-1 md:mt-1.5 uppercase tracking-wider line-clamp-1">
                        {book.author}
                      </p>
                    </div>
                    <button
                      onClick={() => addBookMutation.mutate(book)}
                      disabled={addBookMutation.isPending}
                      className="w-full py-2 md:py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] md:text-xs font-bold hover:bg-emerald-500 flex items-center justify-center gap-1.5 md:gap-2 transition-colors disabled:opacity-50 mt-2"
                    >
                      {addBookMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin" />
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />{" "}
                          Adicionar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : debouncedSearch.length >= 3 ? (
            <div className="text-center py-16 md:py-20 bg-black/20 border border-white/5 border-dashed rounded-3xl">
              <Library className="w-10 h-10 md:w-12 md:h-12 text-zinc-700 mx-auto mb-2 md:mb-3" />
              <p className="text-zinc-400 text-sm font-medium">
                Nenhum livro encontrado.
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in duration-500 items-start">
          {/* COLUNA: LENDO AGORA */}
          <div className="lg:col-span-1 flex flex-col gap-5 md:gap-6 bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-emerald-500/50 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden group h-fit">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>

            <div className="flex items-center justify-between relative z-10">
              <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                Lendo Agora
              </h4>
            </div>

            <div className="flex flex-col gap-5 md:gap-6 h-full relative z-10">
              {loadingLibrary ? (
                <ReadingSkeleton />
              ) : currentlyReading.length > 0 ? (
                currentlyReading.map((book) => {
                  const progressPercent =
                    Math.round((book.readPages / book.totalPages) * 100) || 0;
                  const isEditingProgress =
                    editingId === book.id && editingType === "PROGRESS";
                  const isEditingTotal =
                    editingId === book.id && editingType === "TOTAL";

                  return (
                    <div
                      key={book.id}
                      className="relative bg-black/40 rounded-2xl md:rounded-3xl border border-white/5 overflow-hidden group shadow-xl hover:border-emerald-500/30 transition-all flex flex-col"
                    >
                      <button
                        onClick={(e) => handleDelete(book.id, e)}
                        className="absolute top-3 right-3 md:top-4 md:right-4 z-20 p-2 bg-black/50 text-zinc-400 hover:text-red-500 hover:bg-red-500/20 rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all shadow-lg backdrop-blur-md"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>

                      <Link
                        href={`/reading/${book.id}`}
                        className="relative h-40 md:h-72 w-full bg-zinc-900 shrink-0 block group/link cursor-pointer"
                      >
                        {book.coverUrl && (
                          <SmartBookCover
                            url={book.coverUrl}
                            title={book.title}
                            className="w-full h-full object-cover opacity-80 lg:opacity-60 lg:group-hover/link:opacity-90 transition-opacity duration-500 object-top"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 lg:group-hover/link:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                            Abrir Diário
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-4 right-4 md:bottom-4 md:left-5 md:right-5 pointer-events-none">
                          <h3 className="font-bold text-lg md:text-xl leading-tight text-white mb-1 drop-shadow-md line-clamp-2">
                            {book.title}
                          </h3>
                          <p className="text-emerald-400 font-semibold text-[10px] md:text-xs uppercase tracking-wider drop-shadow-md line-clamp-1">
                            {book.author}
                          </p>
                        </div>
                      </Link>

                      <div className="p-4 md:p-5 flex flex-col bg-gradient-to-b from-[#09090b] to-black/60">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-500 shrink-0">
                            Progresso
                          </span>
                          <div className="flex items-center gap-1.5 ml-2">
                            {isEditingProgress ? (
                              <div className="flex items-center gap-1 animate-in fade-in">
                                <input
                                  type="number"
                                  min="0"
                                  max={book.totalPages}
                                  value={inlineValue}
                                  onChange={(e) =>
                                    setInlineValue(e.target.value)
                                  }
                                  className="w-14 bg-black border border-white/10 rounded px-1.5 py-1 text-xs font-bold text-white text-center focus:outline-none focus:border-emerald-500/50"
                                  autoFocus
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && saveInlineEdit(book)
                                  }
                                />
                              </div>
                            ) : (
                              <span className="text-xs md:text-sm font-mono font-bold text-white">
                                {book.readPages}
                              </span>
                            )}
                            <span className="text-zinc-500 text-[10px] md:text-xs font-mono">
                              /
                            </span>
                            {isEditingTotal ? (
                              <div className="flex items-center gap-1 animate-in fade-in">
                                <input
                                  type="number"
                                  min={book.readPages}
                                  value={inlineValue}
                                  onChange={(e) =>
                                    setInlineValue(e.target.value)
                                  }
                                  className="w-14 bg-black border border-white/10 rounded px-1.5 py-1 text-[10px] font-mono text-zinc-400 text-center focus:outline-none focus:border-emerald-500/50"
                                  autoFocus
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && saveInlineEdit(book)
                                  }
                                />
                                <button
                                  onClick={() => saveInlineEdit(book)}
                                  className="text-emerald-400 p-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="text-zinc-500 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] md:text-xs font-mono text-zinc-500">
                                  {book.totalPages}
                                </span>
                                {!isEditingProgress && (
                                  <button
                                    onClick={() => startEditingTotal(book)}
                                    className="text-zinc-600 hover:text-emerald-400 p-1 rounded-md"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="w-full h-1.5 md:h-2 bg-black/50 rounded-full overflow-hidden mb-5 relative border border-white/5 shrink-0">
                          <div
                            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>

                        <div className="mt-auto shrink-0">
                          {isEditingProgress ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveInlineEdit(book)}
                                disabled={updateProgressMutation.isPending}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                              >
                                {updateProgressMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" /> Salvar
                                  </>
                                )}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditingProgress(book)}
                              disabled={isEditingTotal}
                              className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[11px] md:text-xs font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Atualizar
                              Leitura
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 md:p-10 bg-black/20 rounded-2xl md:rounded-3xl border border-white/5 border-dashed text-center flex flex-col items-center h-full justify-center">
                  <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-zinc-700 mb-2 md:mb-3" />
                  <p className="text-zinc-400 text-xs md:text-sm font-medium">
                    Nenhum livro aberto.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COLUNAS 2 E 3: FILA E LIDOS */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* FILA DE LEITURA */}
            <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-blue-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden group h-fit">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
              <div className="flex items-center gap-2 mb-5 md:mb-6 relative z-10">
                <Bookmark className="text-blue-400 w-4 h-4 md:w-5 md:h-5" />
                <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  Fila de Leitura
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 relative z-10">
                {loadingLibrary ? (
                  [1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-white/5 animate-pulse rounded-2xl"
                    ></div>
                  ))
                ) : wantToRead.length > 0 ? (
                  wantToRead.map((book) => (
                    <Link
                      key={book.id}
                      href={`/reading/${book.id}`}
                      className="relative flex items-center gap-3 md:gap-4 p-2.5 md:p-3 bg-black/40 border border-white/5 hover:border-white/10 hover:bg-white/[0.04] rounded-2xl transition-all group/fila shadow-sm"
                    >
                      <button
                        onClick={(e) => handleDelete(book.id, e)}
                        className="absolute top-2 right-2 z-20 p-1 md:p-1.5 bg-black/50 text-zinc-500 hover:text-red-500 hover:bg-red-500/20 rounded-md opacity-100 lg:opacity-0 lg:group-hover/fila:opacity-100 transition-all backdrop-blur-sm"
                      >
                        <Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
                      </button>

                      <div className="w-10 h-14 md:w-12 md:h-16 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-white/5">
                        <SmartBookCover
                          url={book.coverUrl}
                          title={book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex flex-col flex-grow min-w-0 pr-5 md:pr-6">
                        <h3 className="font-bold text-xs md:text-sm text-zinc-200 truncate group-hover/fila:text-blue-400">
                          {book.title}
                        </h3>
                        <p className="text-[10px] md:text-[11px] font-medium text-zinc-500 truncate mb-1.5 md:mb-2.5">
                          {book.author}
                        </p>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              startReadingInstant(book);
                            }}
                            className="text-[9px] md:text-[10px] font-bold text-zinc-400 hover:text-blue-400 bg-white/5 hover:bg-blue-500/10 px-1.5 py-1 md:px-2 md:py-1 rounded z-10 relative"
                          >
                            <BookOpen className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-1" />{" "}
                            Iniciar
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              markAsRead(book);
                            }}
                            disabled={updateProgressMutation.isPending}
                            className="text-[9px] md:text-[10px] font-bold text-zinc-400 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 px-1.5 py-1 md:px-2 md:py-1 rounded z-10 relative disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3 inline mr-1" />{" "}
                            Já Li
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full p-4 md:p-6 bg-black/20 rounded-2xl border border-white/5 border-dashed text-zinc-600 text-xs md:text-sm text-center">
                    Fila vazia.
                  </div>
                )}
              </div>
            </div>

            {/* FINALIZADOS */}
            <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-amber-500/50 rounded-3xl p-5 md:p-6 lg:p-8 shadow-2xl relative overflow-hidden flex-grow group h-fit">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle2 className="text-amber-400 w-5 h-5" />
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                  Finalizados
                </h4>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4 relative z-10">
                {loadingLibrary ? (
                  [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-[2/3] bg-white/5 animate-pulse rounded-2xl"
                    ></div>
                  ))
                ) : read.length > 0 ? (
                  read.map((book) => (
                    <Link
                      key={book.id}
                      href={`/reading/${book.id}`}
                      className="group/book relative aspect-[2/3] bg-black/40 rounded-xl md:rounded-2xl border border-white/5 overflow-hidden shadow-lg hover:-translate-y-1 hover:border-amber-500/50 transition-all duration-300 cursor-pointer block"
                    >
                      <SmartBookCover
                        url={book.coverUrl}
                        title={book.title}
                        className={`w-full h-full object-cover transition-all duration-500 ${book.rating ? "opacity-80" : "opacity-40 grayscale-[50%]"}`}
                      />

                      <div className="absolute inset-0 bg-black/0 lg:group-hover/book:bg-black/60 transition-colors flex flex-col items-center justify-center gap-3 opacity-0 lg:group-hover/book:opacity-100 backdrop-blur-[2px]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                          Abrir Diário
                        </span>
                        <button
                          onClick={(e) => handleDelete(book.id, e)}
                          className="p-1.5 md:p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/80 hover:text-white transition-colors z-10 relative"
                        >
                          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                      </div>

                      <div
                        className={`absolute top-1.5 right-1.5 md:top-2 md:right-2 px-1 md:px-1.5 h-5 md:h-6 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border ${book.rating ? "bg-amber-500/90 border-amber-400 text-black" : "bg-zinc-800/90 border-white/10 w-5 md:w-6"}`}
                      >
                        {book.rating ? (
                          <div className="flex items-center gap-0.5 md:gap-1 text-[9px] md:text-[10px] font-black">
                            {book.rating}{" "}
                            <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-black" />
                          </div>
                        ) : (
                          <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-zinc-400" />
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full p-6 bg-black/20 rounded-2xl border border-white/5 border-dashed text-zinc-600 text-xs text-center">
                    Nenhum livro finalizado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isShowingSearch && <ReadingStatsSection />}
    </div>
  );
}
