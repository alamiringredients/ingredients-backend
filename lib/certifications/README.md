# Certifications

Edit shared names, descriptions and logos at `/admin/certification-types`. Edit each holder’s status, dates, scope and PDF at `/admin/certifications`. Both use the catalog’s existing form, table, media and permission patterns.

`certification_types` owns the shared identity. `certifications` references a type and records either Al Amir Group or Alamir Ingredients in Sadat City as its holder. A unique type/holder pair represents that holder’s current credential. Replace its document when renewing it. Historical certificate versions are not modeled.

The homepage and products carousel use published Sadat City records. Quality groups published records by holder. Downloads lists published, held records with a PDF. A held record past its expiry date displays as expired and is excluded from downloads. Planned, in-progress, suspended, expired and draft entries never produce certificate download links. Dates are evaluated in UTC. The logo remains independent of the PDF.

Public queries read the database without seeded content fallbacks. One shared cache stores the raw records and invalidates after committed model writes. Expiry is evaluated at render time rather than cached. Page-specific text and layouts remain outside the certification records. The homepage editor controls its introduction and section visibility, while the certificate entries come from the shared records. Legacy quality and catalog templates pass through replacements that remove their static credential lists.

Uploads use the existing Holo media system and public storage. Save a new record before uploading its files. A certificate upload accepts PDF; a type logo upload accepts JPEG, PNG, WebP or AVIF. Clearing the URL removes that file from the public display without deleting the stored upload.

## Database setup

```sh
npm run db:migrate
npm run db:seed
```

The root `database` seeder creates authentication defaults, approved page content, translations, catalog records and filters, certifications, news, sustainability articles and events. Domain seeders write the normalized tables directly. Rerunning them preserves existing editorial changes. The migrations create a new schema; they do not upgrade the previous JSON-based database.

Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` to customize the initial account. The existing local default remains `admin@admin.com` with password `password`. Production account creation requires `SEED_ADMIN_PASSWORD`. The sample web user has no password and cannot sign in. Dashboard authentication uses `admins`, not `users`.

No real certificate PDFs exist in the original assets. Seeded document fields are empty. Downloads also reads product TDS files and the company profile from their existing database owners; placeholder ZIPs, file sizes and document links are omitted.

## Verification

Run `npm run test:database` against the seeded development database. It checks public content against 213 original response hashes, relational constraints, multilingual saves, publication isolation, concurrent booking, query counts and translation seed history. Mutation tests require the isolated `alamir_relational` database and clean up their records.

`translation_seed_keys` records initialized translation keys. A translation intentionally deleted in the dashboard stays deleted when seeders run again. Product filter labels belong to the filter tables, and certification names and descriptions belong to certification translation tables.

Downloads preserves the original hero image and two groups, Product documentation and Company, with italic accent headings and the existing download-card styles. Its localized page copy and hero image live in the Downloads page admin record. Certificates and the company profile share the Company group. Empty groups show availability text until real files are attached.

Downloads resolves PDF sizes from Holo media byte counts. PDFs under `/assets/` use their actual filesystem sizes. Sizes are formatted for the current locale and are not saved again on certification or product records. Arbitrary external URLs are not fetched; when their size is unknown, the UI shows PDF without a size.
