"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

type SmartBookCoverProps = {
  url: string;
  title: string;
  className?: string;
};

export const SmartBookCover = ({ url, title, className }: SmartBookCoverProps) => {
  const [src, setSrc] = useState(url);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) return;
    let isMounted = true;

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
          const isPlaceholder =
            (img.naturalWidth === 575 && img.naturalHeight === 750) ||
            (img.naturalWidth === 128 && img.naturalHeight === 128) ||
            (img.naturalWidth <= 2 && img.naturalHeight <= 2);

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
        className={`${className} aspect-[2/3] flex items-center justify-center bg-zinc-900 rounded-2xl border border-white/5`}
      >
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
