# Backend architecture

Next.js owns routing and rendering. Holo supplies models, database queries, validation, authentication, authorization, storage, and other backend services. There is no custom router or controller base class.

## Responsibilities

| Location | Responsibility |
| --- | --- |
| `app/api/**/route.ts` | HTTP method exports pointing to controllers. |
| `server/http/controllers/public/` | Public read controllers grouped by domain. |
| `server/http/controllers/` | Submission, authentication, and CSRF controllers. |
| `server/services/<domain>/` | Domain operations that are genuinely shared by more than one entry point. |
| `server/admin/` | Admin authorization, session lookup, list queries, pagination, and form orchestration. |
| `server/models/` | Holo model definitions and relations. |
| `server/db/` | Migrations, seeders, and seed data. |
| `app/**/schema.ts`, `server/http/controllers/*-schema.ts` | Holo form schemas beside their consumers. |
| `lib/<domain>/` | Backend domain contracts and rules shared by multiple backend consumers. |
| `app/admin/`, `components/` | Admin pages, native server actions, and UI components. |

The backend owns semantic content and business rules. It does not choose frontend templates, markup, layout, or visual components. The frontend consumes the public JSON API and owns presentation independently.

## Request flow

A route exports a controller action. The action validates request input with Holo, queries Holo models, shapes the public response, and returns a standard `Response`. Extract a service only when the same domain operation has multiple real consumers.

Successful public responses use the `{data}` envelope and cache headers. Holo validation failures return 422; unexpected failures return 500 with a generic public message and a server log. There is no custom router, controller base class, response wrapper, or projection framework.

## Public endpoints

Explicit route groups live below `/api/v1/public/`.

Examples:

- `/api/v1/public/catalog/payload?locale=en&page=products`
- `/api/v1/public/news/payload?locale=ar`
- `/api/v1/public/news/payload?locale=en&slug=example`
- `/api/v1/public/pages/contact/payload?locale=fr`

The frontend calls these routes through its own API client. The two applications can be deployed on separate servers; configure `FRONTEND_URL` on the backend and `NEXT_PUBLIC_BACKEND_URL` on the frontend.

## Adding a feature

Add or extend the domain's Holo model, put its Holo validation schema beside the consuming action, then add a controller action and thin native route. Use documented Holo APIs directly. Do not add a resource switch, parallel router, repository wrapper, generic response wrapper, or generic content projector.

Validate changes with typecheck, lint, the relevant domain tests, and `npm run test:public-api`. `npm run test:database` also checks stored content hashes; those fixtures must represent the database content being tested.
