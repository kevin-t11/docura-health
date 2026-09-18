<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## UI conventions

Use `@/` for imports within `src/` and `@docura/contracts` for shared API types.

Use Hugeicons for every interface icon, including imported registry components.
Use `src/components/icons.tsx` or `HugeiconsIcon` with explicit imports from
`@hugeicons/core-free-icons`. Do not add Lucide, Tabler, or other icon libraries.
The shadcn icon library is configured to `hugeicons`; adapt external components
to this convention before using them.

Use Tailwind CSS v4 utilities for ALL component styling. Do not add semantic
CSS class names (such as `search-field`, `library-search`, or `document-item`),
component CSS files, CSS modules, styled-jsx, custom `@utility` aliases, or CSS
component layers. `src/app/globals.css` contains only Tailwind imports, theme
variables, and base resets. Compose reusable UI with React components and
`cn()`/CVA containing complete utility strings. Use data/aria/group variants for
state and responsive/container variants for layout. Static inline styles are
not allowed; runtime measurements and Motion values may supply dynamic styles.
Vendor PDF text-layer CSS is required for text selection and remains external.

Run `bun run lint` and `bun run build` after migrations.

Preserve these UI dimensions with standard utilities: collapsed controls `size-9`
with `gap-4`, `p-2`, and a `w-13` rail; 18px icons centered in every state.
Expanded/mobile controls are `h-11`, with `gap-3`. Sidebar changes stay instant.
Use `px-4 md:px-6` for document/chat gutters and `rounded-lg`/`rounded-xl` for
controls/surfaces. Keep Hugeicons, DM Sans, and the existing accessible semantics.
