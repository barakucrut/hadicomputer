# Rigspace.id

Platform SaaS multi-tenant website khusus toko komputer: landing page `rigspace.id`, etalase per toko di
`{slug}.rigspace.id` (template Precision, Classic, Editorial Gallery, Gaming Arena), CMS toko `/admin`,
dan panel tim platform `/god-mode` (superadmin, CMO, marketing).

Stack: Next.js 16 (App Router), React 19, Prisma 7 + MySQL/MariaDB, Tailwind v4, `sharp`, `exceljs`.

## Menjalankan lokal

Node.js 22/24, MySQL 8+ atau MariaDB 10.6+, package manager **npm**.

```sh
cp .env.example .env      # isi DATABASE_URL & secret
npm install
npm run dev               # http://localhost:3000
```

- Landing platform: http://rigspace.localhost:3000
- Etalase toko: http://localhost:3000 (dev memakai toko admin / toko pertama)
- CMS toko: http://localhost:3000/admin · Panel platform: http://localhost:3000/god-mode

```sh
npm run typecheck
npm test
npm run build && npm start
```

## Dokumen

| Dokumen | Isi |
|---|---|
| [`AGENTS.md`](AGENTS.md) | **Aturan pengembangan (SSOT)**: multi-tenant, keamanan, API, database, storefront, design system, Definition of Done |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Deploy ke server: ukuran data, env, DNS, langkah & verifikasi foto/banner |
| [`docs/BUSINESS_STRATEGY.md`](docs/BUSINESS_STRATEGY.md) | Visi bisnis, harga, komisi, roadmap & status |
| [`docs/brand/README.md`](docs/brand/README.md) | Logo, avatar, dan aset brand Rigspace |
| [`docs/PRD.md`](docs/PRD.md), [`docs/CMS_PRD.md`](docs/CMS_PRD.md) | PRD awal prototype & CMS (historis) |
| [`docs/ASSETS.md`](docs/ASSETS.md), [`docs/QA.md`](docs/QA.md) | Sumber aset & QA prototype (historis) |

Branch `main` = SaaS rigspace.id; branch `hadicomputer` = build single-client (lihat AGENTS.md Bagian 0).
