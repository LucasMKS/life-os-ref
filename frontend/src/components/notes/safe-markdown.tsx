import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { sanitizeUrl } from "@/lib/security";

interface SafeMarkdownProps {
  content: string;
}

function SafeMarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  const [failed, setFailed] = useState(false);
  const safeSrc = sanitizeUrl(src);

  if (!safeSrc || failed) return null;

  return (
    <img
      src={safeSrc}
      alt={alt || "Imagem da nota"}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="my-3 max-h-72 w-auto rounded-xl border border-white/[0.08] object-contain bg-[#09090b]"
    />
  );
}

/**
 * Renders Markdown safely without raw HTML execution.
 * All link and image URLs are validated via `sanitizeUrl`.
 */
export function SafeMarkdown({ content }: SafeMarkdownProps) {
  return (
    <ReactMarkdown
      urlTransform={(url) => sanitizeUrl(url) ?? ""}
      components={{
        h1: ({ children }) => (
          <h1 className="text-lg font-semibold text-white mt-4 mb-2 first:mt-0">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold text-white mt-4 mb-2 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-zinc-100 mt-3 mb-1.5 first:mt-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 text-zinc-300 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-3 space-y-1 text-zinc-300 marker:text-zinc-500">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-3 space-y-1 text-zinc-300 marker:text-zinc-500">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-0.5">{children}</li>,
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-zinc-200">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-white/15 pl-3.5 my-3 text-zinc-400 italic">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = Boolean(className);
          if (isBlock) {
            return (
              <code className="block bg-[#09090b] border border-white/[0.06] rounded-xl p-3 my-3 text-xs font-mono text-zinc-200 overflow-x-auto">
                {children}
              </code>
            );
          }
          return (
            <code className="bg-white/[0.06] border border-white/[0.06] rounded px-1.5 py-0.5 text-xs font-mono text-zinc-200">
              {children}
            </code>
          );
        },
        hr: () => <hr className="border-white/[0.08] my-4" />,
        a: ({ href, children }) => {
          const safeHref = sanitizeUrl(href);
          if (!safeHref) {
            return (
              <span className="text-zinc-400 underline decoration-zinc-600">
                {children}
              </span>
            );
          }
          return (
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300 underline decoration-teal-500/40 underline-offset-2 transition-colors break-words"
            >
              {children}
            </a>
          );
        },
        img: ({ src, alt }) => <SafeMarkdownImage src={src} alt={alt} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
