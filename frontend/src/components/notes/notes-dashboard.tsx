"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesApi } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import {
  Brain,
  Image as ImageIcon,
  Pin,
  Trash2,
  Loader2,
  Plus,
  Upload,
  Link as LinkIcon,
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";

interface QuickNote {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  color: string;
  pinned: boolean;
  createdAt: string;
}

const colors = [
  {
    id: "zinc",
    bg: "bg-zinc-900/80",
    border: "border-zinc-700/50",
    hover: "hover:border-zinc-500/50",
  },
  {
    id: "teal",
    bg: "bg-teal-950/40",
    border: "border-teal-800/50",
    hover: "hover:border-teal-500/50",
  },
  {
    id: "emerald",
    bg: "bg-emerald-950/40",
    border: "border-emerald-800/50",
    hover: "hover:border-emerald-500/50",
  },
  {
    id: "blue",
    bg: "bg-blue-950/40",
    border: "border-blue-800/50",
    hover: "hover:border-blue-500/50",
  },
  {
    id: "amber",
    bg: "bg-amber-950/40",
    border: "border-amber-800/50",
    hover: "hover:border-amber-500/50",
  },
  {
    id: "purple",
    bg: "bg-purple-950/40",
    border: "border-purple-800/50",
    hover: "hover:border-purple-500/50",
  },
  {
    id: "rose",
    bg: "bg-rose-950/40",
    border: "border-rose-800/50",
    hover: "hover:border-rose-500/50",
  },
];

export function NotesDashboard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState("zinc");

  const [showImageInput, setShowImageInput] = useState(false);
  const [imageMode, setImageMode] = useState<"URL" | "UPLOAD">("UPLOAD");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  
  // Edit State
  const [noteToEdit, setNoteToEdit] = useState<QuickNote | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState("zinc");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: notes = [], isLoading } = useQuery<QuickNote[]>({
    queryKey: ["quick-notes"],
    queryFn: notesApi.getNotes,
  });

  const createMutation = useMutation({
    mutationFn: notesApi.createNote,
    onSuccess: () => {
      toast.success("Nota salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["quick-notes"] });
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar anotação."),
  });

  const deleteMutation = useMutation({
    mutationFn: notesApi.deleteNote,
    onSuccess: () => {
      toast.success("Nota enviada para a lixeira.");
      queryClient.invalidateQueries({ queryKey: ["quick-notes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: notesApi.updateNote,
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: ["quick-notes"] });
      const previousNotes = queryClient.getQueryData<QuickNote[]>([
        "quick-notes",
      ]);
      queryClient.setQueryData<QuickNote[]>(["quick-notes"], (old) =>
        old?.map((n) => (n.id === newNote.id ? newNote : n)),
      );
      return { previousNotes };
    },
    onError: (err, newNote, context) => {
      queryClient.setQueryData(["quick-notes"], context?.previousNotes);
      toast.error("Erro ao atualizar a nota.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-notes"] });
    },
  });

  const handleUpdateEdit = () => {
    if (!noteToEdit) return;
    if (!editContent.trim()) {
      toast.error("O conteúdo não pode estar vazio.");
      return;
    }
    
    updateMutation.mutate(
      {
        ...noteToEdit,
        title: editTitle,
        content: editContent,
        color: editColor,
      },
      {
        onSuccess: () => {
          toast.success("Nota atualizada!");
          setNoteToEdit(null);
        },
      }
    );
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImageUrl("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedColor("zinc");
    setShowImageInput(false);
    setIsExpanded(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageUrl("");
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = () => {
    if (!content.trim() && !imageUrl.trim() && !selectedFile) return;
    const formData = new FormData();
    if (title) formData.append("title", title);
    formData.append("content", content);
    formData.append("color", selectedColor);

    if (imageMode === "UPLOAD" && selectedFile)
      formData.append("file", selectedFile);
    else if (imageMode === "URL" && imageUrl)
      formData.append("imageUrl", imageUrl);

    createMutation.mutate(formData);
  };

  const togglePin = (note: QuickNote) =>
    updateMutation.mutate({ ...note, pinned: !note.pinned });

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteMutation.mutate(noteToDelete);
      setNoteToDelete(null);
    }
  };

  const cancelDelete = () => {
    setNoteToDelete(null);
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end, text.length);

    setContent(before + prefix + selected + suffix + after);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        start + prefix.length,
        end + prefix.length,
      );
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const textarea = e.currentTarget;
      const { selectionStart, value } = textarea;

      const textBeforeCursor = value.substring(0, selectionStart);
      const lines = textBeforeCursor.split("\n");
      const currentLine = lines[lines.length - 1];

      const match = currentLine.match(/^(\s*(?:[-*+]|\d+[.)])\s+)/i);

      if (match) {
        e.preventDefault();
        const prefix = match[1];

        if (currentLine.trim() === prefix.trim()) {
          const newValue =
            value.substring(0, selectionStart - currentLine.length) +
            "\n" +
            value.substring(selectionStart);
          setContent(newValue);
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
        setContent(newValue);

        const newCursorPos = selectionStart + 1 + newPrefix.length;
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        }, 0);
      }
    }
  };

  return (
    <>
      <div className="w-full flex flex-col gap-6 md:gap-8 min-h-[400px] md:min-h-[500px] relative">
        {/* COMPOSER */}
        <div className="max-w-3xl mx-auto w-full z-20 relative transition-all duration-500">
          <div
            className={`bg-[#121214]/90 backdrop-blur-2xl border ${isExpanded ? "border-teal-500/40 shadow-[0_10px_40px_rgba(20,184,166,0.15)]" : "border-white/10 hover:border-white/20"} rounded-3xl overflow-hidden transition-all duration-300`}
          >
            {isExpanded && (
              <input
                type="text"
                placeholder="Título (opcional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent px-4 sm:px-6 pt-5 sm:pt-6 pb-2 text-lg sm:text-xl font-bold text-white placeholder:text-zinc-600 focus:outline-none"
              />
            )}

            <textarea
              ref={textareaRef}
              placeholder={
                isExpanded
                  ? "Comece a digitar... Suporta Markdown!"
                  : "Faça uma anotação, guarde um link..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onClick={() => setIsExpanded(true)}
              onKeyDown={handleKeyDown}
              className={`w-full bg-transparent px-4 sm:px-6 text-sm sm:text-base text-zinc-200 placeholder:text-zinc-500 focus:outline-none resize-none transition-all scrollbar-thin leading-relaxed ${isExpanded ? "min-h-[160px] py-2" : "min-h-[60px] py-4"}`}
            />

            {isExpanded && (
              <div className="px-3 sm:px-5 py-2 mx-4 sm:mx-6 mb-3 bg-black/40 rounded-xl border border-white/5 flex items-center gap-1 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => insertFormatting("**", "**")}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0"
                  title="Negrito"
                >
                  <Bold className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => insertFormatting("*", "*")}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0"
                  title="Itálico"
                >
                  <Italic className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
                <div className="w-px h-4 bg-white/10 mx-1 shrink-0"></div>
                <button
                  onClick={() => insertFormatting("- ")}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0"
                  title="Lista"
                >
                  <List className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => insertFormatting("1. ")}
                  className="p-1.5 sm:p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0"
                  title="Lista Numerada"
                >
                  <ListOrdered className="w-4 h-4 sm:w-4 sm:h-4" />
                </button>
              </div>
            )}

            {showImageInput && isExpanded && (
              <div className="px-4 sm:px-6 py-4 border-t border-white/5 bg-black/30 flex flex-col gap-4">
                {/* Mobile: botões em coluna, Desktop: em linha */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setImageMode("UPLOAD")}
                    className={`text-xs font-bold px-4 py-3 sm:py-2 rounded-xl flex items-center justify-center gap-2 transition-colors w-full sm:w-auto ${imageMode === "UPLOAD" ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/5 text-zinc-400 border border-white/5 hover:text-white hover:bg-white/10"}`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Arquivo Local
                  </button>
                  <button
                    onClick={() => setImageMode("URL")}
                    className={`text-xs font-bold px-4 py-3 sm:py-2 rounded-xl flex items-center justify-center gap-2 transition-colors w-full sm:w-auto ${imageMode === "URL" ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/5 text-zinc-400 border border-white/5 hover:text-white hover:bg-white/10"}`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Link da Web
                  </button>
                </div>

                {imageMode === "URL" ? (
                  <input
                    type="text"
                    placeholder="https://exemplo.com/imagem.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-teal-500/50 transition-colors"
                  />
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:flex-grow bg-black/50 border border-white/10 hover:border-teal-500/50 rounded-xl px-4 py-3 sm:py-4 text-sm text-zinc-400 hover:text-zinc-200 transition-colors text-left flex items-center justify-between group"
                    >
                      <span className="truncate pr-4">
                        {selectedFile
                          ? selectedFile.name
                          : "Selecione uma imagem..."}
                      </span>
                      <Upload className="w-4 h-4 text-zinc-600 group-hover:text-teal-400 transition-colors shrink-0" />
                    </button>
                    {previewUrl && (
                      <div className="relative w-16 h-16 sm:w-14 sm:h-14 shrink-0 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={removeSelectedFile}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-1 hover:text-red-400 hover:bg-black/80 transition-colors backdrop-blur-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isExpanded && (
              // Mobile: coluna com gap, Desktop: linha distribuída
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 py-4 sm:py-3 bg-black/40 border-t border-white/5 gap-4 sm:gap-0">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setShowImageInput(!showImageInput)}
                    className={`p-2.5 sm:p-2 rounded-xl transition-colors shrink-0 ${showImageInput ? "bg-teal-500/20 text-teal-400" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
                    title="Anexar Imagem"
                  >
                    <ImageIcon className="w-5 h-5 sm:w-4.5 sm:h-4.5" />
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1 shrink-0"></div>
                  <div className="flex items-center gap-2 sm:gap-1.5 shrink-0 px-1">
                    {colors.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedColor(c.id)}
                        className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full ${c.bg} border-2 ${selectedColor === c.id ? "border-zinc-200 scale-110 shadow-[0_0_12px_rgba(255,255,255,0.2)]" : "border-transparent hover:border-zinc-600"} transition-all shrink-0`}
                        title={`Cor: ${c.id}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={resetForm}
                    className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 text-sm font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 sm:bg-transparent sm:hover:bg-transparent rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={
                      createMutation.isPending ||
                      (!content.trim() && !imageUrl.trim() && !selectedFile)
                    }
                    className="flex-1 sm:flex-none justify-center bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 sm:py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(13,148,136,0.3)] hover:shadow-[0_0_25px_rgba(13,148,136,0.5)]"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Salvar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GRID DE NOTAS - Já era responsivo, mantido intacto */}
        {isLoading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
          </div>
        ) : notes.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {notes.map((note) => {
              const colorTheme =
                colors.find((c) => c.id === note.color) || colors[0];

              return (
                <div
                  key={note.id}
                  className={`relative group break-inside-avoid backdrop-blur-xl border rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5 shadow-lg hover:shadow-2xl ${colorTheme.bg} ${colorTheme.border} ${colorTheme.hover}`}
                >
                  <div className="absolute top-4 right-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 flex gap-2 z-20 sm:translate-y-[-10px] sm:group-hover:translate-y-0">
                    <button
                      onClick={() => {
                        setEditTitle(note.title || "");
                        setEditContent(note.content || "");
                        setEditColor(note.color || "zinc");
                        setNoteToEdit(note);
                      }}
                      className="p-2 sm:p-2.5 rounded-full backdrop-blur-xl bg-black/60 border border-white/10 text-zinc-300 hover:text-blue-400 hover:border-blue-500/50 transition-all hover:scale-110"
                      title="Editar Nota"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => togglePin(note)}
                      className={`p-2 sm:p-2.5 rounded-full backdrop-blur-xl bg-black/60 border transition-all hover:scale-110 ${note.pinned ? "text-teal-400 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.4)]" : "text-zinc-300 border-white/10 hover:text-white"}`}
                      title={note.pinned ? "Desfixar" : "Fixar"}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setNoteToDelete(note.id)}
                      className="p-2 sm:p-2.5 rounded-full backdrop-blur-xl bg-black/60 border border-white/10 text-zinc-300 hover:text-red-400 hover:border-red-500/50 transition-all hover:scale-110"
                      title="Excluir Nota"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {note.pinned && (
                    <div className="absolute top-0 right-8 w-4 h-5 bg-gradient-to-b from-teal-400 to-teal-600 rounded-b-md shadow-[0_0_15px_rgba(20,184,166,0.6)] z-10"></div>
                  )}

                  {note.imageUrl && (
                    <div className="w-full relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121214]/90 via-transparent to-black/30 z-10 pointer-events-none"></div>
                      <img
                        src={note.imageUrl}
                        alt="Anexo"
                        className="w-full max-h-[300px] object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div
                    className={`p-5 sm:p-6 ${note.imageUrl ? "pt-2 relative z-20 -mt-6" : ""}`}
                  >
                    {note.title && (
                      <h3 className="font-bold text-base sm:text-lg text-white mb-2 sm:mb-3 leading-snug tracking-tight drop-shadow-md">
                        {note.title}
                      </h3>
                    )}

                    <div className="text-[14px] sm:text-[15px] text-zinc-300 leading-relaxed prose prose-invert max-w-none max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2">
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => (
                            <p className="mb-3 last:mb-0" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul
                              className="list-disc pl-5 mb-3 space-y-1 text-zinc-400 marker:text-teal-500"
                              {...props}
                            />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol
                              className="list-decimal pl-5 mb-3 space-y-1 text-zinc-400 marker:text-teal-500 font-medium"
                              {...props}
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="pl-1" {...props} />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong
                              className="font-bold text-white tracking-wide"
                              {...props}
                            />
                          ),
                          a: ({ node, ...props }) => (
                            <a
                              className="text-teal-400 hover:text-teal-300 hover:underline decoration-teal-500/50 transition-all font-medium break-words"
                              target="_blank"
                              rel="noreferrer"
                              {...props}
                            />
                          ),
                        }}
                      >
                        {note.content}
                      </ReactMarkdown>
                    </div>

                    <div className="mt-5 sm:mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {new Date(note.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 sm:py-24 px-4 bg-[#121214]/50 border border-white/5 border-dashed rounded-3xl max-w-xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-500/10 rounded-full flex items-center justify-center mb-5 sm:mb-6 border border-teal-500/20">
              <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-teal-400" />
            </div>
            <h3 className="text-lg sm:text-xl text-white font-bold mb-2">
              Sem Anotações
            </h3>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-xs leading-relaxed">
              Suas anotações, links salvos e imagens aparecerão aqui.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Exclusão Responsivo */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Excluir anotação?
              </h3>
            </div>

            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Esta ação não pode ser desfeita. A nota será apagada
              permanentemente do seu espaço criativo.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <button
                onClick={cancelDelete}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-bold text-zinc-300 bg-white/5 hover:bg-white/10 sm:bg-transparent sm:hover:bg-transparent sm:hover:text-white rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 px-5 py-3 sm:py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Apagar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Nota Responsivo */}
      {noteToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md px-4 py-6 sm:py-10 overflow-y-auto">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-0 max-w-2xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-white/5 bg-[#1a1a1f] flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-400" /> Editar Anotação
              </h3>
              <button 
                onClick={() => setNoteToEdit(null)}
                className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
              <input
                type="text"
                placeholder="Título (opcional)"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-transparent px-0 pb-4 text-xl sm:text-2xl font-bold text-white placeholder:text-zinc-600 focus:outline-none border-b border-white/5 mb-4"
              />
              <textarea
                ref={editTextareaRef}
                placeholder="Conteúdo da nota..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-transparent px-0 text-sm sm:text-base text-zinc-200 placeholder:text-zinc-500 focus:outline-none resize-none transition-all scrollbar-thin min-h-[250px]"
              />
            </div>

            <div className="px-5 sm:px-6 py-4 bg-[#1a1a1f] border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mr-2">Cor:</span>
                {colors.map((c) => (
                  <button
                    key={`edit-${c.id}`}
                    onClick={() => setEditColor(c.id)}
                    className={`w-7 h-7 sm:w-6 sm:h-6 rounded-full ${c.bg} border-2 ${editColor === c.id ? "border-zinc-200 scale-110 shadow-[0_0_12px_rgba(255,255,255,0.2)]" : "border-transparent hover:border-zinc-600"} transition-all shrink-0`}
                    title={`Cor: ${c.id}`}
                  />
                ))}
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => setNoteToEdit(null)}
                  className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 text-sm font-bold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 sm:bg-transparent sm:hover:bg-transparent rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateEdit}
                  disabled={updateMutation.isPending || !editContent.trim()}
                  className="flex-1 sm:flex-none justify-center bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 sm:py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_20px_rgba(13,148,136,0.3)] hover:shadow-[0_0_25px_rgba(13,148,136,0.5)]"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
