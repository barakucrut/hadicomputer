"use client";
import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

export function SafeImage({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const isUploaded = typeof src === "string" && src.startsWith("/uploads/");
  return failedSrc === src ? (
    <span role="img" aria-label={alt} className={`image-fallback ${className}`}>
      <ImageOff size={30} />
      <small>Foto belum tersedia</small>
    </span>
  ) : (
    <Image
      className={className}
      src={src}
      alt={alt}
      fill
      unoptimized={isUploaded}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setFailedSrc(src)}
    />
  );
}
