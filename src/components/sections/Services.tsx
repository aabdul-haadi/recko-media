import { useState } from "react";
import { serviceTabs } from "@/data/home";
import { Reveal } from "@/components/motion/SplitReveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Services() {
  const [active, setActive] = useState(serviceTabs[0]?.id ?? "creative");
  const tab = serviceTabs.find((t) => t.id === active);

  return (
    <section id="services" className="relative border-t border-border">
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            What we do
          </p>
        </Reveal>

        {/* Tabs */}
        <div className="flex flex-wrap items-baseline gap-x-10 gap-y-4">
          {serviceTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                "group flex items-start gap-2 font-display text-4xl font-bold tracking-tight transition-colors duration-300 md:text-6xl",
                t.id === active
                  ? "text-foreground"
                  : "text-muted-foreground/50 hover:text-foreground",
              )}
            >
              <sup className="mt-2 font-mono text-xs text-acid md:text-sm">{t.index}</sup>
              <span className="relative">
                {t.label}
                <ArrowUpRight
                  className={cn(
                    "absolute -right-7 top-1 size-5 text-acid transition-all duration-300 md:-right-9 md:size-6",
                    t.id === active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                  )}
                />
              </span>
            </button>
          ))}
        </div>

        {/* Active panel */}
        {tab && (
          <div
            key={tab.id}
            className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 md:mt-16"
          >
            <p className="mb-10 max-w-md text-lg text-muted-foreground">{tab.intro}</p>

            <div className="border-t border-border">
              {tab.items.map((item) => (
                <a
                  key={item.number}
                  href="#contact"
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border px-1 py-7 transition-colors duration-300 hover:bg-foreground/[0.04] md:grid-cols-[auto_auto_1fr_auto] md:gap-8 md:px-4 md:py-9"
                >
                  <span className="hidden size-10 items-center justify-center rounded-md border border-border font-mono text-xs text-muted-foreground transition-colors duration-300 group-hover:border-acid group-hover:text-acid md:flex">
                    {item.number}
                  </span>
                  <span className="font-display text-2xl font-bold tracking-tight transition-transform duration-300 group-hover:translate-x-2 md:text-4xl">
                    {item.title}
                  </span>
                  <span className="hidden max-w-sm text-sm leading-relaxed text-muted-foreground md:block">
                    {item.blurb}
                  </span>
                  <span className="flex size-10 items-center justify-center rounded-full border border-border transition-all duration-300 group-hover:rotate-45 group-hover:border-acid group-hover:bg-acid group-hover:text-background">
                    <ArrowUpRight className="size-4" />
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <ArrowLink variant="ghost" href="#contact">
                Explore all services
              </ArrowLink>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
