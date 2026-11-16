"use client";

import { useState } from "react";
import { Film, Tv } from "lucide-react";
import { sanitizeUrl } from "@/lib/security";

export const LMS_BASE_URL = "https://filmes.lucasmks.com.br";

/**
 * Builds and sanitizes an external LMS Filmes URL for a movie or series.
 */
export function buildLmsMediaUrl(
  type: "MOVIE" | "SERIES",
  id?: string | number | null,
): string | null {
  if (id === null || id === undefined || id === "") return sanitizeUrl(LMS_BASE_URL);
  const segment = type === "MOVIE" ? "filmes" : "series";
  const safeId = encodeURIComponent(String(id).trim());
  return sanitizeUrl(`${LMS_BASE_URL}/${segment}/${safeId}`);
}

/**
 * Builds and sanitizes a TMDB image URL from a path or full URL.
 */
export function buildTmdbImageUrl(
  pathOrUrl?: string | null,
  size: "w200" | "w500" | "w780" = "w500",
): string | null {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return sanitizeUrl(trimmed);
  }

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return sanitizeUrl(`https://image.tmdb.org/t/p/${size}${normalizedPath}`);
}

interface MediaPosterProps {
  src?: string | null;
  alt: string;
  type?: "MOVIE" | "SERIES";
  className?: string;
  iconClassName?: string;
}

/**
 * Lazy-loaded, sanitized poster image with graceful fallback on error or missing URL.
 */
export function MediaPoster({
  src,
  alt,
  type = "MOVIE",
  className = "w-full h-full object-cover",
  iconClassName = "w-7 h-7 text-zinc-700",
}: MediaPosterProps) {
  const [hasError, setHasError] = useState(false);
  const safeSrc = sanitizeUrl(src);

  if (!safeSrc || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#161619]">
        {type === "MOVIE" ? (
          <Film className={iconClassName} />
        ) : (
          <Tv className={iconClassName} />
        )}
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt={alt || "Poster"}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
