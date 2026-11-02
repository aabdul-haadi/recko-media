# Codebase audit

## Scope and baseline

This audit covers the Vite/TanStack Start application in this repository as it
exists before the restructuring work. The homepage is implemented as a single
file-based route and is composed from reusable layout, motion, and section
components.

The repository does not include installed dependencies in the working tree, so
the initial `test`, `lint`, and `build` commands could not start until the
package manager restores them.

## Current architecture

- **Runtime:** React 19, Vite 8, TanStack Start/Router, and Nitro.
- **Styling:** Tailwind CSS v4 with a custom design system in
  `src/styles.css`; no separate Tailwind config is required.
- **Routing:** TanStack file-based routing. The homepage is
  `src/routes/index.tsx`, with generated route metadata in
  `src/routeTree.gen.ts`.
- **Data:** Homepage copy and navigation data are centralized in
  `src/data/home.ts`.
- **UI:** Homepage-specific layout and sections live in
  `src/components/layout` and `src/components/sections`. Shared animation
  primitives live in `src/components/motion`.
- **Shared primitives:** `src/components/ui` contains shadcn/Radix-style
  primitives. Several are currently used by homepage sections; the remaining
  primitives are retained until usage analysis and a future feature boundary
  justify their removal.
- **Server boundary:** `src/server.ts`, `src/start.ts`, and `src/lib` provide
  SSR startup and error-page behavior. No application database, CMS, CRM, or
  backend integration is present.
- **Tests:** Vitest with jsdom and Testing Library. Current coverage includes
  a route matching smoke test.

## Dependencies and usage findings

The dependency manifest contains three groups:

1. Core runtime dependencies used by the current application (React,
   TanStack, Vite integration, Lenis, GSAP, and selected Radix primitives).
2. Homepage interaction dependencies, including `lucide-react`, `lenis`, and
   `gsap`.
3. A broad Radix/shadcn primitive set generated for future UI work. Some
   primitives are not imported by the homepage today, but removing them would
   require changing the supported component surface and is outside a safe
   cleanup without a product requirement.

No separate backend services or CMS/CRM models were found. The current
architecture leaves a clear extension point for those concerns under feature
modules without coupling them to the homepage route.

## Starter-template remnants

- The package name was a generic TanStack starter name.
- The README contained Lovable product/editor attribution rather than
  project-focused development instructions.
- Runtime error reporting was named after the code-generation platform even
  though its behavior belongs to the application error boundary.
- `.vscode/project.json` and the Vite integration remain because they are part
  of the current TanStack Start/Lovable build integration and are not safe to
  remove based on filenames alone.

## Recommended architecture

The existing structure is appropriate for the current site and should not be
replaced wholesale. As the CMS and CRM are introduced, add bounded modules
under `src/features` (for example `src/features/content` and
`src/features/crm`) with their own API types, data access, and UI. Keep
homepage composition in `src/routes` and shared visual primitives in
`src/components`.

## Changes made from this audit

- Replaced the generic package name with the Raytech project name.
- Removed public Lovable attribution from the README.
- Renamed the runtime reporting module and exported function to neutral
  application terminology while preserving behavior.
- Added this audit as the baseline architecture document.

## Validation plan

After dependencies are installed, run:

```sh
npm run test
npm run lint
npm run build
```

