# Product catalog

The public catalog reads `product_categories`, `products`, and the `catalog` website setting. It does not fall back to the generated product pages when a record is missing. Only published products in published categories appear on the website. Categories with one published product link directly to it; the category URL also renders that product.

Initialize the catalog with:

```sh
npx holo migrate
npx holo seed --only product_catalog
```

The seeder imports the catalog's semantic content, media references and EN/AR/FR translations. Immutable seed keys prevent later runs from duplicating records whose slugs or categories were edited. Existing saved content remains intact.

Products and categories use list tables with Edit and Delete actions. Create opens a blank form at `/create`; it inserts a record only after valid submission. Cancel does not create a record. Edit forms use `/{id}/edit`.

Admin routes:

- `/admin/products`: products, ingredients, TDS PDFs, publication, ordering and page content.
- `/admin/product-categories`: category content, artwork and publication.
- `/admin/catalog`: products landing page, SEO and filter options.
- `/admin/settings`: the shared company profile PDF, with a file selection for each locale.

Product page sections can be disabled. Empty accordion bodies are omitted, including technical tables with no values. Missing PDF links and gallery images are omitted. The company profile belongs to the website setting, not to individual products. No sample PDFs are seeded because the existing design only had placeholder download links.

The backend stores and returns content only. Product cards, category navigation, filters, counts, breadcrumbs, document buttons and every other layout decision belong to the separately deployed frontend. Admin actions accept localized text, media URLs, links and visibility settings. Optional content must be supplied in all three locales or cleared in all three.

Checks:

```sh
npm run test:catalog
npm run typecheck
npm run lint
npm run build
```

The integration follows the [Holo-JS database](https://docs.holo-js.com/database/) and [media](https://docs.holo-js.com/media) APIs already used by the homepage CMS.
