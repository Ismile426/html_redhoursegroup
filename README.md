# RedHorse PIM — Catalog Explorer

Static demo of the RedHorse Group PIM catalog explorer (Biztech / Pimcore).

Open `index.html` locally or deploy to Vercel for hosting.

## Pages

| URL | Page |
|-----|------|
| `/` | Catalog Explorer |
| `/product-creation-wizard.html` | Product Creation Wizard |
| `/product-listing.html` | Product Listing & Hierarchy (search + Method B tree) |

Product data (templates → variants → sub-variants) lives in `redhorse-db.js`, shared by the wizard and the listing page.

## Deploy on Vercel

1. Import this GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Other** (static site)
3. Deploy — no build command needed

Live site: [html-redhoursegroup.vercel.app](https://html-redhoursegroup.vercel.app/)
