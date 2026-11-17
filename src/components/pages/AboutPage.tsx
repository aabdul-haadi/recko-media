import "./inner-visuals.css";
import { ArrowRight } from "@phosphor-icons/react";
import { PageFrame, PageHero, SectionIntro } from "@/components/pages/PageFrame";
import { RichText } from "@/components/ui/RichText";
import { SiteLink } from "@/components/ui/SiteLink";
import { useSection } from "@/lib/content/content";

type TitledText = { title?: string; body?: string };
type Faq = { question?: string; answer?: string };

const str = (value: unknown) => (typeof value === "string" ? value : "");
const rows = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

/** Every word on this page is editable in Admin > Pages & content > About page. */
export function AboutPage() {
  const hero = useSection("about_hero").data;
  const story = useSection("about_story");
  const intro = useSection("about_intro");
  const mission = useSection("about_mission");
  const values = useSection("about_values");
  const cta = useSection("about_cta");
  const faq = useSection("about_faq");

  const disciplines = rows<string>(story.data["disciplines"]).filter((name) => str(name).trim());
  const cards = rows<TitledText>(intro.data["cards"]).filter((card) => str(card.title).trim() || str(card.body).trim());
  const paragraphs = rows<{ text?: string }>(mission.data["paragraphs"]).filter((p) => str(p.text).trim());
  const columns = rows<TitledText>(values.data["items"]).filter((item) => str(item.title).trim() || str(item.body).trim());
  const questions = rows<Faq>(faq.data["items"]).filter((item) => str(item.question).trim());

  return (
    <PageFrame>
      <PageHero eyebrow={str(hero["eyebrow"])} title={str(hero["title"])} description={str(hero["description"])} />

      {story.enabled && (
        <section className="recko-about-studio" aria-label="Our connected disciplines">
          <div className="recko-inner-container recko-studio-grid">
            <div className="recko-studio-art">
              <img
                src="/thumbs/work-fashion.jpg"
                alt="Creative campaign direction concept"
                width="960"
                height="720"
              />
              <img
                className="recko-studio-inset"
                src="/thumbs/work-dashboard.jpg"
                alt="Digital experience and analytics concept"
                width="640"
                height="480"
              />
              {str(story.data["caption"]) && <span className="recko-studio-caption">{str(story.data["caption"])}</span>}
            </div>
            <div className="recko-studio-copy">
              {str(story.data["label"]) && <p className="recko-page-label">{str(story.data["label"])}</p>}
              <h2>
                {str(story.data["heading_1"])}
                {str(story.data["heading_1"]) && str(story.data["heading_2"]) && <br />}
                {str(story.data["heading_2"])}
              </h2>
              <p>{str(story.data["text"])}</p>
              {disciplines.length > 0 && (
                <div className="recko-discipline-list">
                  {disciplines.map((name, index) => (
                    <div key={`${name}-${index}`}>
                      <span>0{index + 1}</span>
                      <span>{name}</span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </div>
                  ))}
                </div>
              )}
              {str(story.data["link_label"]) && (
                <SiteLink href={story.data["link_url"]} fallback="/services" className="recko-inner-text-link">
                  {str(story.data["link_label"])} <ArrowRight size={18} aria-hidden="true" />
                </SiteLink>
              )}
            </div>
          </div>
        </section>
      )}

      {intro.enabled && (
        <section className="border-b border-border py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            {str(intro.data["label"]) && <p className="recko-page-label">{str(intro.data["label"])}</p>}
            <h2 className="mt-5 max-w-3xl">{str(intro.data["heading"])}</h2>
            <p className="mt-6 max-w-4xl text-muted-foreground">{str(intro.data["intro"])}</p>
            {cards.length > 0 && (
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {cards.map((item, index) => (
                  <article key={`${item.title}-${index}`} className="rounded-2xl border border-border bg-surface p-6">
                    <h3>{str(item.title)}</h3>
                    <p className="mt-4 text-muted-foreground">{str(item.body)}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {mission.enabled && (
        <section className="border-b border-border py-20 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-2 md:px-10">
            <div>
              {str(mission.data["label"]) && <p className="recko-page-label">{str(mission.data["label"])}</p>}
              <h2 className="mt-5">{str(mission.data["heading"])}</h2>
            </div>
            <div className="space-y-5 text-muted-foreground">
              {paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.text}`}>{str(paragraph.text)}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {values.enabled && (
        <section className="border-t border-border py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            <SectionIntro eyebrow={str(values.data["eyebrow"])} title={str(values.data["title"])} text={str(values.data["text"])} />
            {columns.length > 0 && (
              <div className="grid gap-0 border-t border-border md:grid-cols-4">
                {columns.map((step, index) => (
                  <article
                    key={`${step.title}-${index}`}
                    className="border-b border-border py-6 md:border-b-0 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0"
                  >
                    <span className="font-mono text-xs text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="mt-4 font-display text-2xl font-semibold">{str(step.title)}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{str(step.body)}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {cta.enabled && (
        <section className="border-t border-border bg-primary py-16 text-primary-foreground md:py-24">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:flex-row sm:items-end sm:justify-between md:px-10">
            <div>
              {str(cta.data["eyebrow"]) && (
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] opacity-75">{str(cta.data["eyebrow"])}</p>
              )}
              <h2 className="max-w-3xl font-display text-4xl font-bold tracking-tight md:text-6xl">{str(cta.data["heading"])}</h2>
            </div>
            {str(cta.data["button_label"]) && (
              <SiteLink
                href={cta.data["button_url"]}
                fallback="/contact"
                className="inline-flex w-fit items-center gap-3 rounded-full bg-background px-6 py-3 font-semibold text-foreground transition-transform hover:translate-x-1"
              >
                {str(cta.data["button_label"])}
                <ArrowRight className="size-4" />
              </SiteLink>
            )}
          </div>
        </section>
      )}

      {faq.enabled && (
        <section className="border-t border-border py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-10">
            {str(faq.data["eyebrow"]) && <p className="recko-page-label">{str(faq.data["eyebrow"])}</p>}
            <h2 className="mt-4 mb-8">{str(faq.data["heading"])}</h2>
            {questions.length > 0 && (
              <ul className="divide-y divide-border">
                {questions.map((item, index) => (
                  <li key={`${index}-${item.question}`} className="py-5">
                    {str(item.answer).trim() ? (
                      <details>
                        <summary className="cursor-pointer font-medium">{str(item.question)}</summary>
                        <p className="mt-4 max-w-4xl text-muted-foreground">
                          <RichText text={item.answer} />
                        </p>
                      </details>
                    ) : (
                      <p>{str(item.question)}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {(str(faq.data["prompt"]) || str(faq.data["link_label"])) && (
              <p className="mt-6 text-muted-foreground">
                {str(faq.data["prompt"])}
                {str(faq.data["prompt"]) && str(faq.data["link_label"]) ? " " : ""}
                {str(faq.data["link_label"]) && (
                  <SiteLink href={faq.data["link_url"]} fallback="/contact" className="text-acid underline underline-offset-4">
                    {str(faq.data["link_label"])}
                  </SiteLink>
                )}
              </p>
            )}
          </div>
        </section>
      )}
    </PageFrame>
  );
}
