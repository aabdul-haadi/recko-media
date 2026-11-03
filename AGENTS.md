<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Homepage architecture

- Raytech homepage content lives in `src/data/home.ts`; the route in `src/routes/index.tsx` renders `src/components/home/HomePage.tsx`, which composes individual section files from `src/components/home/sections/*`, shared motion primitives in `src/components/motion/*`.
- Smooth scroll = Lenis driven by the GSAP ticker (`SmoothScroll.tsx`); do not add competing scroll handlers.
- Character/word reveals use CSS transitions (`SplitReveal.tsx`), not GSAP tweens — GSAP tweens were unreliable under StrictMode hydration; keep it that way.
- Grainy acid text must be applied per character via `charClassName="text-grain"` — `background-clip: text` does not paint through the overflow-hidden word wrappers.
