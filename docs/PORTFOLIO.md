# Dynamic portfolio

## Architecture

- `src/lib/portfolio/portfolio.ts`: paginated React Query reads, category discovery, realtime invalidation, signed URLs, browser image processing, optimistic metadata writes, uploads and durable cleanup.
- `src/lib/portfolio/geometry.ts`: bounded cursor-centered zoom and pan calculations.
- `src/components/portfolio/*`: responsive reusable gallery, thumbnail placeholders and lazy-loaded Radix modal viewer.
- `src/components/admin/PortfolioAdminPage.tsx`: multi-upload, drop zone, draft previews, metadata editor, image replacement, ordering, publication and deletion.
- `src/routes/admin.portfolio.tsx`: guarded by the existing `/admin` layout and database authorization.
- Homepage Work, motion showcase scenes and `/portfolio` read the same published database collection. No project collection or image URLs are embedded in frontend components. Existing unrelated services/page-wrapper edits are preserved.

## Deployment (not performed automatically)

1. Apply `supabase/migrations/0008_portfolio.sql` after 0001 through 0007, using the existing deployment migration process. This creates `portfolio_items`, `portfolio_cleanup`, an ordering sequence, private `portfolio` and `portfolio-originals` buckets, RLS policies, file-validation/cleanup triggers, category discovery and atomic reorder RPCs. It adds portfolio metadata to realtime. If a bucket with either name already exists in a live project, inspect and reconcile its settings before applying; no existing storage schema is assumed or overwritten.
2. Deploy the application using the existing public Supabase environment variables. No new browser secrets or service-role key are needed. Do not deploy the changed frontend before the migration.
3. At `/admin/portfolio`, upload assets, edit the generated titles and alt text, preview, then publish. Changes propagate through realtime; a 60-second poll and focus/reconnect refetch recover missed events.
4. To import the existing 17 local screenshots, install Pillow for the one-time CLI preparation if needed. `node scripts/portfolio/import.mjs` performs only a local dry run and reports optimized sizes. To upload, set `PORTFOLIO_ADMIN_EMAIL` and `PORTFOLIO_ADMIN_PASSWORD` in your shell, then run `node --env-file=.env scripts/portfolio/import.mjs --apply`. This is a write to your configured project and requires explicit operator approval. The script signs in as an admin, creates drafts and skips already imported assets using deterministic IDs; it never overwrites edited items or publishes automatically. Review and publish through the admin. Unset the temporary password variable afterward. Originals remain local as well as in private storage.
5. Verify against staging: a real admin can upload; anonymous and signed-in non-admin clients cannot write; visitors can sign only published derivatives; drafts and originals are denied; realtime publication and storage limits match the migration. Local stand-ins cannot prove Supabase gateway/storage behavior.

## Image pipeline and performance

PNG/JPEG/WebP inputs are limited to 20 MB and 48 megapixels. Browser decoding detects damaged files. Full display variants preserve aspect ratio within 1920 px width and WebP's 16383 px dimension ceiling; top-cropped 960x640 and 480x320 variants are generated sequentially at quality 82. Originals are preserved in an admin-only bucket. Animated inputs are not supported as animations; browser processing creates a still image. SVG and GIF uploads are refused.

The public gallery fetches 24 metadata items per page, signs thumbnails in one batch, uses `srcset`/`sizes`, fixed dimensions and lazy loading (only the first two eager). Search is debounced. The viewer JS is dynamically imported, signs the display image only when opened, then warms at most the next image after load; data-saver users skip warming. Original files are never used for public gallery or viewer delivery. Signed URLs expire after one hour; queries refresh every minute. Already issued signed URLs can remain usable until expiry after unpublishing, so unpublish is metadata visibility control rather than instant revocation of a URL someone already possesses. Deletion additionally removes storage objects.

Actual local import dry-run across the 17 supplied projects:

| Asset group                 | Total bytes |
| --------------------------- | ----------: |
| Original PNGs               | 133,542,079 |
| Existing full WebPs         |  12,356,160 |
| Prepared full display WebPs |  11,690,224 |
| 960 px thumbnails           |     895,882 |
| 480 px thumbnails           |     355,202 |

480 px thumbnails are 97.1% smaller than the existing full WebPs (99.7% smaller than original PNGs). These are measured file sizes, not estimated load-time improvements. Browser tests attach request-byte and layout-shift measurements; development-server timings are not production Core Web Vitals.

## Consistency and recovery

- Every upload uses a new UUID/version directory and `upsert:false`. Never overwrites an image currently in use or a cached image.
- Before uploading, the client records all intended objects in a durable cleanup queue with a 24-hour grace period. Interrupted tabs cannot permanently lose the identity of temporary uploads.
- All four files must exist before the database accepts metadata. A lost save response is followed by a read-back check. Ambiguous failures retain files rather than risk deleting an image whose save actually committed.
- Metadata edits and deletes compare `updated_at`; stale edits report a refresh/retry error.
- Replace/delete triggers enqueue old objects in the same database transaction. Storage deletion occurs only after records stop referencing those paths. Storage RLS independently refuses deletion of any currently referenced file, including another item's file.
- Admin visits and completed mutations process cleanup; the Retry storage cleanup button exposes failures and safe recovery. Processing is bounded to 100 objects per call; repeat for larger backlogs. A server-scheduled cleanup worker is optional for sites that require cleanup even when no administrator visits. There is no service-role credential or background scheduler in this client app.
- Reordering is a database RPC with a table lock, adjacency check, stale-order comparison and deferred uniqueness constraint. Both positions change atomically. Filters must be cleared before reordering; load the next page to move across its boundary.
- Inputs are processed sequentially to bound memory. Progress uses actual XHR upload events and only finishes after the metadata save; requests support cancellation and a two-minute timeout; each batch reports actual saved counts and per-file errors. Retry failed files by selecting or dropping them again. Stopping a batch preserves completed drafts.

## Accessibility and gestures

Radix handles focus trapping, Escape and focus restoration. Controls have visible focus indicators, 44px touch targets, labels and live image announcements. Reduced-motion styles disable gallery/viewer animation. Lenis is stopped while the viewer is open and resumes on close. Wheel handling exists only on the mounted image stage with a non-passive listener; it cannot affect normal closed-viewer page scrolling. Pointer capture handles drag/pinch, bounds prevent losing the image, and swipes navigate only at the unzoomed scale with no pinch in progress. Keyboard zoom/navigation is scoped to the modal and ignores editable elements and modified shortcuts.

## Verification and limits

The new tests cover public visibility, categories/search, thumbnail loading, pagination (70 items), unavailable images, full-image loading, modal keyboard/arrows/focus, wheel zoom, pan/reset, touch swipe and pinch, seven viewport widths, axe checks, admin multi-upload/edit/replacement/preview/reorder/publication/deletion, bad/corrupt/oversized inputs, storage/network/DB failures, duplicate save clicks and cleanup retries. PGlite executes the real migration and checks RLS/storage permissions, missing files, draft privacy, atomic stale-order rejection and file cleanup.

PGlite cannot simulate multiple PostgreSQL connections. Tests validate stale concurrent reorder requests; a true simultaneous transaction/load test remains a staging check. Browser testing uses Chromium/Chrome with mobile emulation, not physical iOS/Android or Safari/Firefox. No production database, storage, publication or deployment was changed. Live integration and import must be verified after migration and authorization.

## Implementation verification: 16 November 2026

Final checks:

- Vitest: **112 passed**, 17 files, including 38 real-migration PostgreSQL tests. The initial migration cold-start check now has a 20-second integration-test timeout; a parallel build previously pushed WASM startup past the default 5 seconds. It subsequently passed with the complete suite.
- TypeScript: `npx tsc --noEmit` passed.
- Production: `npm run build` passed after the final closing-animation change.
- Targeted ESLint: all portfolio source, animated showcase integration and import JavaScript passed. Repository-wide lint was also executed and remains failing on formatting and existing typing/tooling debt outside this feature. No broad unrelated formatting cleanup was performed.
- Full Playwright regression run: **117 passed, 3 failed, 1 skipped** before the final fixes. The failures were the portfolio filter contrast (fixed with the brand lime color), duplicate-save confirmation replacement (fixed with a confirmation guard), and a network-interruption test whose finite dropped connections were recovered by Chrome. The network test now aborts every upload attempt to exercise a persistent failure rather than incorrectly reject successful recovery.
- After fixes, the **53 affected browser cases** have passing results across the affected run and targeted reruns: 51 passed in the affected run; its remaining homepage animation-timing scan and persistent-network scenario both passed on rerun. The homepage scan now explicitly waits for the existing CTA opacity transition to finish instead of scanning an intermediate fade frame. This does not disable contrast checking.
- Final viewer polish was followed by **4 further passing checks**: desktop/mobile arrows, keyboard, zoom/pan/reset, focus restoration, reduced-motion accessibility and the complete admin multi-upload/edit/replace/preview/reorder/publish/unpublish/delete flow.
- A second complete 124-case browser run was not performed after targeted fixes. The existing unrelated regressions were exercised in the full run; affected public pages and feature paths were rerun afterward.

Responsive verification covered **320, 375, 430, 768, 1024, 1440 and 1920 px** for both gallery/viewer controls and admin management, plus the existing mobile regressions. Controls stayed inside the viewport, viewer targets were at least 44 px, and horizontal overflow checks passed. Native touch swipe and pinch were exercised through Chrome's touch input API on desktop and Pixel emulation. Gallery, modal and admin screenshots were visually inspected; axe checks passed for the tested final interfaces.

Measured browser fixture gallery (70 database rows, first page of 24): **12 thumbnail image requests / 173,448 bytes**, **0 full-image requests**, **0 viewer-module requests before opening**, **22 lazy images**, **CLS 0.00119**. Measurements use real thumbnail image bytes against the isolated test backend, not production traffic. Full-resolution display and next-image warming occur only after opening the viewer. Original PNGs are never delivered to visitors.

Files added:

- `supabase/migrations/0008_portfolio.sql`
- `src/lib/portfolio/{portfolio.ts,geometry.ts,geometry.test.ts}`
- `src/components/portfolio/{PortfolioGallery.tsx,PortfolioImage.tsx,PortfolioLightbox.tsx,portfolio.css}`
- `src/components/admin/{PortfolioAdminPage.tsx,portfolio-admin.css}`
- `src/routes/admin.portfolio.tsx`
- `scripts/portfolio/{import.mjs,prepare.py}`
- `e2e/portfolio.spec.ts`, two small WebP fixtures in `e2e/fixtures/`, and this document.

Existing files updated:

- Admin navigation/realtime mapping: `src/components/admin/AdminLayout.tsx`.
- Public route content: `src/components/pages/PortfolioPage.tsx`.
- Managed homepage work and animated previews: `src/components/home/sections/{Work.tsx,MotionHighlights.tsx,MotionGallery.tsx,motion-showcase-data.ts}`.
- Generated routing: `src/routeTree.gen.ts`.
- Test coverage: `src/test/db/migrations.test.ts`, `src/components/home/sections/MotionShowcase.test.tsx`, `e2e/stub-supabase.mjs`, `e2e/accessibility-mobile.spec.ts`.

The pre-existing uncommitted edits to `PageFrame.tsx`, `ServicesPage.tsx` and `services-page.css` were left intact. No commits, push, deployment, live database migration, live storage write or production import was performed. The safe local feature implementation is ready for review; production activation requires the migration, authorized asset import/publication and staging verification described above. Physical-device/cross-browser testing, true multi-connection PostgreSQL contention testing and live Supabase behavior remain deployment verification work.

## Image loading optimization: 16 November 2026

Live measurements showed that signed thumbnail cache misses took roughly 644-1092 ms to start responding, despite the sampled images being only 10-30 KB. Reusing the exact same signed URL produced a CDN hit of about 29 ms. Regenerating image URLs on every metadata refresh was wasting that cache.

Published image signatures now use a bounded 256-entry cache, shared by gallery and viewer, and persisted in same-tab session storage. URLs are reused for 45 minutes, leaving a 15-minute safety margin before the one-hour signature expiry. Expiry is preserved on reload, concurrent signing is deduplicated, and only missing paths are signed. Project origins are isolated in the cache key and validated. Draft/admin-only signatures are never persisted in this public cache. A viewer retry explicitly invalidates a failed public signature.

The app also preconnects to Supabase, uses responsive image sizes that match actual grid widths, keeps card DOM stable on metadata updates, recognizes images already decoded before load handlers attach, and avoids preloading large neighboring full images on data-saver, 2G/3G or connections below 4 Mbps. Neighbor warming uses low priority; the active image takes precedence. Private storage policies and original assets are unchanged.

Validation: all **120 unit/database tests passed**, including eight cache/connection-budget checks. All **8 targeted browser checks passed**, covering reload/filter cache reuse, draft privacy, image loading/pagination, gallery performance, desktop/mobile viewer controls and homepage previews. TypeScript, targeted portfolio lint and the production build passed.

An isolated Chrome session against the running development site and the real 17 published projects measured:

| Visit           | Ready time | First thumbnail resource time | Signing requests |
| --------------- | ---------: | ----------------------------: | ---------------: |
| First visit     |    5716 ms |                        955 ms |                1 |
| Same-tab reload |    1458 ms |          0 ms (browser cache) |                0 |

The reload reused all 34 thumbnail URLs. The isolated backend test also confirmed **zero additional signing requests** on reload and category filtering. These are first-visit versus warm-cache observations, not a controlled old-code/new-code production speed comparison; development compilation and network conditions affect overall ready time. Cold-image origin latency remains dependent on Supabase. No storage objects, database records, publication status, deployment or git history were modified by this optimization.
