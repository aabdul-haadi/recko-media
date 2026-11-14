# Making a page editable (developer note)

The admin editor (Admin > Pages & content) is driven by a registry, so a new page needs code in three places and
**no database change** (content is stored per section key in `content_drafts` / `content_published`; keys only need to
match `^[a-z0-9_]{1,50}$`).

1. **Register the page and its sections** in `src/lib/content/page-sections.ts`
   - add an entry to `EDITOR_PAGES` (`id`, `label`, `path` for the preview link, `description`);
   - add sections to `EXTRA_SECTIONS` with `page: "<id>"`, the `fields` the editor should show, and `toggleable: true`
     where the client may hide the block;
   - add the built-in wording to `EXTRA_DEFAULTS`, copied exactly from the current page, so nothing changes until
     something is published. `page-sections.test.ts` fails if a section has no defaults, a field has no value, a text
     field has no `max`, or a built-in value is too long or an unsafe link.
2. **Read the wording in the page component** with `useSection("<key>")` (see `AboutPage.tsx`). Check `enabled`
   for sections that can be hidden. Show links with `SiteLink` (it sanitises the address and uses the router for
   site paths). Build phone and email links with `telHref` / `mailtoHref`.
3. **Page head (optional)**: give the route `head: ({ matches }) => pageHead(matches[0]?.loaderData as SiteContent | undefined, { seo: "<page>_seo", faq: "<page>_faq" })`.

Field types: `text`, `textarea`, `url` (validated: a site path, `#section`, `https://`, `mailto:` or `tel:`),
`strings` (one item per line) and `list` (repeatable group of fields, for FAQs, cards, menu items).

Pages not yet editable: Services page wording and Portfolio page wording (their services list is already managed in
Admin > Services). Add them the same way when needed.
