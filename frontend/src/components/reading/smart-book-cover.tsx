"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { sanitizeUrl } from "@/lib/security";

type SmartBookCoverProps = {
  url?: string | null;
  title: string;
  className?: string;
};

export const SmartBookCover = ({
  url,
  title,
  className = "",
}: SmartBookCoverProps) => {
  const safeInitialUrl = sanitizeUrl(url);
  const [src, setSrc] = useState<string | null>(safeInitialUrl);
  const [error, setError] = useState(false);

  useEffect(() => {
    const validated = sanitizeUrl(url);
    setError(false);

    if (!validated) {
      setSrc(null);
      return;
    }

    let isMounted = true;

    if (!validated.includes("google.com")) {
      setSrc(validated);
      return;
    }

    const tryZoom = async (zoomLevel: number): Promise<boolean> => {
      return new Promise((resolve) => {
        const candidate = validated.includes("zoom=")
          ? validated.replace(/zoom=\d/, `zoom=${zoomLevel}`)
          : `${validated}&zoom=${zoomLevel}`;

        const safeCandidate = sanitizeUrl(candidate);
        if (!safeCandidate) {
          resolve(false);
          return;
        }

        const img = new window.Image();
        img.onload = () => {
          if (!isMounted) return;
          const isPlaceholder =
            (img.naturalWidth === 575 && img.naturalHeight === 750) ||
            (img.naturalWidth === 128 && img.naturalHeight === 128) ||
            (img.naturalWidth <= 2 && img.naturalHeight <= 2);

          if (isPlaceholder) {
            resolve(false);
          } else {
            setSrc(safeCandidate);
            resolve(true);
          }
        };
        img.onerror = () => resolve(false);
        img.src = safeCandidate;
      });
    };

    const enhanceProgressively = async () => {
      const success3 = await tryZoom(3);
      if (success3 || !isMounted) return;

      const success2 = await tryZoom(2);
      if (success2 || !isMounted) return;

      const success1 = await tryZoom(1);
      if (success1 || !isMounted) return;

      setError(true);
    };

    enhanceProgressively();

    return () => {
      isMounted = false;
    };
  }, [url]);

  if (error || !src) {
    return (
      <div
        className={`${className} aspect-[2/3] flex items-center justify-center bg-zinc-900 border border-white/[0.06]`}
      >
        <BookOpen className="w-7 h-7 text-zinc-700" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title || "Capa do livro"}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setError(true)}
    />
  );
};
