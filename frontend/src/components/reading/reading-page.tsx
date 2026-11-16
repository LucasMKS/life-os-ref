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
import { SmartBookCover } from "@/components/reading/smart-book-cover";
import { ReadingStatsSection } from "@/components/reading/reading-stats-section";
import {
  SurfacePanel,
  FilterPill,
  EmptyState,
} from "@/components/ui/page-shell";

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  totalPages: number;
  readPages: number;
  status: "READING" | "READ" | "WANT_TO_READ";
  genres?: string[];
  startedAt?: string;
  finishedAt?: string;
  rating?: number;
  review?: string;
}

type ShelfFilter = "ALL" | "READING" | "WANT_TO_READ" | "READ";

const ReadingSkeleton = () => (
  <div className="bg-[#09090b] rounded-xl border border-white/[0.06] overflow-hidden animate-pulse flex flex-col">
    <div className="h-44 w-full bg-white/[0.04]" />
    <div className="p-4 flex flex-col gap-3">
      <div className="h-4 w-3/4 bg-white/[0.04] rounded" />
      <div className="h-1.5 w-full bg-white/[0.06] rounded-full" />
      <div className="h-9 w-full bg-white/[0.04] rounded-xl" />
    </div>
  </div>
);

export function ReadingDashboard() {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ShelfFilter>("ALL");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"PROGRESS" | "TOTAL" | null>(
    null,
  );
  const [inlineValue, setInlineValue] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: rawLibrary = [], isLoading: loadingLibrary } = useQuery<Book[]>(
    {
      queryKey: ["reading-library"],
      queryFn: readingApi.getLibrary,
      staleTime: 1000 * 60 * 5,
    },
  );

  const library = Array.isArray(rawLibrary) ? rawLibrary : [];

  const { data: rawSearchResults = [], isFetching: isSearching } = useQuery<
    Book[]
  >({
    queryKey: ["reading-search", debouncedSearch],
    queryFn: () => readingApi.searchBooks(debouncedSearch.trim()),
    enabled: debouncedSearch.trim().length >= 3,
  });

  const searchResults = Array.isArray(rawSearchResults) ? rawSearchResults : [];

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
    setInlineValue(String(book.readPages ?? 0));
  };

  const startEditingTotal = (book: Book) => {
    setEditingId(book.id);
    setEditingType("TOTAL");
    setInlineValue(String(book.totalPages ?? 0));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingType(null);
    setInlineValue("");
  };

  const saveInlineEdit = (book: Book) => {
    const val = parseInt(inlineValue, 10) || 0;
    if (val < 0) {
      toast.error("O valor não pode ser negativo.");
      return;
    }

    if (editingType === "PROGRESS") {
      if (book.totalPages > 0 && val > book.totalPages) {
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
      if (val < (book.readPages ?? 0)) {
        toast.error(
          `O total não pode ser menor que as páginas já lidas (${book.readPages ?? 0}).`,
        );
        return;
      }
      updateProgressMutation.mutate({
        id: book.id,
        pagesRead: book.readPages ?? 0,
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
  const wantToRead = library.filter((b) => b.status === "WANT_TO_READ");
  const read = library.filter((b) => b.status === "READ");

  const isShowingSearch = searchQuery.trim().length > 0;

  const renderReadingCard = (book: Book) => {
    const total = book.totalPages ?? 0;
    const current = book.readPages ?? 0;
    const progressPercent =
      total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;
    const isEditingProgress =
      editingId === book.id && editingType === "PROGRESS";
    const isEditingTotal = editingId === book.id && editingType === "TOTAL";

    return (
      <div
        key={book.id}
        className="relative bg-[#09090b] rounded-xl border border-white/[0.06] hover:border-white/[0.12] overflow-hidden group transition-colors flex flex-col"
      >
        <button
          type="button"
          onClick={(e) => handleDelete(book.id, e)}
          aria-label={`Remover ${book.title}`}
          className="absolute top-3 right-3 z-20 p-2 bg-[#111113]/90 text-zinc-400 hover:text-red-400 hover:bg-red-500/15 rounded-lg border border-white/[0.08] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <Link
          href={`/reading/${book.id}`}
          className="relative h-44 sm:h-56 w-full bg-zinc-900 shrink-0 block group/link"
        >
          <SmartBookCover
            url={book.coverUrl}
            title={book.title}
            className="w-full h-full object-cover opacity-80 lg:group-hover/link:opacity-95 transition-opacity object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/55 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
            <h3 className="font-semibold text-base sm:text-lg leading-snug text-white mb-0.5 line-clamp-2">
              {book.title}
            </h3>
            <p className="text-zinc-400 font-medium text-xs truncate">
              {book.author || "Autor desconhecido"}
            </p>
          </div>
        </Link>

        <div className="p-4 flex flex-col gap-3 flex-grow">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Progresso ({progressPercent}%)
            </span>
            <div className="flex items-center gap-1.5">
              {isEditingProgress ? (
                <input
                  type="number"
                  min="0"
                  max={total || undefined}
                  value={inlineValue}
                  onChange={(e) => setInlineValue(e.target.value)}
                  className="w-16 bg-[#111113] border border-white/[0.12] rounded-lg px-2 py-1 text-xs font-mono font-semibold text-white text-center focus:outline-none focus:border-white/30"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveInlineEdit(book)}
                />
              ) : (
                <span className="font-mono font-semibold text-white tabular-nums">
                  {current}
                </span>
              )}
              <span className="text-zinc-600 font-mono">/</span>
              {isEditingTotal ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={current}
                    value={inlineValue}
                    onChange={(e) => setInlineValue(e.target.value)}
                    className="w-16 bg-[#111113] border border-white/[0.12] rounded-lg px-2 py-1 text-xs font-mono text-zinc-200 text-center focus:outline-none focus:border-white/30"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveInlineEdit(book)}
                  />
                  <button
                    type="button"
                    onClick={() => saveInlineEdit(book)}
                    className="text-emerald-400 p-1"
                    aria-label="Salvar total"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-zinc-500 p-1"
                    aria-label="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="font-mono text-zinc-400 tabular-nums">
                    {total}
                  </span>
                  {!isEditingProgress && (
                    <button
                      type="button"
                      onClick={() => startEditingTotal(book)}
                      className="text-zinc-500 hover:text-zinc-200 p-1 rounded transition-colors"
                      title="Editar total de páginas"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-auto pt-1">
            {isEditingProgress ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => saveInlineEdit(book)}
                  disabled={updateProgressMutation.isPending}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {updateProgressMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Salvar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 rounded-xl transition-colors"
                  aria-label="Cancelar edição"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startEditingProgress(book)}
                disabled={isEditingTotal}
                className="w-full py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Atualizar Leitura
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWantToReadCard = (book: Book) => (
    <Link
      key={book.id}
      href={`/reading/${book.id}`}
      className="relative flex items-center gap-3.5 p-3 bg-[#09090b] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] rounded-xl transition-colors group/fila"
    >
      <button
        type="button"
        onClick={(e) => handleDelete(book.id, e)}
        aria-label={`Remover ${book.title}`}
        className="absolute top-2.5 right-2.5 z-20 p-1.5 bg-[#111113] text-zinc-500 hover:text-red-400 hover:bg-red-500/15 rounded-lg border border-white/[0.06] opacity-100 lg:opacity-0 lg:group-hover/fila:opacity-100 transition-opacity"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="w-11 h-16 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-white/[0.08]">
        <SmartBookCover
          url={book.coverUrl}
          title={book.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col flex-grow min-w-0 pr-6">
        <h3 className="font-semibold text-sm text-zinc-100 truncate group-hover/fila:text-white">
          {book.title}
        </h3>
        <p className="text-xs text-zinc-500 truncate mb-2">
          {book.author || "Autor desconhecido"}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startReadingInstant(book);
            }}
            className="text-[11px] font-medium text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-colors"
          >
            <BookOpen className="w-3 h-3" /> Iniciar
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              markAsRead(book);
            }}
            disabled={updateProgressMutation.isPending}
            className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3 h-3" /> Já Li
          </button>
        </div>
      </div>
    </Link>
  );

  const renderReadCard = (book: Book) => (
    <Link
      key={book.id}
      href={`/reading/${book.id}`}
      className="group/book relative aspect-[2/3] bg-[#09090b] rounded-xl border border-white/[0.06] hover:border-white/[0.16] overflow-hidden transition-colors block"
    >
      <SmartBookCover
        url={book.coverUrl}
        title={book.title}
        className={`w-full h-full object-cover transition-opacity ${
          book.rating ? "opacity-85 group-hover/book:opacity-40" : "opacity-60 group-hover/book:opacity-30"
        }`}
      />

      <div className="absolute inset-0 bg-black/0 lg:group-hover/book:bg-black/60 transition-colors flex flex-col items-center justify-center gap-2.5 opacity-0 lg:group-hover/book:opacity-100 p-2">
        <span className="text-[11px] font-medium text-zinc-100 bg-white/[0.1] px-2.5 py-1 rounded-lg border border-white/[0.15]">
          Abrir Diário
        </span>
        <button
          type="button"
          onClick={(e) => handleDelete(book.id, e)}
          aria-label={`Remover ${book.title}`}
          className="p-2 bg-red-500/15 text-red-400 rounded-lg hover:bg-red-500/25 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        className={`absolute top-2 right-2 px-1.5 h-5 rounded-md flex items-center justify-center border text-[10px] font-semibold ${
          book.rating
            ? "bg-zinc-900/90 border-amber-500/30 text-amber-400"
            : "bg-zinc-900/90 border-white/[0.1] text-zinc-400"
        }`}
      >
        {book.rating ? (
          <span className="flex items-center gap-0.5 tabular-nums">
            {book.rating}
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
          </span>
        ) : (
          <CheckCircle2 className="w-3 h-3" />
        )}
      </div>
    </Link>
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Search + Shelf Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar novo livro, autor ou ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111113] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-10 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-white/25 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {!isShowingSearch && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <FilterPill
              accent="emerald"
              active={activeFilter === "ALL"}
              onClick={() => setActiveFilter("ALL")}
            >
              Todos ({library.length})
            </FilterPill>
            <FilterPill
              accent="emerald"
              active={activeFilter === "READING"}
              onClick={() => setActiveFilter("READING")}
            >
              Lendo ({currentlyReading.length})
            </FilterPill>
            <FilterPill
              accent="emerald"
              active={activeFilter === "WANT_TO_READ"}
              onClick={() => setActiveFilter("WANT_TO_READ")}
            >
              Quero Ler ({wantToRead.length})
            </FilterPill>
            <FilterPill
              accent="emerald"
              active={activeFilter === "READ"}
              onClick={() => setActiveFilter("READ")}
            >
              Lidos ({read.length})
            </FilterPill>
          </div>
        )}
      </div>

      {isShowingSearch ? (
        <SurfacePanel
          title="Resultados da Busca"
          icon={<Search className="w-4 h-4" />}
        >
          {isSearching ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  className="group relative aspect-[2/3] bg-[#09090b] rounded-xl border border-white/[0.06] hover:border-white/[0.16] overflow-hidden transition-colors"
                >
                  <SmartBookCover
                    url={book.coverUrl}
                    title={book.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-25 transition-opacity"
                  />

                  <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-black/70">
                    <div>
                      <h3 className="font-semibold text-xs sm:text-sm text-white line-clamp-3 leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                        {book.author || "Autor desconhecido"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addBookMutation.mutate(book)}
                      disabled={addBookMutation.isPending}
                      className="w-full py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {addBookMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" /> Adicionar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : debouncedSearch.trim().length >= 3 ? (
            <EmptyState
              icon={<Library className="w-6 h-6" />}
              title="Nenhum livro encontrado"
              description="Tente buscar por outro título, autor ou código ISBN."
            />
          ) : (
            <p className="text-xs text-zinc-500 text-center py-8">
              Digite pelo menos 3 caracteres para pesquisar.
            </p>
          )}
        </SurfacePanel>
      ) : activeFilter === "ALL" ? (
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Lendo Agora */}
          <SurfacePanel
            accent="emerald"
            title="Lendo Agora"
            icon={<BookOpen className="w-4 h-4 text-emerald-400" />}
            className="lg:col-span-1"
          >
            <div className="flex flex-col gap-4">
              {loadingLibrary ? (
                <ReadingSkeleton />
              ) : currentlyReading.length > 0 ? (
                currentlyReading.map(renderReadingCard)
              ) : (
                <EmptyState
                  icon={<BookOpen className="w-5 h-5" />}
                  title="Nenhum livro aberto"
                  description="Inicie um livro da sua fila ou busque um novo acima."
                />
              )}
            </div>
          </SurfacePanel>

          {/* Fila e Finalizados */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <SurfacePanel
              title="Fila de Leitura"
              icon={<Bookmark className="w-4 h-4" />}
            >
              {loadingLibrary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-white/[0.04] animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : wantToRead.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wantToRead.map(renderWantToReadCard)}
                </div>
              ) : (
                <EmptyState
                  icon={<Bookmark className="w-5 h-5" />}
                  title="Fila vazia"
                  description="Adicione livros que você planeja ler em breve."
                />
              )}
            </SurfacePanel>

            <SurfacePanel
              title="Finalizados"
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {loadingLibrary ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-[2/3] bg-white/[0.04] animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : read.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {read.map(renderReadCard)}
                </div>
              ) : (
                <EmptyState
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  title="Nenhum livro finalizado"
                  description="Seus livros concluídos aparecerão aqui."
                />
              )}
            </SurfacePanel>
          </div>
        </div>
      ) : activeFilter === "READING" ? (
        <SurfacePanel
          title="Lendo Agora"
          icon={<BookOpen className="w-4 h-4 text-emerald-400" />}
        >
          {currentlyReading.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentlyReading.map(renderReadingCard)}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-5 h-5" />}
              title="Nenhum livro em andamento"
            />
          )}
        </SurfacePanel>
      ) : activeFilter === "WANT_TO_READ" ? (
        <SurfacePanel
          title="Quero Ler"
          icon={<Bookmark className="w-4 h-4" />}
        >
          {wantToRead.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {wantToRead.map(renderWantToReadCard)}
            </div>
          ) : (
            <EmptyState
              icon={<Bookmark className="w-5 h-5" />}
              title="Sua fila de leitura está vazia"
            />
          )}
        </SurfacePanel>
      ) : (
        <SurfacePanel
          title="Finalizados"
          icon={<CheckCircle2 className="w-4 h-4" />}
        >
          {read.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {read.map(renderReadCard)}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="Nenhum livro finalizado"
            />
          )}
        </SurfacePanel>
      )}

      {!isShowingSearch && <ReadingStatsSection />}
    </div>
  );
}
