import React, { useEffect, useRef, useState } from "react";

export default function MediaThumb({
  src,
  alt,
  className = "w-16 h-16 rounded-lg object-cover",
  poster,
  autoPlay = true,
}: {
  src?: string;          // .mp4/.webm/.gif/.jpg/.png/.webp
  alt: string;
  className?: string;
  poster?: string;       // optional poster for videos
  autoPlay?: boolean;    // default true
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!src) return null;

  const isVideo = /\.(mp4|webm)$/i.test(src);

  return (
    <div ref={ref} className="shrink-0">
      {!visible ? (
        <div className={`${className} bg-gray-200 animate-pulse`} />
      ) : isVideo ? (
        <video
          className={className}
          src={src}
          poster={poster}
          muted
          playsInline
          loop
          autoPlay={autoPlay}
        />
      ) : (
        <img className={className} src={src} alt={alt} loading="lazy" />
      )}
    </div>
  );
}
