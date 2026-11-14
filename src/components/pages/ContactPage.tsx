import "./inner-visuals.css";
import { ArrowRight, Clock3, Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { PageFrame, PageHero } from "@/components/pages/PageFrame";
import { Reveal } from "@/components/motion/SplitReveal";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { SiteLink } from "@/components/ui/SiteLink";
import { useSection } from "@/lib/content/content";
import { mailtoHref, telHref } from "@/lib/content/links";

type InfoBlock = { title?: string; text?: string };

const str = (value: unknown) => (typeof value === "string" ? value : "");
const infoIcons = [Clock3, MapPin, Phone, MessageCircle];

/**
 * Wording is editable in Admin > Pages & content > Contact page. The email, phone numbers and address are
 * shared with the footer (Menu & footer > Footer & contact details), so they are only ever edited once.
 */
export function ContactPage() {
  const hero = useSection("contact_hero").data;
  const details = useSection("contact_details").data;
  const footer = useSection("footer").data;

  const email = str(footer["email"]).trim();
  const emailLink = mailtoHref(email);
  const phones = [str(footer["phone"]).trim(), str(footer["phone_intl"]).trim()].filter(Boolean);
  const address = str(footer["address"]).trim();
  const info = (Array.isArray(details["info"]) ? (details["info"] as InfoBlock[]) : []).filter(
    (block) => str(block.title).trim() || str(block.text).trim(),
  );
  const artLines = [str(details["art_line_1"]), str(details["art_line_2"])].filter(Boolean);

  return (
    <PageFrame>
      <PageHero eyebrow={str(hero["eyebrow"])} title={str(hero["title"])} description={str(hero["description"])} />

      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:grid-cols-[0.75fr_1.25fr] md:gap-20 md:px-10">
          <aside className="recko-contact-aside">
            <div className="recko-contact-art" aria-label="A starting point for your next project">
              <div className="recko-contact-art-top">
                <span className="recko-page-label">{str(details["art_label"])}</span>
                <ArrowRight size={22} aria-hidden="true" />
              </div>
              <h2>
                {artLines.map((line, index) => (
                  <span key={`${index}-${line}`} style={{ display: "contents" }}>
                    {line}
                    <br />
                  </span>
                ))}
                {str(details["art_line_3"]) && <span>{str(details["art_line_3"])}</span>}
              </h2>
              <div className="recko-contact-art-images" aria-hidden="true">
                <img src="/thumbs/work-snack.jpg" alt="" width="320" height="240" />
                <img src="/thumbs/work-fashion.jpg" alt="" width="320" height="240" />
                <img src="/thumbs/work-dashboard.jpg" alt="" width="320" height="240" />
              </div>
            </div>
            <Reveal>
              {str(details["reach_label"]) && (
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  {str(details["reach_label"])}
                </p>
              )}
              {email &&
                (emailLink ? (
                  <a
                    href={emailLink}
                    className="recko-contact-email mt-4 inline-flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary sm:text-xl"
                  >
                    <Mail className="size-5 text-primary" />
                    {email}
                  </a>
                ) : (
                  <p className="recko-contact-email mt-4 inline-flex items-center gap-3 text-lg font-medium sm:text-xl">
                    <Mail className="size-5 text-primary" />
                    {email}
                  </p>
                ))}
            </Reveal>
            <div className="mt-5 flex flex-col items-start gap-3 text-muted-foreground">
              {phones.map((phone) => {
                const href = telHref(phone);
                return href ? (
                  <a key={phone} href={href} className="hover:text-acid">
                    {phone}
                  </a>
                ) : (
                  <p key={phone}>{phone}</p>
                );
              })}
              {address && <p>{address}</p>}
              {str(details["whatsapp_label"]) && (
                <SiteLink href={details["whatsapp_url"]} fallback="#" className="hover:text-acid">
                  {str(details["whatsapp_label"])}
                </SiteLink>
              )}
            </div>
            {info.length > 0 && (
              <div className="mt-10 space-y-6 border-t border-border pt-7">
                {info.map((block, index) => {
                  const Icon = infoIcons[index % infoIcons.length]!;
                  return (
                    <Reveal key={`${index}-${block.title}`} delay={80 * (index + 1)}>
                      <div className="flex gap-4">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary">
                          <Icon className="size-4" />
                        </span>
                        <div>
                          <h2 className="font-semibold">{str(block.title)}</h2>
                          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{str(block.text)}</p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </aside>

          <Reveal>
            <InquiryForm source="contact-page" />
          </Reveal>
        </div>
      </section>
    </PageFrame>
  );
}
