import * as Accordion from "@radix-ui/react-accordion";
import { Plus } from "@phosphor-icons/react";
import { Reveal, SplitReveal } from "@/components/motion/SplitReveal";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { safeUrl, useSection } from "@/lib/content/content";
import "./faq.css";

type FaqItem = { question: string; answer: string };

export function Faq() {
  const { data: c } = useSection("faq");
  const items = ((c["items"] ?? []) as FaqItem[]).filter((item) => item.question?.trim() && item.answer?.trim());
  if (items.length === 0) return null;

  return (
    <section id="faq" className="recko-faq relative border-t border-border" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="recko-brand-label mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {c["eyebrow"]}
            </p>
          </Reveal>
          <h2 id="faq-title" className="font-display">
            <SplitReveal key={c["heading"]} text={c["heading"]} />
          </h2>
          {c["intro"] && <p className="mt-5 max-w-sm text-base leading-relaxed text-muted-foreground">{c["intro"]}</p>}
          {c["cta_label"] && (
            <div className="mt-7">
              <ArrowLink variant="ghost" href={safeUrl(c["cta_url"], "#contact")}>
                {c["cta_label"]}
              </ArrowLink>
            </div>
          )}
        </div>

        <Accordion.Root type="single" collapsible className="recko-faq-list border-t border-border">
          {items.map((item, index) => (
            <Accordion.Item key={`${item.question}-${index}`} value={`faq-${index}`} className="recko-faq-item border-b border-border">
              <Accordion.Header asChild>
                <h3>
                  <Accordion.Trigger className="recko-faq-trigger group flex w-full items-center gap-4 py-5 text-left md:py-6">
                    <span className="font-sans text-xs text-primary tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex-1 font-display text-lg font-medium leading-snug md:text-xl">{item.question}</span>
                    <span className="recko-faq-icon grid size-9 shrink-0 place-items-center rounded-full border border-border transition-colors duration-300 group-hover:border-primary group-data-[state=open]:border-primary group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
                      <Plus size={16} weight="bold" aria-hidden="true" />
                    </span>
                  </Accordion.Trigger>
                </h3>
              </Accordion.Header>
              <Accordion.Content className="recko-faq-content">
                <p className="pb-6 pl-9 pr-4 text-base leading-relaxed text-muted-foreground md:pl-10 md:pr-14">{item.answer}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
