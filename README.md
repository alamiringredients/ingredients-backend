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

Deploy this directory on a Node.js server with access to MySQL. Use Node.js 20.9 or newer and npm. The public frontend is deployed separately; no frontend source directory is required here. Run all commands below from this directory.

### 1. Configure environment variables

For the first deployment, copy the example configuration:

```bash
cp .env.example .env
```

Edit `.env` before installing dependencies. Replace the example domains and credentials with your production values:

```dotenv
APP_NAME="Alamir Ingredients"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
APP_KEY=

FRONTEND_URL=https://www.example.com
FRONTEND_DOMAIN=www.example.com

DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=alamir_relational
DB_USERNAME=alamir
DB_PASSWORD="replace-with-database-password"

SESSION_DRIVER=file
SESSION_CONNECTION=main
SESSION_COOKIE=alamir_session
SESSION_PATH=/
SESSION_SECURE=true
SESSION_SAME_SITE=lax
SESSION_IDLE_TIMEOUT=120
SESSION_LIFETIME=120
SESSION_REMEMBER_ME_LIFETIME=43200

CACHE_DRIVER=file
CACHE_PREFIX=alamir_relational

SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD="replace-with-a-strong-unique-password"
```

`APP_URL` is the backend's public HTTPS URL. `FRONTEND_URL` must match the website origin, including a port if present; `FRONTEND_DOMAIN` is the same host and optional port without a scheme or path. Leave `SESSION_DOMAIN` unset for a cookie scoped to the backend host. Session timeout and lifetime values are in minutes.

Set `APP_DEBUG=false` in production, regardless of the inline comment in `.env.example`. Keep `.env` private and out of version control. On subsequent deployments, restore the existing `.env` and `APP_KEY` instead of copying the example again.

Configure storage using the variables already present in `.env.example`:

| Variable | Production value |
| --- | --- |
| `STORAGE_DEFAULT_DISK` | `r2` for the configured S3-compatible media disk. |
| `STORAGE_ROUTE_PREFIX` | `/storage`. |
| `STORAGE_DISKS_S3_ACCESS_KEY_ID` | Bucket access key. |
| `STORAGE_DISKS_S3_SECRET_ACCESS_KEY` | Bucket secret key. |
| `STORAGE_DISKS_S3_REGION` | `auto` for Cloudflare R2. |
| `STORAGE_DISKS_S3_BUCKET` | The bucket containing the site's media. |
| `STORAGE_DISKS_S3_URL` | Public bucket URL or media custom domain. |
| `STORAGE_DISKS_S3_ENDPOINT` | S3 API endpoint for the bucket provider. |
| `STORAGE_DISKS_S3_FORCE_PATH_STYLE_ENDPOINT` | `false`, unless the provider requires path-style requests. |

The media seeder creates database records referencing the `r2` disk; it does not upload the image or PDF files. Restore the referenced objects into the configured bucket so seeded content can display its media. Career application files use private local storage even when the default disk is `r2`.

Configure outgoing email with `MAIL_MAILER=smtp`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USERNAME`, and `MAIL_PASSWORD`. Use your provider's SMTP settings and keep `MAIL_LOG_BODIES=false`. `MAIL_SECURE=true` selects implicit TLS, typically on port 465; for STARTTLS, typically on port 587, use `false`.

Keep `HOLO_SECURITY_TRUST_PROXY=false` unless your ingress replaces `X-Forwarded-For` with one verified client IP.

### 2. Create the database and install dependencies

Create an empty MySQL database matching `DB_DATABASE` and grant the configured user access to it, including permissions to create and alter tables during migrations. The migration command does not create the database itself.

```bash
npm ci --include=dev
```

The install preparation script generates `APP_KEY` if it is missing and prepares Holo discovery files. It preserves an existing key. Retain that key across releases and server instances. Development dependencies are needed for the build.

### 3. Run migrations and seed the initial data

```bash
npm run db:migrate
npx holo seed --only database --quietly --force
npx holo cache:clear
```

Production seeding requires `--force`. Use the direct Holo command above: `npm run db:seed` has no production force flag, and appending arguments to that script does not forward them to its seed command.

The database seeder creates roles, the administrator, website settings, managed pages, translations, media records, the product catalog, certifications, news, sustainability content, and events. The sample public user is skipped in production.

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` before the first seed. Production administrator creation fails without a password. An administrator with the same email is left unchanged, so rerunning the seed does not reset their password. Remove `SEED_ADMIN_PASSWORD` from the deployment environment after successful initialization.

### 4. Build and start the backend

```bash
npm run build
npm start
```

The build runs `translations:generate`, which connects to MySQL and generates locale files from the translation tables. The database must be reachable, migrated, and seeded before building.

`npm start` listens on port 8000. Run it under your hosting platform's process supervisor and configure an HTTPS reverse proxy to forward the backend domain to that port. Ensure the application user can write to `storage/`, and preserve that directory across releases: it contains private uploads, local public files, sessions, cache, and rate-limit data. Keep the MySQL database and media bucket persistent too.

Open `https://api.example.com/login` and sign in using the seeded administrator credentials. Check the public API from the configured frontend origin and confirm seeded images and PDFs load.

### Subsequent deployments

Back up the database and uploaded files, deploy the updated source, and restore the production environment and persistent storage. Then run:

```bash
npm ci --include=dev
npm run config:clear
npm run db:migrate
npx holo cache:clear
npm run build
```

Restart the supervised `npm start` process after the build succeeds. If you use configuration caching, regenerate it with `npm run config:cache` after clearing it and before restarting.

Seed an existing production database only when a release explicitly requires it and after reviewing the affected seeders. Some seeders update existing content. Use the same production seed command from step 3 when needed, before building. Never use `migrate:fresh` for an existing production database; it drops all tables.

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
