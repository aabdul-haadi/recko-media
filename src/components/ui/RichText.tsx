import { Fragment } from "react";
import { SiteLink } from "@/components/ui/SiteLink";
import { parseLinks } from "@/lib/content/rich-text";

/**
 * Shows text that may contain `[words](address)` links written in the admin. Words are always rendered as text;
 * only safe addresses become links. Site paths navigate inside the app; other websites open in a new tab.
 */
export function RichText({ text, linkClassName = "text-acid underline underline-offset-4 hover:no-underline" }: { text: unknown; linkClassName?: string }) {
  return (
    <>
      {parseLinks(text).map((segment, index) =>
        segment.type === "text" ? (
          <Fragment key={index}>{segment.value}</Fragment>
        ) : (
          <SiteLink
            key={index}
            href={segment.url}
            className={linkClassName}
            {...(/^https?:\/\//i.test(segment.url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {segment.label}
          </SiteLink>
        ),
      )}
    </>
  );
}
