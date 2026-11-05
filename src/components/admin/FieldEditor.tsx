import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Field } from "@/lib/content/schema";

export const URL_PATTERN = /^(\/|#|https?:\/\/|mailto:|tel:)/i;

type Props = {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  idPrefix: string;
};

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

export function FieldEditor({ field, value, onChange, idPrefix }: Props) {
  const id = `${idPrefix}-${field.name}`;

  if (field.type === "list") {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    const blank = Object.fromEntries(field.fields.map((f) => [f.name, f.type === "strings" ? [] : f.type === "list" ? [] : ""]));
    return (
      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">{field.label}</legend>
        {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
        {items.map((item, index) => (
          <div key={index} className="space-y-3 rounded-lg bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{field.itemLabel} {index + 1}</span>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={index === 0} onClick={() => onChange(move(items, index, index - 1))}><ArrowUp className="size-4" /></Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={index === items.length - 1} onClick={() => onChange(move(items, index, index + 1))}><ArrowDown className="size-4" /></Button>
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${field.itemLabel.toLowerCase()} ${index + 1}`} onClick={() => onChange(items.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button>
              </div>
            </div>
            {field.fields.map((sub) => (
              <FieldEditor
                key={sub.name}
                field={sub}
                idPrefix={`${id}-${index}`}
                value={item[sub.name]}
                onChange={(next) => onChange(items.map((it, i) => (i === index ? { ...it, [sub.name]: next } : it)))}
              />
            ))}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" disabled={items.length >= (field.max ?? 50)} onClick={() => onChange([...items, blank])}>
          <Plus className="mr-2 size-4" />Add {field.itemLabel.toLowerCase()}
        </Button>
      </fieldset>
    );
  }

  if (field.type === "strings") {
    const lines = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
        <Textarea
          id={id}
          rows={Math.min(10, Math.max(3, lines.length + 1))}
          value={lines.join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n"))}
          onBlur={() => onChange(lines.map((l) => l.trim()).filter(Boolean))}
        />
        <p className="text-xs text-muted-foreground">{field.help ?? "One item per line."}</p>
      </div>
    );
  }

  const text = typeof value === "string" ? value : "";
  const invalidUrl = field.type === "url" && text !== "" && !URL_PATTERN.test(text.trim());
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea id={id} rows={3} maxLength={field.max} value={text} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input id={id} type="text" inputMode={field.type === "url" ? "url" : undefined} maxLength={field.type === "url" ? 2000 : field.max} value={text} aria-invalid={invalidUrl} onChange={(e) => onChange(e.target.value)} />
      )}
      {invalidUrl && <p role="alert" className="text-xs text-destructive">Use a full address (https://…), a path starting with /, #section, mailto: or tel:.</p>}
      {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
    </div>
  );
}

/** Returns a message for the first invalid URL field, or null. */
export function findInvalidUrl(fields: Field[], data: Record<string, unknown>): string | null {
  for (const field of fields) {
    const value = data[field.name];
    if (field.type === "url" && typeof value === "string" && value !== "" && !URL_PATTERN.test(value.trim())) return field.label;
    if (field.type === "list" && Array.isArray(value)) {
      for (const item of value) {
        const found = findInvalidUrl(field.fields, item as Record<string, unknown>);
        if (found) return found;
      }
    }
  }
  return null;
}
