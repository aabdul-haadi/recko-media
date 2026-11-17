import { useState, type RefObject } from "react";
import { Link as LinkIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichText } from "@/components/ui/RichText";
import { LINK_TARGETS } from "@/lib/content/page-sections";
import { addLink, parseLinks, stripLinks } from "@/lib/content/rich-text";

const CUSTOM = "__custom__";
const groups = [...new Set(LINK_TARGETS.map((t) => t.group))];

type Props = { id: string; textareaRef: RefObject<HTMLTextAreaElement | null>; value: string; max?: number | undefined; onChange: (next: string) => void };

/**
 * Turns the words selected in the text box into a link to any page, any part of the home page, or any address.
 * The text is stored as `[words](address)`; the site shows only the words, as a link.
 */
export function LinkTool({ id, textareaRef, value, max, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [target, setTarget] = useState(LINK_TARGETS[0]!.url);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const hasLinks = parseLinks(value).some((s) => s.type === "link");
  const selected = value.slice(range[0], range[1]);

  function begin() {
    const box = textareaRef.current;
    const start = box?.selectionStart ?? 0;
    const end = box?.selectionEnd ?? 0;
    if (end <= start) {
      setOpen(false);
      setMessage("First select the words you want to link in the box above, then press this button.");
      return;
    }
    setRange([start, end]);
    setMessage("");
    setOpen(true);
  }

  function apply() {
    const address = target === CUSTOM ? custom : target;
    const result = addLink(value, range[0], range[1], address);
    if (!result) {
      setMessage("Choose a page, or type a full address such as https://example.com, a path like /contact, mailto: or tel:. Spaces are not allowed in an address.");
      return;
    }
    if (max && result.text.length > max) {
      setMessage(`The text would be longer than ${max} characters once the link is added. Shorten it first.`);
      return;
    }
    onChange(result.text);
    setOpen(false);
    setMessage("");
    setCustom("");
    requestAnimationFrame(() => {
      const box = textareaRef.current;
      box?.focus();
      box?.setSelectionRange(result.selectionEnd, result.selectionEnd);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={begin} aria-expanded={open} aria-controls={`${id}-link-panel`}>
          <LinkIcon className="mr-2 size-4" />
          Link selected words
        </Button>
        {hasLinks && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(stripLinks(value))}>
            Remove all links
          </Button>
        )}
        <span className="text-xs text-muted-foreground">Select words in the box, press the button, then choose where they go.</span>
      </div>

      {open && (
        <div id={`${id}-link-panel`} role="group" aria-label="Add a link" className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-sm">
            Link the words <strong className="break-words">&ldquo;{selected}&rdquo;</strong> to:
          </p>
          <div className="space-y-2">
            <Label htmlFor={`${id}-link-target`}>Page or address</Label>
            <select
              id={`${id}-link-target`}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
            >
              {groups.map((group) => (
                <optgroup key={group} label={group}>
                  {LINK_TARGETS.filter((t) => t.group === group).map((t) => (
                    <option key={t.url} value={t.url}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value={CUSTOM}>Another page or website…</option>
            </select>
          </div>
          {target === CUSTOM && (
            <div className="space-y-2">
              <Label htmlFor={`${id}-link-custom`}>Address</Label>
              <Input
                id={`${id}-link-custom`}
                value={custom}
                placeholder="https://example.com, /contact, mailto:you@example.com, tel:+923001234567"
                onChange={(e) => setCustom(e.target.value)}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={apply}>
              Add link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setMessage("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {message && (
        <p role="alert" className="text-xs text-destructive">
          {message}
        </p>
      )}

      {hasLinks && (
        <div
          className="rounded-lg border border-dashed border-border p-3 text-sm"
          onClickCapture={(e) => {
            if ((e.target as HTMLElement).closest("a")) e.preventDefault();
          }}
        >
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">How it will look</span>
          <RichText text={value} />
        </div>
      )}
    </div>
  );
}
