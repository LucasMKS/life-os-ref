import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Bold,
  Code,
  Edit3,
  Eye,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Notebook,
  Pin,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { notesApi } from "@/lib/api";
import { sanitizeUrl } from "@/lib/security";
import {
  EmptyState,
  FilterPill,
  SurfacePanel,
} from "@/components/ui/page-shell";
import { SafeMarkdown } from "./safe-markdown";

interface QuickNote {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  color: string;
  pinned: boolean;
  createdAt: string;
}

type NoteFilter = "ALL" | "PINNED" | "WITH_IMAGE";

interface ColorOption {
  id: string;
  label: string;
  dot: string;
  pill: string;
}

const NOTE_COLORS: ColorOption[] = [
  { id: "zinc", label: "Neutro", dot: "bg-zinc-400", pill: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20" },
  { id: "teal", label: "Teal", dot: "bg-teal-400", pill: "bg-teal-500/10 text-teal-300 border-teal-500/20" },
  { id: "emerald", label: "Verde", dot: "bg-emerald-400", pill: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  { id: "blue", label: "Azul", dot: "bg-blue-400", pill: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  { id: "amber", label: "Âmbar", dot: "bg-amber-400", pill: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  { id: "purple", label: "Roxo", dot: "bg-purple-400", pill: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
  { id: "rose", label: "Rosa", dot: "bg-rose-400", pill: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
];

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function formatNoteDate(dateStr?: string): string {
  if (!dateStr) return "";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getColorOption(colorId?: string): ColorOption {
  return NOTE_COLORS.find((c) => c.id === colorId) || NOTE_COLORS[0];
}

function SafeAttachmentImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const safeSrc = sanitizeUrl(src);

  if (!safeSrc) return null;

  if (failed) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#09090b] px-4 py-6 text-center text-xs text-zinc-500">
        Não foi possível carregar a imagem anexada.
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#09090b]">
      <img
        src={safeSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="w-full max-h-[320px] object-contain mx-auto"
      />
    </div>
  );
}

export function NotesDashboard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Filter & navigation state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<NoteFilter>("ALL");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);

  // Create mode state
  const [isCreating, setIsCreating] = useState(false);
  const [createPreview, setCreatePreview] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("zinc");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageMode, setImageMode] = useState<"UPLOAD" | "URL">("UPLOAD");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Edit mode state (inline in right pane)
  const [isEditing, setIsEditing] = useState(false);
  const [editPreview, setEditPreview] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState("zinc");

  // Delete confirmation modal
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // Revoke object URL on change/unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const { data: rawNotes = [], isLoading } = useQuery<QuickNote[]>({
    queryKey: ["quick-notes"],
    queryFn: notesApi.getNotes,
  });

  const notes = useMemo(
    () => (Array.isArray(rawNotes) ? rawNotes : []),
    [rawNotes],
  );

  const sortedAndFilteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...notes]
      .filter((note) => {
        if (activeFilter === "PINNED" && !note.pinned) return false;
        if (activeFilter === "WITH_IMAGE" && !sanitizeUrl(note.imageUrl)) {
          return false;
        }
        if (!query) return true;
        const noteTitle = (note.title || "").toLowerCase();
        const noteContent = (note.content || "").toLowerCase();
        return noteTitle.includes(query) || noteContent.includes(query);
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
  }, [notes, searchQuery, activeFilter]);

  const selectedNote = useMemo(() => {
    if (isCreating) return null;
    return (
      notes.find((n) => n.id === selectedNoteId) ||
      sortedAndFilteredNotes[0] ||
      null
    );
  }, [isCreating, notes, selectedNoteId, sortedAndFilteredNotes]);

  const resetCreateForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setTitle("");
    setContent("");
    setImageUrl("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedColor("zinc");
    setShowImageInput(false);
    setCreatePreview(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createMutation = useMutation({
    mutationFn: notesApi.createNote,
    onSuccess: (created: QuickNote | undefined) => {
      toast.success("Nota salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["quick-notes"] });
      resetCreateForm();
      setIsCreating(false);
      if (created?.id) {
        setSelectedNoteId(created.id);
      }
    },
    onError: () => toast.error("Erro ao salvar anotação."),
  });

  const deleteMutation = useMutation({
    mutationFn: notesApi.deleteNote,
    onSuccess: (_data, deletedId) => {
      toast.success("Nota excluída.");
      queryClient.invalidateQueries({ queryKey: ["quick-notes"] });
      if (selectedNoteId === deletedId) {
        setSelectedNoteId(null);
        setIsEditing(false);
        setMobileShowEditor(false);
      }
    },
    onError: () => toast.error("Erro ao excluir anotação."),
  });

  const updateMutation = useMutation({
    mutationFn: notesApi.updateNote,
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: ["quick-notes"] });
      const previousNotes = queryClient.getQueryData<QuickNote[]>(["quick-notes"]);
      queryClient.setQueryData<QuickNote[]>(["quick-notes"], (old) =>
        old?.map((n) => (n.id === newNote.id ? newNote : n)),
      );
      return { previousNotes };
    },
    onError: (_err, _newNote, context) => {
      queryClient.setQueryData(["quick-notes"], context?.previousNotes);
      toast.error("Erro ao atualizar a nota.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-notes"] });
    },
  });

  const startNewNote = () => {
    resetCreateForm();
    setIsEditing(false);
    setIsCreating(true);
    setMobileShowEditor(true);
    setTimeout(() => createTextareaRef.current?.focus(), 50);
  };

  const cancelNewNote = () => {
    resetCreateForm();
    setIsCreating(false);
    setMobileShowEditor(false);
  };

  const selectNote = (note: QuickNote) => {
    setIsCreating(false);
    setIsEditing(false);
    setEditPreview(false);
    setSelectedNoteId(note.id);
    setMobileShowEditor(true);
  };

  const startEditingNote = (note: QuickNote) => {
    setEditTitle(note.title || "");
    setEditContent(note.content || "");
    setEditColor(note.color || "zinc");
    setEditPreview(false);
    setIsEditing(true);
    setTimeout(() => editTextareaRef.current?.focus(), 50);
  };

  const handleUpdateEdit = () => {
    if (!selectedNote) return;
    if (!editContent.trim()) {
      toast.error("O conteúdo não pode estar vazio.");
      return;
    }

    updateMutation.mutate(
      {
        ...selectedNote,
        title: editTitle.trim(),
        content: editContent,
        color: editColor,
      },
      {
        onSuccess: () => {
          toast.success("Nota atualizada!");
          setIsEditing(false);
        },
      },
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("A imagem deve ter no máximo 10 MB.");
      e.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setImageUrl("");
  };

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = () => {
    const trimmedContent = content.trim();
    const trimmedUrl = imageUrl.trim();

    if (!trimmedContent && !trimmedUrl && !selectedFile) {
      toast.error("Escreva algo ou anexe uma imagem.");
      return;
    }

    if (imageMode === "URL" && trimmedUrl) {
      const safeImageUrl = sanitizeUrl(trimmedUrl);
      if (!safeImageUrl) {
        toast.error("URL de imagem inválida. Use http:// ou https://.");
        return;
      }
    }

    const formData = new FormData();
    if (title.trim()) formData.append("title", title.trim());
    formData.append("content", content);
    formData.append("color", selectedColor);

    if (imageMode === "UPLOAD" && selectedFile) {
      formData.append("file", selectedFile);
    } else if (imageMode === "URL" && trimmedUrl) {
      const safeImageUrl = sanitizeUrl(trimmedUrl);
      if (safeImageUrl) {
        formData.append("imageUrl", safeImageUrl);
      }
    }

    createMutation.mutate(formData);
  };

  const togglePin = (note: QuickNote) => {
    updateMutation.mutate({ ...note, pinned: !note.pinned });
  };

  const confirmDelete = () => {
    if (!noteToDelete) return;
    deleteMutation.mutate(noteToDelete);
    setNoteToDelete(null);
  };

  const insertFormatting = (
    target: "create" | "edit",
    prefix: string,
    suffix: string = "",
  ) => {
    const textarea =
      target === "create" ? createTextareaRef.current : editTextareaRef.current;
    const currentText = target === "create" ? content : editContent;
    const setText = target === "create" ? setContent : setEditContent;

    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = currentText.substring(0, start);
    const selected = currentText.substring(start, end);
    const after = currentText.substring(end);

    setText(before + prefix + selected + suffix + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length,
      );
    }, 0);
  };

  const handleListEnter = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    value: string,
    setValue: (next: string) => void,
  ) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const textarea = e.currentTarget;
    const { selectionStart } = textarea;
    const textBeforeCursor = value.substring(0, selectionStart);
    const lines = textBeforeCursor.split("\n");
    const currentLine = lines[lines.length - 1];
    const match = currentLine.match(/^(\s*(?:[-*+]|\d+[.)])\s+)/i);

    if (!match) return;
    e.preventDefault();
    const prefix = match[1];

    if (currentLine.trim() === prefix.trim()) {
      const newValue =
        value.substring(0, selectionStart - currentLine.length) +
        "\n" +
        value.substring(selectionStart);
      setValue(newValue);
      const newCursorPos = selectionStart - currentLine.length + 1;
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
      return;
    }

    let newPrefix = prefix;
    const numMatch = prefix.match(/^(\s*)(\d+)([.)]\s+)$/);
    if (numMatch) {
      const nextNum = parseInt(numMatch[2], 10) + 1;
      newPrefix = `${numMatch[1]}${nextNum}${numMatch[3]}`;
    }

    const newValue =
      value.substring(0, selectionStart) +
      "\n" +
      newPrefix +
      value.substring(selectionStart);
    setValue(newValue);

    const newCursorPos = selectionStart + 1 + newPrefix.length;
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
    }, 0);
  };

  const renderMarkdownToolbar = (target: "create" | "edit") => (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
      <button
        type="button"
        onClick={() => insertFormatting(target, "**", "**")}
        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors shrink-0"
        title="Negrito"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertFormatting(target, "*", "*")}
        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors shrink-0"
        title="Itálico"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertFormatting(target, "`", "`")}
        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors shrink-0"
        title="Código"
      >
        <Code className="w-4 h-4" />
      </button>
      <div className="w-px h-4 bg-white/[0.08] mx-1 shrink-0" />
      <button
        type="button"
        onClick={() => insertFormatting(target, "- ")}
        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors shrink-0"
        title="Lista"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => insertFormatting(target, "1. ")}
        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors shrink-0"
        title="Lista numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );

  const pinnedCount = notes.filter((n) => n.pinned).length;
  const withImageCount = notes.filter((n) => Boolean(sanitizeUrl(n.imageUrl))).length;

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* TOP TOOLBAR */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            mobileShowEditor ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título ou conteúdo..."
                className="w-full bg-[#111113] border border-white/[0.06] focus:border-teal-500/40 rounded-xl pl-10 pr-9 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200 rounded-md"
                  aria-label="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
              <FilterPill
                active={activeFilter === "ALL"}
                onClick={() => setActiveFilter("ALL")}
                accent="teal"
              >
                Todas ({notes.length})
              </FilterPill>
              <FilterPill
                active={activeFilter === "PINNED"}
                onClick={() => setActiveFilter("PINNED")}
                accent="teal"
              >
                Fixadas ({pinnedCount})
              </FilterPill>
              <FilterPill
                active={activeFilter === "WITH_IMAGE"}
                onClick={() => setActiveFilter("WITH_IMAGE")}
                accent="teal"
              >
                Com imagem ({withImageCount})
              </FilterPill>
            </div>
          </div>

          <button
            type="button"
            onClick={startNewNote}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 text-zinc-950 hover:bg-teal-400 font-semibold text-sm rounded-xl transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Nota
          </button>
        </div>

        {/* MAIN TWO-PANE WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT PANE: NOTES LIST */}
          <div
            className={`lg:col-span-4 ${
              mobileShowEditor ? "hidden lg:block" : "block"
            }`}
          >
            <SurfacePanel
              title="Suas notas"
              icon={<Notebook className="w-3.5 h-3.5 text-teal-400" />}
              accent="teal"
              action={
                <span className="text-[11px] font-medium text-zinc-500 tabular-nums">
                  {sortedAndFilteredNotes.length}
                </span>
              }
              noPadding
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                </div>
              ) : sortedAndFilteredNotes.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    icon={<Notebook className="w-5 h-5" />}
                    title={
                      notes.length === 0
                        ? "Nenhuma nota ainda"
                        : "Nenhum resultado"
                    }
                    description={
                      notes.length === 0
                        ? "Crie sua primeira anotação para organizar ideias e referências."
                        : "Tente ajustar sua busca ou filtro."
                    }
                    action={
                      notes.length === 0 ? (
                        <button
                          type="button"
                          onClick={startNewNote}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Criar nota
                        </button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06] max-h-[65vh] lg:max-h-[calc(100vh-280px)] overflow-y-auto">
                  {sortedAndFilteredNotes.map((note) => {
                    const isSelected = !isCreating && selectedNote?.id === note.id;
                    const colorOpt = getColorOption(note.color);
                    const hasSafeImage = Boolean(sanitizeUrl(note.imageUrl));
                    const previewText = (note.content || "")
                      .replace(/[#*_`>[\]]/g, "")
                      .trim();

                    return (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => selectNote(note)}
                        className={`w-full text-left px-4 py-3.5 transition-colors flex flex-col gap-1.5 border-l-2 ${
                          isSelected
                            ? "bg-teal-500/[0.08] border-l-teal-400"
                            : "border-l-transparent hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${colorOpt.dot}`}
                            />
                            <span className="text-sm font-medium text-zinc-100 truncate">
                              {note.title?.trim() || "Sem título"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-zinc-500">
                            {hasSafeImage && (
                              <ImageIcon className="w-3.5 h-3.5" />
                            )}
                            {note.pinned && (
                              <Pin className="w-3.5 h-3.5 text-teal-400" />
                            )}
                          </div>
                        </div>

                        {previewText && (
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {previewText}
                          </p>
                        )}

                        <span className="text-[11px] text-zinc-500">
                          {formatNoteDate(note.createdAt)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </SurfacePanel>
          </div>

          {/* RIGHT PANE: DISTRACTION-FREE EDITOR / VIEWER */}
          <div
            className={`lg:col-span-8 ${
              mobileShowEditor ? "block" : "hidden lg:block"
            }`}
          >
            {/* CREATE MODE */}
            {isCreating ? (
              <SurfacePanel accent="teal" noPadding>
                <div className="px-4 sm:px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={cancelNewNote}
                      className="lg:hidden p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
                      aria-label="Voltar"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                      Nova Anotação
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCreatePreview((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
                    >
                      {createPreview ? (
                        <>
                          <Edit3 className="w-3.5 h-3.5" /> Editar
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Visualizar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Título (opcional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent text-lg sm:text-xl font-semibold text-white placeholder:text-zinc-600 focus:outline-none pb-3 border-b border-white/[0.06]"
                  />

                  {!createPreview && (
                    <div className="flex items-center justify-between gap-2 pb-1">
                      {renderMarkdownToolbar("create")}
                      <button
                        type="button"
                        onClick={() => setShowImageInput((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                          showImageInput
                            ? "bg-white/[0.1] text-white"
                            : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Imagem
                      </button>
                    </div>
                  )}

                  {showImageInput && !createPreview && (
                    <div className="p-3.5 rounded-xl bg-[#09090b] border border-white/[0.06] space-y-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImageMode("UPLOAD")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                            imageMode === "UPLOAD"
                              ? "bg-white/[0.1] text-white"
                              : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" /> Arquivo local
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageMode("URL")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                            imageMode === "URL"
                              ? "bg-white/[0.1] text-white"
                              : "text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> Link da web
                        </button>
                      </div>

                      {imageMode === "URL" ? (
                        <input
                          type="url"
                          placeholder="https://exemplo.com/imagem.png"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="w-full bg-[#111113] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/20"
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 bg-[#111113] border border-white/[0.08] hover:border-white/[0.16] rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 text-left flex items-center justify-between gap-2 transition-colors"
                          >
                            <span className="truncate">
                              {selectedFile
                                ? selectedFile.name
                                : "Selecionar imagem (máx. 10 MB)..."}
                            </span>
                            <Upload className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          </button>

                          {previewUrl && (
                            <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-white/[0.12]">
                              <img
                                src={previewUrl}
                                alt="Pré-visualização"
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={removeSelectedFile}
                                className="absolute top-0.5 right-0.5 bg-black/80 rounded-full p-0.5 text-zinc-200 hover:text-white"
                                aria-label="Remover imagem"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {createPreview ? (
                    <div className="min-h-[260px] py-2 text-sm">
                      {content.trim() ? (
                        <SafeMarkdown content={content} />
                      ) : (
                        <p className="text-zinc-500 italic">
                          Nada para visualizar ainda.
                        </p>
                      )}
                    </div>
                  ) : (
                    <textarea
                      ref={createTextareaRef}
                      placeholder="Comece a escrever... Suporta Markdown."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onKeyDown={(e) => handleListEnter(e, content, setContent)}
                      className="w-full min-h-[260px] bg-transparent text-sm sm:text-[15px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-y leading-relaxed"
                    />
                  )}
                </div>

                <div className="px-4 sm:px-6 py-3.5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 mr-1">Etiqueta:</span>
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.id)}
                        className={`w-5 h-5 rounded-full ${c.dot} transition-transform ${
                          selectedColor === c.id
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#111113] scale-110"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        title={c.label}
                        aria-label={`Cor ${c.label}`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={cancelNewNote}
                      className="px-4 py-2 text-xs font-medium bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={
                        createMutation.isPending ||
                        (!content.trim() && !imageUrl.trim() && !selectedFile)
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-zinc-950 hover:bg-teal-400 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Salvar Nota
                    </button>
                  </div>
                </div>
              </SurfacePanel>
            ) : selectedNote ? (
              /* VIEW / EDIT EXISTING NOTE */
              <SurfacePanel noPadding>
                {/* Header */}
                <div className="px-4 sm:px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setMobileShowEditor(false);
                      }}
                      className="lg:hidden p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
                      aria-label="Voltar para lista"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                        getColorOption(isEditing ? editColor : selectedNote.color).pill
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          getColorOption(isEditing ? editColor : selectedNote.color).dot
                        }`}
                      />
                      {getColorOption(isEditing ? editColor : selectedNote.color).label}
                    </span>
                    <span className="text-xs text-zinc-500 truncate">
                      {formatNoteDate(selectedNote.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => setEditPreview((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
                      >
                        {editPreview ? (
                          <>
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Visualizar
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingNote(selectedNote)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => togglePin(selectedNote)}
                      className={`p-2 rounded-xl border transition-colors ${
                        selectedNote.pinned
                          ? "bg-teal-500/15 text-teal-300 border-teal-500/30"
                          : "bg-white/[0.05] text-zinc-400 border-white/[0.08] hover:text-zinc-200"
                      }`}
                      title={selectedNote.pinned ? "Desfixar" : "Fixar"}
                      aria-label={selectedNote.pinned ? "Desfixar nota" : "Fixar nota"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setNoteToDelete(selectedNote.id)}
                      className="p-2 rounded-xl bg-white/[0.05] text-zinc-400 border border-white/[0.08] hover:text-red-400 hover:border-red-500/30 transition-colors"
                      title="Excluir nota"
                      aria-label="Excluir nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 space-y-5">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        placeholder="Título (opcional)"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-transparent text-lg sm:text-xl font-semibold text-white placeholder:text-zinc-600 focus:outline-none pb-3 border-b border-white/[0.06]"
                      />

                      {!editPreview && (
                        <div className="pb-1">{renderMarkdownToolbar("edit")}</div>
                      )}

                      {editPreview ? (
                        <div className="min-h-[280px] text-sm">
                          <SafeMarkdown content={editContent} />
                        </div>
                      ) : (
                        <textarea
                          ref={editTextareaRef}
                          placeholder="Conteúdo da nota..."
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) =>
                            handleListEnter(e, editContent, setEditContent)
                          }
                          className="w-full min-h-[280px] bg-transparent text-sm sm:text-[15px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-y leading-relaxed"
                        />
                      )}
                    </>
                  ) : (
                    <>
                      {selectedNote.title?.trim() && (
                        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                          {selectedNote.title}
                        </h2>
                      )}

                      {selectedNote.imageUrl && (
                        <SafeAttachmentImage
                          key={selectedNote.imageUrl}
                          src={selectedNote.imageUrl}
                          alt={selectedNote.title || "Anexo da nota"}
                        />
                      )}

                      <div className="text-sm sm:text-[15px] leading-relaxed">
                        {selectedNote.content?.trim() ? (
                          <SafeMarkdown content={selectedNote.content} />
                        ) : (
                          <p className="text-zinc-500 italic">
                            Nota sem conteúdo de texto.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Edit Footer */}
                {isEditing && (
                  <div className="px-4 sm:px-6 py-3.5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 mr-1">Etiqueta:</span>
                      {NOTE_COLORS.map((c) => (
                        <button
                          key={`edit-${c.id}`}
                          type="button"
                          onClick={() => setEditColor(c.id)}
                          className={`w-5 h-5 rounded-full ${c.dot} transition-transform ${
                            editColor === c.id
                              ? "ring-2 ring-white ring-offset-2 ring-offset-[#111113] scale-110"
                              : "opacity-60 hover:opacity-100"
                          }`}
                          title={c.label}
                          aria-label={`Cor ${c.label}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-xs font-medium bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] rounded-xl transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleUpdateEdit}
                        disabled={updateMutation.isPending || !editContent.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-zinc-950 hover:bg-teal-400 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
                      >
                        {updateMutation.isPending && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        )}
                        Salvar alterações
                      </button>
                    </div>
                  </div>
                )}
              </SurfacePanel>
            ) : (
              /* NO SELECTION STATE (DESKTOP) */
              <EmptyState
                icon={<Notebook className="w-5 h-5" />}
                title="Selecione uma nota ou crie uma nova"
                description="Use o painel ao lado para navegar pelas suas anotações em um ambiente livre de distrações."
                action={
                  <button
                    type="button"
                    onClick={startNewNote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Nota
                  </button>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <div className="bg-[#111113] border border-white/[0.08] rounded-2xl p-5 sm:p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Excluir anotação?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 mb-5 leading-relaxed">
              Esta ação não pode ser desfeita. A nota será removida permanentemente.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 text-xs font-medium bg-white/[0.05] text-zinc-200 border border-white/[0.08] hover:bg-white/[0.1] rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30 rounded-xl transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Apagar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
