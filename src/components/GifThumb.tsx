import React from "react";

export default function GifThumb({
  src,
  alt,
  className = "w-[100px] h-[140px] rounded-md object-cover",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return <img className={className} src={src} alt={alt} loading="lazy" />;
}
