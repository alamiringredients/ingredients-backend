# Alamir backend

The Holo and Next.js application serving the API and admin dashboard. It owns the database, authentication, authorization, validation, mail, and uploaded files.

## Local setup

Run these commands from this directory:

```bash
cp .env.example .env
```

Configure the database credentials and create the database named by `DB_DATABASE`. Then install dependencies and initialize an empty database:

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

The install preparation script generates the Holo application key and discovery files. The development server listens on port 8000. Open `/login` to access the admin dashboard.

Set `APP_URL=http://localhost:8000` and `FRONTEND_URL=http://localhost:3000` locally. `APP_URL` identifies this backend; `FRONTEND_URL` is the allowed public website origin. See `.env.example` for database, session, storage, and mail settings.

## Deployment

Deploy this directory on the backend server. No frontend source directory is required.

1. Configure `.env` with the backend's public `APP_URL`, the website's `FRONTEND_URL`, and production database, session, and mail settings.
2. Keep the existing `APP_KEY` on subsequent deployments. Use `APP_ENV=production`, `APP_DEBUG=false`, and secure session cookies with HTTPS.
3. Install and build:

```bash
npm ci
npm run db:migrate
npm run build
npm start
```

Run `npm run db:seed` when initializing a new database. Keep the database and uploaded storage persistent across deployments. `npm start` listens on port 8000; configure the server's reverse proxy accordingly.

## Structure and API

See [architecture.md](docs/architecture.md) for controller, service, model, and validation responsibilities.

Next.js routes delegate to domain controllers. Public reads use explicit endpoints below `/api/v1/public/`, such as `/api/v1/public/catalog/payload?locale=en&page=products`. Submission endpoints live under `/api/v1/enquiries`, `/api/v1/meetings`, and `/api/v1/careers`.

Holo form schemas live beside the actions and controllers that use them. The frontend owns its own client-side form definitions because it is deployed separately.

## Checks

```bash
npm run typecheck
npm run lint
npm run test:public-api
npm run test:crud
npm run test:security
npm run test:database
```

Database integration tests require a configured test database. The content parity test compares against stored hashes, so its fixtures must match the content being tested.
