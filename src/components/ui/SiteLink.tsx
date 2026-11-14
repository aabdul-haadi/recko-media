import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { safeUrl } from "@/lib/content/content";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** An editable address. Anything that is not a site path, #section, https, mailto or tel link falls back. */
  href: unknown;
  fallback?: string;
};

/**
 * Link for addresses that people can edit in the admin. The address is always sanitised (no javascript:, no
 * //other-site), and site paths use the router so there is no full page reload.
 */
export function SiteLink({ href, fallback = "/", onClick, children, ...rest }: Props) {
  const router = useRouter({ warn: false });
  const url = safeUrl(href, fallback);
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !router || !url.startsWith("/")) return;
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void router.navigate({ href: url });
  };
  return (
    <a {...rest} href={url} onClick={handle}>
      {children}
    </a>
  );
}
