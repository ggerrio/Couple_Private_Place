import React, { useRef, useState, useEffect } from "react";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Distance in px from viewport to start loading. Default 200 */
  rootMargin?: number;
  /** Placeholder color while image is loading */
  placeholderColor?: string;
  /** Whether to show a subtle skeleton loader */
  showSkeleton?: boolean;
  /** Aspect ratio for skeleton placeholder (e.g. "21/9", "1/1") */
  aspectRatio?: string;
}

/**
 * LazyImage — IntersectionObserver-powered image that only loads
 * when the element is within `rootMargin` of the viewport.
 * Falls back to a skeleton placeholder until loaded.
 */
export default function LazyImage({
  rootMargin = 200,
  placeholderColor,
  showSkeleton = false,
  aspectRatio,
  className = "",
  style,
  alt = "",
  ...imgProps
}: LazyImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isNear, setIsNear] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [didError, setDidError] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if IntersectionObserver is available
    if (typeof IntersectionObserver === "undefined") {
      setIsNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${rootMargin}px` }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        ...(aspectRatio ? { aspectRatio } : {}),
        ...(showSkeleton && !isLoaded
          ? {
              backgroundColor: placeholderColor || "var(--skeleton-bg, rgba(0,0,0,0.06))",
            }
          : {}),
        ...style,
      }}
    >
      {/* Skeleton shimmer while loading */}
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-black/5 dark:bg-white/5" />
      )}

      {/* Only render img when near viewport */}
      {isNear && !didError && (
        <img
          {...imgProps}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setDidError(true)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ position: aspectRatio ? "absolute" : undefined, inset: aspectRatio ? 0 : undefined }}
        />
      )}

      {/* Error fallback */}
      {didError && (
        <div
          className="absolute inset-0 flex items-center justify-center text-[10px] text-[var(--text-muted)]"
          style={{ backgroundColor: "var(--skeleton-bg, rgba(0,0,0,0.04))" }}
        >
          <span>⚠️</span>
        </div>
      )}
    </div>
  );
}
