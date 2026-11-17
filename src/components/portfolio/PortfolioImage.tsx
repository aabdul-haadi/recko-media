import { useEffect, useRef, useState } from "react";
import type { PortfolioCard } from "@/lib/portfolio/portfolio";
export function PortfolioImage({
  item,
  priority = false,
}: {
  item: PortfolioCard;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    setFailed(false);
    // Cached images may have decoded before hydration/React attached its load handler.
    setLoaded(Boolean(image.current?.complete && image.current.naturalWidth));
  }, [item.thumbnail, item.small]);
  return (
    <span className={"portfolio-image " + (loaded ? "is-loaded" : "")}>
      {item.thumbnail && !failed ? (
        <img
          ref={image}
          src={item.thumbnail}
          srcSet={item.small ? `${item.small} 480w, ${item.thumbnail} 960w` : undefined}
          sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) calc((92vw - 26px) / 2), (max-width: 1440px) calc((92vw - 52px) / 3), (max-width: 1799px) 420px, 487px"
          width={960}
          height={640}
          alt={item.alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="portfolio-image-error">Preview unavailable</span>
      )}
    </span>
  );
}
