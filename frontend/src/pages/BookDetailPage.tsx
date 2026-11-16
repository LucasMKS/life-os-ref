import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readingApi } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";
import { SmartBookCover } from "@/components/reading/smart-book-cover";
import { PageShell, SurfacePanel, EmptyState } from "@/components/ui/page-shell";
import {
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Loader2,
  MessageSquareQuote,
  Save,
  Star,
  TrendingUp,
  Building2,
  Hash,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookId = (params?.id as string) ?? "";

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const starsContainerRef = useRef<HTMLDivElement>(null);
  const [review, setReview] = useState("");
  const [newNote, setNewNote] = useState("");

  const [isEditingCover, setIsEditingCover] = useState(false);
  const [coverUrlInput, setCoverUrlInput] = useState("");

  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [authorInput, setAuthorInput] = useState("");

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");

  const [calendarPage, setCalendarPage] = useState(0);
  const MAX_NOTE_CHARS = 250;

  const [editingDay, setEditingDay] = useState<{
    dateKey: string;
    dateLabel: string;
    pages: number;
  } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [confirmReversion, setConfirmReversion] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book-details", bookId],
    queryFn: () => readingApi.getBookDetails(bookId),
    enabled: Boolean(bookId),
  });

  const rateMutation = useMutation({
    mutationFn: readingApi.rateBook,
    onSuccess: () => {
      toast.success("Avaliação salva!");
      queryClient.invalidateQueries({ queryKey: ["book-details", bookId] });
      queryClient.invalidateQueries({ queryKey: ["reading-library"] });
    },
    onError: () => toast.error("Erro ao salvar avaliação."),
  });

  const addNoteMutation = useMutation({
    mutationFn: readingApi.addBookNote,
    onSuccess: () => {
      toast.success("Anotação salva!");
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["book-details", bookId] });
    },
    onError: () => toast.error("Erro ao adicionar anotação."),
  });

  const editNoteMutation = useMutation({
    mutationFn: readingApi.editBookNote,
    onSuccess: () => {
      toast.success("Anotação atualizada!");
      setEditingNoteId(null);
      queryClient.invalidateQueries({ queryKey: ["book-details", bookId] });
    },
    onError: () => toast.error("Erro ao editar a anotação."),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: readingApi.deleteBookNote,
    onSuccess: () => {
      toast.success("Anotação removida!");
      queryClient.invalidateQueries({ queryKey: ["book-details", bookId] });
    },
    onError: () => toast.error("Erro ao remover a anotação."),
  });

  const updateCoverMutation = useMutation({
    mutationFn: readingApi.updateCover,
    onSuccess: () => {
      toast.success("Capa atualizada!");
      setIsEditingCover(false);
      setCoverUrlInput("");
      queryClient.invalidateQueries({ queryKey: ["book-details", bookId] });
      queryClient.invalidateQueries({ queryKey: ["reading-library"] });
    },
    onError: () => toast.error("Erro ao atualizar a capa."),
  });

  const updateAuthorMutation = useMutation({
    mutationFn: readingApi.updateAuthor,
    onSuccess: () => {
      toast.success("Autor atualizado!");
      setIsEditingAuthor(false);
      setAuthorInput("");
      queryClient.invalidateQueries({ queryKey: ["book-details", bookId] });
      queryClient.invalidateQueries({ queryKey: ["reading-library"] });
    },
    onError: () => toast.error("Erro ao atualizar o autor."),
  });

  const updateDailyMutation = useMutation({
    mutationFn: readingApi.updateDailyPages,
    onSuccess: () => {
      toast.success("Páginas atualizadas!");
      setEditingDay(null);
      setEditingValue("");
      setConfirmReversion(false);
      queryClient.invalidateQueries({ queryKey: ["book-details", bookId] });
      queryClient.invalidateQueries({ queryKey: ["reading-library"] });
      queryClient.invalidateQueries({ queryKey: ["reading-pulse"] });
      queryClient.invalidateQueries({ queryKey: ["reading-summary"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Erro ao atualizar páginas.";
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (book) {
      if (typeof book.rating === "number" && book.rating > 0) {
        setRating(book.rating);
      }
      if (typeof book.review === "string") {
        setReview(book.review);
      }
    }
  }, [book?.id]);

  const handleSaveCover = () => {
    const trimmed = coverUrlInput.trim();
    const validUrl = sanitizeUrl(trimmed);
    if (!validUrl) {
      toast.error("URL de capa inválida. Use um link http:// ou https://.");
      return;
    }
    updateCoverMutation.mutate({ bookId, coverUrl: validUrl });
  };

  const handleSaveAuthor = () => {
    const trimmed = authorInput.trim();
    if (!trimmed) {
      toast.error("Informe o nome do autor.");
      return;
    }
    updateAuthorMutation.mutate({ bookId, author: trimmed });
  };

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

  const toLocalDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getEstimationText = () => {
    if (
      !book ||
      book.status !== "READING" ||
      !Array.isArray(book.sessions) ||
      book.sessions.length === 0
    ) {
      return null;
    }

    const activeSessions = book.sessions.filter(
      (s: any) => Number(s?.pagesRead) > 0,
    );
    if (activeSessions.length === 0) return null;

    const totalPagesLogged = activeSessions.reduce(
      (acc: number, curr: any) => acc + (Number(curr?.pagesRead) || 0),
      0,
    );
    const averagePagesPerSession = totalPagesLogged / activeSessions.length;
    if (averagePagesPerSession <= 0) return null;

    const remainingPages = (book.totalPages ?? 0) - (book.readPages ?? 0);
    if (remainingPages <= 0) return null;

    const estimatedDaysRemaining = Math.ceil(
      remainingPages / averagePagesPerSession,
    );

    const estDate = new Date();
    estDate.setDate(estDate.getDate() + estimatedDaysRemaining);
    const formattedDate = estDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return {
      avg: Math.round(averagePagesPerSession * 10) / 10,
      days: estimatedDaysRemaining,
      dateStr: formattedDate,
    };
  };

  const generateReadingCalendar = () => {
    if (!book) return { days: [], totalPages: 0 };
    const startDate = new Date(book.startedAt || book.createdAt || Date.now());
    const endDate =
      book.status === "READ" && book.finishedAt
        ? new Date(book.finishedAt)
        : new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const totalDays = Math.max(
      1,
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1,
    );
    const readingMap = new Map<string, number>();

    if (Array.isArray(book.sessions)) {
      book.sessions.forEach((s: any) => {
        if (!s?.sessionDate) return;
        const dateStr = toLocalDateKey(new Date(s.sessionDate));
        readingMap.set(
          dateStr,
          (readingMap.get(dateStr) || 0) + (Number(s.pagesRead) || 0),
        );
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayKey = toLocalDateKey(today);
    const yesterdayKey = toLocalDateKey(yesterday);

    const allDays = Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = toLocalDateKey(d);
      const pages = readingMap.get(dateStr) || 0;

      let intensityClass = "bg-white/[0.04] border-white/[0.06]";
      if (pages > 0 && pages <= 10)
        intensityClass = "bg-emerald-950/80 border-emerald-800/50";
      else if (pages > 10 && pages <= 30)
        intensityClass = "bg-emerald-700/60 border-emerald-600/50";
      else if (pages > 30)
        intensityClass = "bg-emerald-500/80 border-emerald-400/60";

      const isEditable = dateStr === todayKey || dateStr === yesterdayKey;

      return {
        dateKey: dateStr,
        date: d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        pages,
        intensityClass,
        isEditable,
      };
    });

    const PAGE_SIZE = 30;
    const totalPages = Math.ceil(allDays.length / PAGE_SIZE) || 1;
    const safePage = Math.min(calendarPage, totalPages - 1);
    const paginatedSlice = allDays.slice(
      safePage * PAGE_SIZE,
      (safePage + 1) * PAGE_SIZE,
    );
    const firstDay = paginatedSlice[0];
    const lastDay = paginatedSlice[paginatedSlice.length - 1];
    const formatShort = (label: string) => label.replace(/\s+de\s+\d{4}$/, "");
    const pageRangeLabel =
      firstDay && lastDay
        ? firstDay.dateKey === lastDay.dateKey
          ? formatShort(firstDay.date)
          : `${formatShort(firstDay.date)} — ${formatShort(lastDay.date)}`
        : "";
    const pagePagesTotal = paginatedSlice.reduce(
      (sum, d) => sum + (d?.pages || 0),
      0,
    );
    while (paginatedSlice.length < PAGE_SIZE) paginatedSlice.push(null as any);

    return {
      days: paginatedSlice,
      totalPages,
      pageRangeLabel,
      pagePagesTotal,
    };
  };

  const getReadingDuration = () => {
    if (!book?.startedAt) return null;
    const start = new Date(book.startedAt);
    const end = book.finishedAt ? new Date(book.finishedAt) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
      Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays === 0 ? 1 : diffDays;
  };

  const {
    days: calendarDays,
    totalPages: calendarTotalPages,
    pageRangeLabel,
    pagePagesTotal,
  } = generateReadingCalendar();

  const initializedBookIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      book?.id &&
      calendarTotalPages > 0 &&
      initializedBookIdRef.current !== book.id
    ) {
      initializedBookIdRef.current = book.id;
      setCalendarPage(calendarTotalPages - 1);
    }
  }, [book?.id, calendarTotalPages]);

  useEffect(() => {
    if (editingDay) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editingDay]);

  if (isLoading) {
    return (
      <PageShell maxWidth="6xl">
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-zinc-400" />
        </div>
      </PageShell>
    );
  }

  if (!book) {
    return (
      <PageShell maxWidth="6xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para a Estante
        </button>
        <EmptyState
          title="Livro não encontrado"
          description="Não foi possível carregar os detalhes deste livro."
        />
      </PageShell>
    );
  }

  const totalPages = book.totalPages ?? 0;
  const readPages = book.readPages ?? 0;
  const progressPercent =
    totalPages > 0
      ? Math.min(100, Math.max(0, Math.round((readPages / totalPages) * 100)))
      : 0;
  const remainingNoteChars = MAX_NOTE_CHARS - newNote.length;
  const duration = getReadingDuration();

  const handleEditClick = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.note ?? "");
  };

  const newDayTotal = Number(editingValue) || 0;
  const oldDayTotal = editingDay?.pages ?? 0;
  const projectedReadPages = Math.max(
    0,
    Math.min(
      totalPages > 0 ? totalPages : Number.MAX_SAFE_INTEGER,
      readPages - oldDayTotal + newDayTotal,
    ),
  );
  const willFinish =
    totalPages > 0 &&
    projectedReadPages >= totalPages &&
    book.status !== "READ";
  const willRevert = book.status === "READ" && projectedReadPages < totalPages;
  const isInvalid =
    editingValue.trim() === "" ||
    newDayTotal < 0 ||
    (totalPages > 0 && newDayTotal > totalPages);

  const closeEditModal = () => {
    setEditingDay(null);
    setEditingValue("");
    setConfirmReversion(false);
  };

  const saveDailyEdit = () => {
    if (!editingDay || isInvalid) return;
    if (willRevert && !confirmReversion) return;
    updateDailyMutation.mutate({
      bookId,
      date: editingDay.dateKey,
      pagesRead: newDayTotal,
    });
  };

  const statusBadge =
    book.status === "READ"
      ? {
          label: "Finalizado",
          cls: "bg-white/[0.06] text-zinc-200 border-white/[0.12]",
        }
      : book.status === "WANT_TO_READ"
        ? {
            label: "Quero Ler",
            cls: "bg-white/[0.04] text-zinc-400 border-white/[0.08]",
          }
        : {
            label: "Lendo Agora",
            cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          };

  const notesList = Array.isArray(book.notes) ? book.notes : [];

  return (
    <PageShell maxWidth="6xl">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white font-medium text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para a Estante
      </button>

      {/* Book Header (Hero) */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8 items-start">
        <div className="w-44 sm:w-52 shrink-0 mx-auto md:mx-0 flex flex-col gap-2">
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-zinc-900 group/cover">
            <SmartBookCover
              url={book.coverUrl}
              title={book.title}
              className="w-full h-auto object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setIsEditingCover(true);
                setCoverUrlInput("");
              }}
              className="absolute bottom-2.5 right-2.5 p-2 bg-[#09090b]/90 hover:bg-[#09090b] text-zinc-300 hover:text-white rounded-xl border border-white/[0.1] opacity-100 lg:opacity-0 lg:group-hover/cover:opacity-100 transition-opacity"
              title="Alterar capa"
              aria-label="Alterar capa"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {isEditingCover && (
            <div className="flex flex-col gap-2">
              <input
                type="url"
                value={coverUrlInput}
                onChange={(e) => setCoverUrlInput(e.target.value)}
                placeholder="Cole o link https:// da imagem..."
                autoFocus
                className="w-full bg-[#111113] border border-white/[0.1] focus:border-white/25 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && coverUrlInput.trim()) {
                    handleSaveCover();
                  }
                  if (e.key === "Escape") setIsEditingCover(false);
                }}
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleSaveCover}
                  disabled={!coverUrlInput.trim() || updateCoverMutation.isPending}
                  className="flex-1 py-1.5 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  {updateCoverMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingCover(false)}
                  className="px-2.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-400 rounded-xl transition-colors"
                  aria-label="Cancelar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center flex-grow min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusBadge.cls}`}
            >
              {statusBadge.label}
            </span>
            {Array.isArray(book.genres) &&
              book.genres.map((genre: string) => (
                <span
                  key={genre}
                  className="text-[11px] text-zinc-400 font-medium bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-lg"
                >
                  {genre}
                </span>
              ))}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-1.5 text-white leading-tight">
            {book.title}
          </h1>
          {book.subtitle && (
            <h2 className="text-base sm:text-lg text-zinc-400 font-medium mb-3 line-clamp-2">
              {book.subtitle}
            </h2>
          )}

          <div className="flex items-center gap-2 group/author mb-5">
            {isEditingAuthor ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  placeholder="Nome do autor..."
                  autoFocus
                  className="bg-[#111113] border border-white/[0.1] focus:border-white/25 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors w-48 sm:w-64"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveAuthor();
                    if (e.key === "Escape") setIsEditingAuthor(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveAuthor}
                  disabled={updateAuthorMutation.isPending}
                  className="p-1.5 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 rounded-lg transition-colors"
                  title="Salvar"
                >
                  {updateAuthorMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingAuthor(false)}
                  className="p-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 rounded-lg transition-colors"
                  title="Cancelar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-zinc-300 text-sm sm:text-base font-medium">
                  {book.author || "Autor Desconhecido"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingAuthor(true);
                    setAuthorInput(
                      book.author === "Autor Desconhecido"
                        ? ""
                        : (book.author ?? ""),
                    );
                  }}
                  className="p-1 text-zinc-500 hover:text-white rounded transition-opacity opacity-100 lg:opacity-0 lg:group-hover/author:opacity-100 focus:opacity-100"
                  title="Alterar autor"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-5 mb-6 text-xs sm:text-sm text-zinc-400">
            {book.publisher && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-zinc-500" />
                <span>{book.publisher}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 tabular-nums">
              <Hash className="w-4 h-4 text-zinc-500" />
              <span>{totalPages} páginas</span>
            </div>
          </div>

          {/* Progress Panel */}
          <SurfacePanel accent="emerald" className="w-full">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Progresso (<span className="text-emerald-400">{progressPercent}%</span>)
              </span>
              <span className="text-xs font-mono font-semibold text-white tabular-nums">
                {readPages} / {totalPages} págs
              </span>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {duration !== null && (
              <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4">
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
                  <div className="flex gap-6">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
                        Início
                      </span>
                      <span className="text-zinc-200 font-medium">
                        {new Date(
                          book.startedAt || book.createdAt,
                        ).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {book.finishedAt && (
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
                          Término
                        </span>
                        <span className="text-zinc-200 font-medium">
                          {new Date(book.finishedAt).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {book.finishedAt ? (
                    <div className="inline-flex items-center gap-1.5 bg-white/[0.04] text-zinc-200 px-3 py-1.5 rounded-xl border border-white/[0.08] font-medium">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {duration} {duration === 1 ? "dia" : "dias"} de leitura
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-medium">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>
                        Lendo há {duration} {duration === 1 ? "dia" : "dias"}
                      </span>
                    </div>
                  )}
                </div>

                {!book.finishedAt &&
                  book.status === "READING" &&
                  (() => {
                    const est = getEstimationText();
                    if (!est) return null;
                    return (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#09090b] border border-white/[0.06] rounded-xl p-3 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500">Ritmo médio:</span>
                          <span className="text-white font-mono font-semibold tabular-nums">
                            {est.avg} págs/dia
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-500">Término est.:</span>
                          <span className="text-emerald-400 font-semibold">
                            {est.dateStr}
                          </span>
                          <span className="text-zinc-500">({est.days}d)</span>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}
          </SurfacePanel>
        </div>
      </div>

      {/* Main Content Grid: Notes (Left 7 cols) | Rhythm + Final Review (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <SurfacePanel
            title="Minhas Anotações"
            icon={<MessageSquareQuote className="w-4 h-4 text-emerald-400" />}
          >
            <div className="flex flex-col gap-2 mb-6">
              <div className="relative">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  maxLength={MAX_NOTE_CHARS}
                  placeholder="Anotação rápida (Ex: O plot twist da pág 142 me pegou de surpresa...)"
                  className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-4 py-3 pb-7 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/25 transition-colors resize-none h-24"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (newNote.trim()) {
                        addNoteMutation.mutate({
                          bookId,
                          note: newNote.trim(),
                        });
                      }
                    }
                  }}
                />
                <span
                  className={`absolute bottom-2.5 right-3.5 text-[11px] font-mono tabular-nums ${
                    remainingNoteChars < 20 ? "text-red-400" : "text-zinc-500"
                  }`}
                >
                  {remainingNoteChars}
                </span>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    addNoteMutation.mutate({ bookId, note: newNote.trim() })
                  }
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                  className="bg-zinc-100 hover:bg-white text-zinc-950 px-5 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {addNoteMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Adicionar Nota"
                  )}
                </button>
              </div>
            </div>

            {notesList.length > 0 ? (
              <div className="space-y-5 border-l border-white/[0.08] ml-2 pl-5">
                {notesList.map((note: any) => (
                  <div key={note.id} className="relative group/note">
                    <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-[#111113]" />

                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-zinc-400 font-medium">
                        {new Date(note.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      {editingNoteId !== note.id && (
                        <div className="opacity-100 lg:opacity-0 lg:group-hover/note:opacity-100 transition-opacity flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditClick(note)}
                            className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Apagar anotação?")) {
                                deleteNoteMutation.mutate({
                                  bookId,
                                  noteId: note.id,
                                });
                              }
                            }}
                            className="text-zinc-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                            title="Apagar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingNoteId === note.id ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <textarea
                          value={editingNoteContent}
                          onChange={(e) =>
                            setEditingNoteContent(e.target.value)
                          }
                          maxLength={MAX_NOTE_CHARS}
                          className="w-full bg-[#09090b] border border-white/[0.12] rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-white/25 transition-colors resize-none h-24"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              editNoteMutation.mutate({
                                bookId,
                                noteId: note.id,
                                note: editingNoteContent.trim(),
                              })
                            }
                            disabled={
                              editNoteMutation.isPending ||
                              !editingNoteContent.trim()
                            }
                            className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            {editNoteMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Salvar Edição"
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-300 bg-[#09090b] p-3.5 rounded-xl border border-white/[0.06] leading-relaxed whitespace-pre-wrap">
                        {note.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<MessageSquareQuote className="w-5 h-5" />}
                title="Nenhuma anotação feita"
                description="Registre ideias, citações e impressões durante a leitura."
              />
            )}
          </SurfacePanel>
        </div>

        {/* Right Column: Ritmo + Final Review */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <SurfacePanel
            accent="emerald"
            title="Ritmo de Leitura"
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            action={
              calendarTotalPages > 1 ? (
                <div className="flex items-center gap-1 text-zinc-400">
                  <button
                    type="button"
                    onClick={() => setCalendarPage((p) => Math.max(0, p - 1))}
                    disabled={calendarPage === 0}
                    className="p-1 rounded-lg hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono tabular-nums px-1">
                    {calendarPage + 1}/{calendarTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCalendarPage((p) =>
                        Math.min(calendarTotalPages - 1, p + 1),
                      )
                    }
                    disabled={calendarPage === calendarTotalPages - 1}
                    className="p-1 rounded-lg hover:bg-white/[0.06] hover:text-white disabled:opacity-30 transition-colors"
                    aria-label="Próxima página"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : null
            }
          >
            {(pageRangeLabel || pagePagesTotal > 0) && (
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-3">
                <span className="font-medium">{pageRangeLabel}</span>
                <span className="font-mono text-zinc-300 tabular-nums">
                  {pagePagesTotal} {pagePagesTotal === 1 ? "pág" : "págs"} no período
                </span>
              </div>
            )}

            <div className="grid grid-cols-10 gap-1.5 mb-4">
              {calendarDays.map((day, idx) =>
                day ? (
                  day.isEditable ? (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => {
                        setEditingDay({
                          dateKey: day.dateKey,
                          dateLabel: day.date,
                          pages: day.pages,
                        });
                        setEditingValue(String(day.pages));
                        setConfirmReversion(false);
                      }}
                      title={`${day.pages} págs • ${day.date} (clique para editar)`}
                      style={{ touchAction: "manipulation" }}
                      className="relative group/day aspect-square focus:outline-none focus:ring-1 focus:ring-white/40 rounded"
                    >
                      <div
                        className={`w-full h-full rounded border transition-colors ${day.intensityClass} cursor-pointer`}
                      />
                      <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-white/70 pointer-events-none" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[#161619] text-white text-[10px] font-medium rounded-lg opacity-0 group-hover/day:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/[0.12] z-50">
                        {day.pages > 0 ? `${day.pages} págs` : "0 págs"} •{" "}
                        {day.date}
                        <div className="text-[9px] text-emerald-400 mt-0.5">
                          Clique para editar
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div key={day.dateKey} className="relative group/day aspect-square">
                      <div
                        className={`w-full h-full rounded border ${day.intensityClass} cursor-default`}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[#161619] text-white text-[10px] font-medium rounded-lg opacity-0 group-hover/day:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/[0.12] z-50">
                        {day.pages > 0 ? `${day.pages} págs` : "0 págs"} •{" "}
                        {day.date}
                      </div>
                    </div>
                  )
                ) : (
                  <div
                    key={`empty-${idx}`}
                    className="w-full aspect-square rounded bg-transparent border border-transparent"
                  />
                ),
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>Ponto branco = editável (hoje/ontem)</span>
              <div className="flex items-center gap-1.5">
                <span>Menos</span>
                <div className="w-2.5 h-2.5 rounded bg-white/[0.04] border border-white/[0.06]" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-950/80 border border-emerald-800/50" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-700/60 border border-emerald-600/50" />
                <div className="w-2.5 h-2.5 rounded bg-emerald-500/80 border border-emerald-400/60" />
                <span>Mais</span>
              </div>
            </div>
          </SurfacePanel>

          <SurfacePanel
            title="Resenha Final"
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="flex items-baseline gap-1.5">
                <span className="text-white font-mono font-bold text-4xl leading-none tabular-nums">
                  {(hoveredRating > 0 ? hoveredRating : rating).toFixed(1)}
                </span>
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  / 5.0
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
                      className="relative p-1 select-none touch-manipulation"
                    >
                      <Star className="w-9 h-9 text-zinc-800 pointer-events-none" />

                      <div
                        className="absolute top-1 left-1 overflow-hidden pointer-events-none transition-all duration-75"
                        style={{ width: `${fillPercentage}%` }}
                      >
                        <Star className="w-9 h-9 fill-amber-400 text-amber-400" />
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
                  const activeRating =
                    hoveredRating > 0 ? hoveredRating : rating;
                  const isSelected = activeRating === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setRating(val);
                        setHoveredRating(0);
                      }}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border transition-colors ${
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

            <div className="flex flex-col gap-2 mb-5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Suas impressões gerais
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Escreva sua resenha sobre a obra. O que achou do final? Recomenda?"
                className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl p-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/25 transition-colors resize-none h-48 leading-relaxed"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const finalRating = hoveredRating > 0 ? hoveredRating : rating;
                rateMutation.mutate({
                  bookId,
                  rating: finalRating,
                  review: review.trim(),
                });
              }}
              disabled={rateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {rateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {book.rating ? "Atualizar Avaliação" : "Salvar Avaliação"}
            </button>
          </SurfacePanel>
        </div>
      </div>

      {/* Edit Day Modal */}
      {editingDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={closeEditModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-day-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#111113] border border-white/[0.08] rounded-2xl p-6"
          >
            <h3
              id="edit-day-title"
              className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-1"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Editar Ritmo
            </h3>
            <p className="text-xs text-zinc-500 mb-5">{editingDay.dateLabel}</p>

            <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
              Páginas lidas no dia
            </label>
            <input
              type="number"
              min={0}
              max={totalPages || undefined}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveDailyEdit();
                if (e.key === "Escape") closeEditModal();
              }}
              autoFocus
              placeholder="0"
              className="w-full bg-[#09090b] border border-white/[0.1] focus:border-white/25 rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none transition-colors"
            />

            {willFinish && (
              <p className="mt-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                Isto marcará o livro como finalizado.
              </p>
            )}

            {willRevert && (
              <label className="mt-3 flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmReversion}
                  onChange={(e) => setConfirmReversion(e.target.checked)}
                  className="mt-0.5 accent-amber-500"
                />
                <span>
                  Esta edição vai desmarcar o livro como finalizado. Confirmar.
                </span>
              </label>
            )}

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={closeEditModal}
                className="flex-1 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-200 rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveDailyEdit}
                disabled={
                  updateDailyMutation.isPending ||
                  isInvalid ||
                  (willRevert && !confirmReversion)
                }
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {updateDailyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar
              </button>
            </div>

            <p className="mt-4 text-[11px] text-zinc-500 text-center">
              A data original será preservada. Disponível até amanhã.
            </p>
          </div>
        </div>
      )}
    </PageShell>
  );
}
