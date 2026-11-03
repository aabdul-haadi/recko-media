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
    "recko-cta-link group/link inline-flex items-center gap-2.5 text-sm font-medium transition-colors duration-300",
    variant === "pill" && "recko-cta-solid rounded-md border border-transparent px-6 py-3",
    variant === "ghost" && "recko-cta-ghost border-b border-border pb-1",
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
