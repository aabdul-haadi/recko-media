import { useMemo } from "react";
import { usePortfolio } from "@/lib/portfolio/portfolio";
/** Shared published data; these motion scenes never ship their own project collection. */
export function useShowcaseProjects() {
  const list = usePortfolio();
  return useMemo(
    () =>
      (list.data?.pages[0] ?? [])
        .filter((item) => item.small || item.thumbnail)
        .slice(0, 12)
        .map((item) => ({
          id: item.id,
          src: item.small || item.thumbnail!,
          title: item.title,
          category: item.category,
          description: item.description,
        })),
    [list.data],
  );
}

export type ShowcaseProject = ReturnType<typeof useShowcaseProjects>[number];
