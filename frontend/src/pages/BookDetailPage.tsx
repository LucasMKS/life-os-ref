import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { readingApi } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { SmartBookCover } from "@/components/reading/smart-book-cover";
import {
  ArrowLeft,
  BookOpen,
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
  const bookId = params.id as string;

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
      if (book.review) {
        setReview(book.review);
      }
    }
  }, [book?.id]);

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
    if (!book || book.status !== "READING" || !book.sessions || book.sessions.length === 0) return null;
    
    // Calculate average pages read on active reading days
    const activeSessions = book.sessions.filter((s: any) => s.pagesRead > 0);
    if (activeSessions.length === 0) return null;
    
    const totalPagesLogged = activeSessions.reduce((acc: number, curr: any) => acc + curr.pagesRead, 0);
    const averagePagesPerSession = totalPagesLogged / activeSessions.length;
    
    const remainingPages = book.totalPages - book.readPages;
    if (remainingPages <= 0) return null;
    
    const estimatedDaysRemaining = Math.ceil(remainingPages / averagePagesPerSession);
    
    // Calculate estimated completion date
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
      dateStr: formattedDate
    };
  };

  const generateReadingCalendar = () => {
    if (!book) return { days: [], totalPages: 0 };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line
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
    const readingMap = new Map();

    if (book.sessions) {
      book.sessions.forEach((s: any) => {
        const dateStr = toLocalDateKey(new Date(s.sessionDate));
        readingMap.set(dateStr, (readingMap.get(dateStr) || 0) + s.pagesRead);
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

      let intensityClass = "bg-white/5 border-white/5";
      if (pages > 0 && pages <= 10)
        intensityClass = "bg-emerald-900/40 border-emerald-800/50";
      else if (pages > 10 && pages <= 30)
        intensityClass = "bg-emerald-700/60 border-emerald-600/50";
      else if (pages > 30)
        intensityClass =
          "bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]";

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
    const paginatedSlice = allDays.slice(
      calendarPage * PAGE_SIZE,
      (calendarPage + 1) * PAGE_SIZE,
    );
    while (paginatedSlice.length < PAGE_SIZE) paginatedSlice.push(null as any);

    return { days: paginatedSlice, totalPages };
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

  const { days: calendarDays, totalPages: calendarTotalPages } =
    generateReadingCalendar();

  useEffect(() => {
    if (calendarTotalPages > 0 && calendarPage === 0)
      setCalendarPage(calendarTotalPages - 1);
  }, [calendarTotalPages, calendarPage]);

  useEffect(() => {
    if (editingDay) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editingDay]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </main>
    );
  }

  if (!book) return null;

  const progressPercent = Math.round((book.readPages / book.totalPages) * 100);
  const remainingNoteChars = MAX_NOTE_CHARS - newNote.length;
  const duration = getReadingDuration();

  const handleEditClick = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.note);
  };

  const newDayTotal = Number(editingValue) || 0;
  const oldDayTotal = editingDay?.pages ?? 0;
  const projectedReadPages = Math.max(
    0,
    Math.min(
      book.totalPages > 0 ? book.totalPages : Number.MAX_SAFE_INTEGER,
      book.readPages - oldDayTotal + newDayTotal,
    ),
  );
  const willFinish =
    book.totalPages > 0 &&
    projectedReadPages >= book.totalPages &&
    book.status !== "READ";
  const willRevert =
    book.status === "READ" && projectedReadPages < book.totalPages;
  const isInvalid =
    editingValue.trim() === "" ||
    newDayTotal < 0 ||
    (book.totalPages > 0 && newDayTotal > book.totalPages);

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

  return (
    <main className="min-h-screen flex flex-col relative bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30 overflow-x-hidden pb-20">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-emerald-900/10 blur-[120px] pointer-events-none -mt-20"></div>

      <Navbar />

      <div className="z-10 w-full max-w-[1200px] mx-auto mt-4 md:mt-12 px-4 md:px-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 font-medium text-sm mb-5 md:mb-8 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para a Estante
        </button>

        {/* CABEÇALHO DO LIVRO */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12 mb-8 md:mb-12">
          <div className="w-48 md:w-64 lg:w-72 shrink-0 mx-auto lg:mx-0 flex flex-col gap-2">
            <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] border border-white/10 group/cover">
              <SmartBookCover
                url={book.coverUrl}
                title={book.title}
                className="w-full h-auto object-cover"
              />
              <button
                onClick={() => { setIsEditingCover(true); setCoverUrlInput(""); }}
                className="absolute bottom-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-zinc-400 hover:text-white rounded-lg border border-white/10 opacity-0 group-hover/cover:opacity-100 transition-all backdrop-blur-sm"
                title="Alterar capa"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {isEditingCover && (
              <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                <input
                  type="url"
                  value={coverUrlInput}
                  onChange={(e) => setCoverUrlInput(e.target.value)}
                  placeholder="Cole o link da imagem..."
                  autoFocus
                  className="w-full bg-black/60 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && coverUrlInput.trim())
                      updateCoverMutation.mutate({ bookId, coverUrl: coverUrlInput.trim() });
                    if (e.key === "Escape") setIsEditingCover(false);
                  }}
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => updateCoverMutation.mutate({ bookId, coverUrl: coverUrlInput.trim() })}
                    disabled={!coverUrlInput.trim() || updateCoverMutation.isPending}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    {updateCoverMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsEditingCover(false)}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center flex-grow min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border backdrop-blur-md ${book.status === "READ" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}
              >
                {book.status === "READ" ? "Finalizado" : "Lendo Agora"}
              </span>
              {book.genres?.map((genre: string) => (
                <span
                  key={genre}
                  className="text-[10px] text-zinc-400 font-semibold bg-white/5 px-2 py-1 rounded-md"
                >
                  {genre}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 text-white leading-tight">
              {book.title}
            </h1>
            {book.subtitle && (
              <h2 className="text-lg md:text-xl text-zinc-300 font-medium tracking-tight mb-3 line-clamp-2">
                {book.subtitle}
              </h2>
            )}

            <div className="flex items-center gap-2 group/author mb-6">
              {isEditingAuthor ? (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <input
                    type="text"
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    placeholder="Nome do autor..."
                    autoFocus
                    className="bg-black/60 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-colors w-48 md:w-64"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateAuthorMutation.mutate({ bookId, author: authorInput.trim() });
                      }
                      if (e.key === "Escape") setIsEditingAuthor(false);
                    }}
                  />
                  <button
                    onClick={() => updateAuthorMutation.mutate({ bookId, author: authorInput.trim() })}
                    disabled={updateAuthorMutation.isPending}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
                    title="Salvar"
                  >
                    {updateAuthorMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setIsEditingAuthor(false)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-emerald-400 text-base md:text-lg font-medium tracking-wide">
                    {book.author}
                  </p>
                  <button
                    onClick={() => {
                      setIsEditingAuthor(true);
                      setAuthorInput(book.author === "Autor Desconhecido" ? "" : book.author);
                    }}
                    className="p-1 bg-transparent text-zinc-500 hover:text-emerald-400 rounded transition-all opacity-0 group-hover/author:opacity-100 focus:opacity-100"
                    title="Alterar autor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-zinc-400 font-medium">
              {book.publisher && (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-zinc-500" />
                  {book.publisher}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-zinc-500" />
                {book.totalPages} páginas
              </div>
            </div>

            {/* Painel Central Analítico: Progresso e Tempo de Tela */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-5 w-full">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                  Progresso
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {book.readPages} / {book.totalPages} págs
                </span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/5 mb-4">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {/* "Tempo de Tela" */}
              {duration !== null && (
                <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500 font-medium">
                    <div className="flex gap-6">
                      <div>
                        <span className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">
                          Início
                        </span>
                        <span className="text-zinc-300">
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
                          <span className="block text-[9px] uppercase tracking-widest text-zinc-600 mb-0.5">
                            Término
                          </span>
                          <span className="text-zinc-300">
                            {new Date(book.finishedAt).toLocaleDateString(
                              "pt-BR",
                              { day: "2-digit", month: "short", year: "numeric" },
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {book.finishedAt ? (
                      <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg border border-amber-500/20">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-bold">
                          {duration} {duration === 1 ? "dia" : "dias"} de
                          leitura
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-emerald-950/60 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-800/40">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="font-bold">
                          Lendo há {duration} {duration === 1 ? "dia" : "dias"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Est. de Término */}
                  {!book.finishedAt && book.status === "READING" && (() => {
                    const est = getEstimationText();
                    if (!est) return null;
                    return (
                      <div className="flex items-center justify-between text-[11px] bg-white/5 border border-white/5 rounded-xl p-3 text-zinc-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">Ritmo médio:</span>
                          <span className="text-white font-mono font-bold">{est.avg} págs/dia lido</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-right">
                          <span>Término est.:</span>
                          <span className="text-white font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{est.dateStr}</span>
                          <span className="text-[10px] text-zinc-500">({est.days}d)</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[340px] shrink-0 flex flex-col justify-end">
            <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 md:p-6 shadow-xl h-fit">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Ritmo
                </h3>
                {calendarTotalPages > 1 && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <button
                      onClick={() => setCalendarPage((p) => Math.max(0, p - 1))}
                      disabled={calendarPage === 0}
                      className="p-1 hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-medium">
                      {calendarPage + 1}/{calendarTotalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCalendarPage((p) =>
                          Math.min(calendarTotalPages - 1, p + 1),
                        )
                      }
                      disabled={calendarPage === calendarTotalPages - 1}
                      className="p-1 hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-10 gap-1.5 mb-5">
                {calendarDays.map((day, idx) =>
                  day ? (
                    day.isEditable ? (
                      <button
                        key={idx}
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
                        title="Clique para editar"
                        style={{ touchAction: "manipulation" }}
                        className="relative group/day aspect-square focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-[3px]"
                      >
                        <div
                          className={`w-full h-full rounded-[3px] border transition-all duration-300 ${day.intensityClass} group-hover/day:scale-110 cursor-pointer`}
                        ></div>
                        <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-white/60 pointer-events-none"></span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-black text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/day:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 z-50">
                          {day.pages > 0 ? `${day.pages} págs` : "0 págs"} •{" "}
                          {day.date}
                          <div className="text-[9px] font-medium text-emerald-400 mt-0.5">
                            Clique para editar
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black"></div>
                        </div>
                      </button>
                    ) : (
                      <div
                        key={idx}
                        className="relative group/day aspect-square"
                      >
                        <div
                          className={`w-full h-full rounded-[3px] border transition-all duration-300 ${day.intensityClass} group-hover/day:scale-110 cursor-default`}
                        ></div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-black text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/day:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 z-50">
                          {day.pages > 0 ? `${day.pages} págs` : "0 págs"} •{" "}
                          {day.date}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black"></div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div
                      key={idx}
                      className="w-full aspect-square rounded-[3px] bg-transparent border border-transparent"
                    ></div>
                  ),
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[9px] text-zinc-600 justify-end font-medium">
                <span>Menos</span>
                <div className="w-2.5 h-2.5 rounded bg-white/5 border border-white/5"></div>
                <div className="w-2.5 h-2.5 rounded bg-emerald-900/40 border border-emerald-800/50"></div>
                <div className="w-2.5 h-2.5 rounded bg-emerald-700/60 border border-emerald-600/50"></div>
                <div className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                <span>Mais</span>
              </div>
            </div>
          </div>
        </div>

        {/* PARTE INFERIOR (Anotações e Resenha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          {/* COLUNA ESQUERDA: ANOTAÇÕES COM CRUD */}
          <div className="lg:col-span-7 flex flex-col gap-6 md:gap-8 h-fit">
            <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-5 md:p-8 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                <MessageSquareQuote className="w-4 h-4 text-emerald-400" />{" "}
                Minhas Anotações
              </h3>

              <div className="flex flex-col gap-2 mb-8">
                <div className="relative">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    maxLength={MAX_NOTE_CHARS}
                    placeholder="Anotação rápida (Ex: O plot twist da pág 142 me pegou de surpresa...)"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 pb-8 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none h-24 scrollbar-thin"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newNote.trim()) {
                          addNoteMutation.mutate({ bookId, note: newNote });
                        }
                      }
                    }}
                  />
                  <span
                    className={`absolute bottom-3 right-4 text-[10px] font-bold ${remainingNoteChars < 20 ? "text-red-400" : "text-zinc-600"}`}
                  >
                    {remainingNoteChars}
                  </span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      addNoteMutation.mutate({ bookId, note: newNote })
                    }
                    disabled={!newNote.trim() || addNoteMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {addNoteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Adicionar Nota"
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-6 border-l-2 border-white/5 ml-2 pl-5 mt-4">
                {book.notes?.length > 0 ? (
                  book.notes.map((note: any) => (
                    <div key={note.id} className="relative group/note">
                      <div className="absolute -left-[27px] top-1 w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-[#121214]"></div>

                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-emerald-500 font-bold">
                          {new Date(note.createdAt).toLocaleDateString(
                            "pt-BR",
                            {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>

                        {/* Botões de Ação (sempre visíveis em mobile, hover em desktop) */}
                        {editingNoteId !== note.id && (
                          <div className="opacity-100 lg:opacity-0 lg:group-hover/note:opacity-100 transition-opacity flex gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                            <button
                              onClick={() => handleEditClick(note)}
                              className="text-zinc-400 hover:text-emerald-400 transition-colors p-2"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Apagar anotação?"))
                                  deleteNoteMutation.mutate({
                                    bookId,
                                    noteId: note.id,
                                  });
                              }}
                              className="text-zinc-400 hover:text-red-400 transition-colors p-2"
                              title="Apagar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Alterna entre Modo de Visualização e Modo de Edição */}
                      {editingNoteId === note.id ? (
                        <div className="flex flex-col gap-2 mt-2">
                          <textarea
                            value={editingNoteContent}
                            onChange={(e) =>
                              setEditingNoteContent(e.target.value)
                            }
                            maxLength={MAX_NOTE_CHARS}
                            className="w-full bg-black/60 border border-emerald-500/30 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500/70 transition-colors resize-none h-24 scrollbar-thin"
                          />
                          <div className="flex justify-end gap-2 mt-1">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() =>
                                editNoteMutation.mutate({
                                  bookId,
                                  noteId: note.id,
                                  note: editingNoteContent,
                                })
                              }
                              disabled={
                                editNoteMutation.isPending ||
                                !editingNoteContent.trim()
                              }
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              {editNoteMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Salvar Edição"
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-300 bg-black/20 p-4 rounded-xl border border-white/5 leading-relaxed">
                          {note.note}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-xs font-medium italic bg-white/5 p-4 rounded-xl border border-dashed border-white/10">
                    Nenhuma anotação feita durante a leitura.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: RESENHA FINAL */}
          <div className="lg:col-span-5">
            <div className="bg-[#121214]/80 backdrop-blur-xl border border-white/5 border-t-amber-500/50 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col sticky top-24">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-8">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> Resenha
                Final
              </h3>

              <div className="flex flex-col items-center gap-3 mb-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-amber-500 font-mono font-bold text-4xl md:text-5xl leading-none">
                    {(hoveredRating > 0 ? hoveredRating : rating).toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
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
                        className="relative p-1 select-none transition-transform hover:scale-110 touch-manipulation"
                      >
                        {/* Estrela de fundo */}
                        <Star className="w-10 h-10 md:w-11 md:h-11 text-zinc-800 pointer-events-none" />

                        {/* Estrela preenchida proporcionalmente */}
                        <div
                          className="absolute top-1 left-1 overflow-hidden pointer-events-none transition-all duration-75"
                          style={{ width: `${fillPercentage}%` }}
                        >
                          <Star className="w-10 h-10 md:w-11 md:h-11 fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]" />
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

                {/* Atalhos de notas rápidas */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
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
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                          isSelected
                            ? "bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {val.toFixed(1)} ★
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-8">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                  Suas impressões gerais
                </span>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Escreva sua resenha definitiva sobre a obra. O que achou do final? Recomenda?"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 md:p-5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors shadow-inner resize-none h-64 scrollbar-thin leading-relaxed"
                />
              </div>

              <button
                onClick={() => {
                  const finalRating = hoveredRating > 0 ? hoveredRating : rating;
                  rateMutation.mutate({ bookId, rating: finalRating, review });
                }}
                disabled={rateMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black py-4 rounded-xl text-sm font-extrabold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                {rateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {book.rating ? "Atualizar Avaliação" : "Salvar Avaliação"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {editingDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={closeEditModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-day-title"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#121214] border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
          >
            <h3
              id="edit-day-title"
              className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-1"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Editar
              Ritmo
            </h3>
            <p className="text-xs text-zinc-500 mb-5">{editingDay.dateLabel}</p>

            <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">
              Páginas lidas no dia
            </label>
            <input
              type="number"
              min={0}
              max={book.totalPages || undefined}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveDailyEdit();
                if (e.key === "Escape") closeEditModal();
              }}
              autoFocus
              placeholder="0"
              className="w-full bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none transition-colors"
            />

            {willFinish && (
              <p className="mt-3 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                Isto marcará o livro como finalizado.
              </p>
            )}

            {willRevert && (
              <label className="mt-3 flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 cursor-pointer">
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
                onClick={closeEditModal}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveDailyEdit}
                disabled={
                  updateDailyMutation.isPending ||
                  isInvalid ||
                  (willRevert && !confirmReversion)
                }
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {updateDailyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar
              </button>
            </div>

            <p className="mt-4 text-[10px] text-zinc-600 text-center">
              A data original será preservada. Disponível até amanhã.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
