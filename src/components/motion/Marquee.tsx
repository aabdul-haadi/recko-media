import { cn } from "@/lib/utils";

type MarqueeProps = {
  images: { src: string; alt: string }[];
  reverse?: boolean;
  duration?: string;
  className?: string;
  itemClassName?: string;
};

/** Infinite horizontal image loop; pauses on hover of the parent group. */
export function Marquee({
  images,
  reverse = false,
  duration = "44s",
  className,
  itemClassName,
}: MarqueeProps) {
  const loop = [...images, ...images];
  return (
    <div className={cn("marquee-paused-hover overflow-hidden", className)}>
      <div
        className={cn("marquee-track", reverse && "[animation-direction:reverse]")}
        style={{ ["--marquee-duration" as string]: duration }}
      >
        {loop.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={i < images.length ? img.alt : ""}
            loading="lazy"
            width={1024}
            height={768}
            draggable={false}
            className={cn(
              "h-44 w-auto shrink-0 rounded-xl object-cover md:h-64 lg:h-72",
              i < images.length ? "" : "opacity-95",
              itemClassName,
            )}
          />
        ))}
      </div>
    </div>
  );
}
