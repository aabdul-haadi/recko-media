import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // The pulse stops for people who have asked their device for reduced motion.
  return <div className={cn("animate-pulse rounded-md bg-primary/10 motion-reduce:animate-none", className)} {...props} />;
}

export { Skeleton };
