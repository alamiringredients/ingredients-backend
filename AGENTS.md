<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## CMS content ownership

Before adding editable public copy or media, identify its content owner. Page-specific titles, descriptions, labels, empty states, and images belong to that page's CMS record and admin screen. Record-specific content belongs to its record: product and category copy in Products, certificate identity in Certification types, holder status and PDFs in Certifications, and downloads page copy and hero media in Downloads page. Use Translations for shared interface text and static page copy that has no CMS owner. Seed defaults through the owning content seeder and exclude owned fields from the translation catalog.

Every public-facing string must resolve from its owning CMS record or the translation table. English literals may define seeder defaults and translation keys, but public rendering must not use code defaults when the database row is missing. Buttons, statuses, navigation labels, accessibility labels, and other interface copy belong to Translations. Editorial headings, descriptions, empty-state messages, SEO copy, and media belong to the relevant content-management screen.

## Application structure

The backend owns semantic content, persistence, validation, authorization and the public HTTP API. It must not store or return HTML templates, frontend component names, layout choices, CSS classes, animation settings or other presentation decisions. The separately deployed frontend owns all rendering and design. Do not import frontend source into the backend.

Use Holo's documented public APIs directly and follow its framework conventions. Do not wrap Holo in project-specific repositories, action runners, validators or response abstractions. Keep code in the framework location where Holo expects it and add a shared module only when it represents a real domain concept used in more than one place.

## Forms and validation

Build every submitting form with `@holo-js/forms` and the host adapter. Define its Holo schema beside the backend action or controller that validates it and call `validate(...)` directly at the boundary. The separately deployed frontend has its own schema for browser behavior; never share backend source with it. Perform redirects on the server after a mutation succeeds. Keep database, authorization, file-signature and other domain checks on the server, returning them through Holo validation errors.
