import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ArrowLinkProps = {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "pill" | "ghost";
  className?: string;
};

/** CTA link with the signature arrow that lifts on hover. */
export function ArrowLink({
  href,
  onClick,
  children,
  variant = "pill",
  className,
}: ArrowLinkProps) {
  const classes = cn(
    "group/link inline-flex items-center gap-2.5 text-sm font-medium transition-colors duration-300",
    variant === "pill" &&
      "rounded-full border border-border bg-foreground/5 px-6 py-3 hover:border-acid hover:text-acid",
    variant === "ghost" && "border-b border-border pb-1 hover:border-acid hover:text-acid",
    className,
  );

  const content = (
    <>
      <span>{children}</span>
      <ArrowUpRight
        className="size-4 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
        strokeWidth={2}
      />
    </>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
