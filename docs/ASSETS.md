# Aset visual prototype

> Dokumen historis prototype awal (`public/images`). Foto & banner toko saat ini ada di `public/uploads` (hasil upload CMS) dan dipindah ke server sesuai [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Logo

`public/images/hadi-logo.jpeg`: logo asli yang diberikan pengguna, disalin tanpa perubahan dari lampiran WhatsApp. Whitespace dibatasi lewat container CSS; identitas logo tidak digambar ulang.

## Foto produk

40 gambar galeri lokal pada `public/images/products/`, bersumber dari dataset demo DummyJSON (https://dummyjson.com), kategori laptops, smartphones, tablets, dan mobile-accessories. Gambar disimpan dari `https://cdn.dummyjson.com/product-images/<kategori>/<slug>/<nomor>.webp`.

Nama model mengikuti foto demo. Harga, konfigurasi, garansi, ketersediaan, dan kondisi telah disusun sebagai data contoh berbahasa Indonesia, bukan penawaran atau spesifikasi terverifikasi toko. Tinjau kembali sumber dan hak penggunaan aset sebelum publikasi produksi; ganti dengan foto resmi/aktual yang diberikan owner.

## Banner hasil generate

Dibuat dengan **built-in imagegen**, bukan CLI. Ketiga PNG berukuran 1536 × 1024 dan disimpan di proyek:

- `public/images/banners/work.png`
- `public/images/banners/gaming.png`
- `public/images/banners/used.png`

Teks kampanye adalah HTML. Aset digunakan sebagai ilustrasi kampanye dan tidak menyatakan stok atau merek tertentu. Next Image mengoptimalkan penyajian gambar sesuai viewport.

### Prompt work

Photorealistic premium product advertising photograph for Hadi Computer electronics catalog hero. Landscape 3:2 composition, a modern open silver ultrabook showing an abstract soft ivory blue screen, with slim wireless mouse and closed notebook, on sculptural pale ivory platform in a minimal warm light gray studio. All products clustered in the right two thirds; generous quiet negative space at left. Sophisticated soft directional studio lighting, realistic metallic surfaces, subtle red accent reflection, no lettering, no branding, no logos, no text, no watermark. Beautiful contemporary commercial product photography, restrained clean retail design, products fully visible with generous margin for responsive cropping.

### Prompt gaming

Photorealistic premium product advertising photograph for Hadi Computer gaming campaign hero. Landscape 3:2 composition. A beautifully built black glass-sided gaming desktop tower with very subtle deep red internal lighting, next to a widescreen monitor displaying an abstract red flowing light ribbon, compact black keyboard. Products clustered in right two thirds on charcoal studio platforms. Moody graphite black background, refined controlled red rim light, believable detailed hardware, premium polished commercial technology photography. Generous negative space at left, no text, no letters, no logos, no watermark, no people. All products fully visible with generous margin.

### Prompt used

Photorealistic premium product advertising photograph for a carefully selected preowned laptop campaign for Hadi Computer. Landscape 3:2 composition. A dark graphite professional laptop open in three quarter view, screen showing abstract green sage gradient, next to a second closed silver laptop on pale sage green geometric studio podium. Clean immaculate realistic electronics, gently lit minimalist pale sage studio background. Products clustered in right two thirds, generous quiet left negative space. Elegant contemporary commercial photography, tactile realistic brushed metal, soft shadows. No writing, no logos, no text, no watermarks, no badges, no people. All products fully visible with generous margin.

## Tambahan produk PC — 10 November 2026

Delapan produk PC ditambahkan dari referensi resmi MSI dan ASUS, dengan 11 foto produk lokal tambahan (total 51 file foto produk). Deskripsi diringkas dalam bahasa Indonesia. RAM/SSD bertanda contoh, harga rupiah, serta ketersediaan adalah data demo, bukan kutipan penawaran Hadi Computer. Spesifikasi seri dapat berbeda menurut SKU dan wilayah; referensi mini PC PRO DP21 menggunakan datasheet SKU 1218SG. Monitor dan periferal tidak termasuk dalam contoh unit.

| Produk                   | Referensi spesifikasi                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| MSI MAG Infinite S3 14th | [Produsen](https://www.msi.com/Desktop/MAG-Infinite-S3-14th/Specification)                  |
| MSI MPG Trident AS 14th  | [Produsen](https://www.msi.com/Desktop/MPG-Trident-AS-14th/Specification)                   |
| MSI MEG Trident X2 14th  | [Produsen](https://www.msi.com/Desktop/MEG-Trident-X2-14th/Specification)                   |
| MSI MAG Codex 6 14th     | [Produsen](https://www.msi.com/Desktop/MAG-Codex-6-14th/Specification)                      |
| MSI Cubi N ADL           | [Produsen](https://us.msi.com/Business-Productivity-PC/Cubi-N-ADL/Specification)            |
| MSI PRO DP21 14M         | [Produsen](https://storage-asset.msi.com/specSheet/sg/mini-pcs/PRO%20DP21%2014M-1218SG.pdf) |
| ASUS ROG G22CH           | [Produsen](https://rog.asus.com/desktops/small-form-factor/rog-g22ch-series/spec/)          |
| ASUS ROG G700 GM700      | [Produsen](https://rog.asus.com/desktops/full-tower/rog-g700-2025-gm700/spec/)              |

### Sumber foto PC

Gambar disimpan sebagai WebP maksimum 1.000 px tanpa mengubah isi visual. File lokal mengikuti nama di bawah pada `public/images/products/`.

- `msi-mag-infinite-s3-14th-1.webp`: [foto produsen](https://storage-asset.msi.com/global/picture/product/product_17417493016d65f23dfba85531bddba07a0ef6dc26.webp).
- `msi-mag-infinite-s3-14th-2.webp`: [foto produsen](https://storage-asset.msi.com/global/picture/product/product_1741749301e724a4b004da77713b74c9cfc08e91ec.webp).
- `msi-mpg-trident-as-14th-1.webp`: [foto produsen](https://storage-asset.msi.com/global/picture/product/product_1720503581880237d33e1ac4dcf5e35ecee1eed756.webp).
- `msi-meg-trident-x2-14th-1.webp`: [foto produsen](https://storage-asset.msi.com/global/picture/product/product_172016309252e4eeaa75b78a6f56a682acadce8c72.webp).
- `msi-mag-codex-6-14th-1.webp`: [foto produsen](https://storage-asset.msi.com/global/picture/product/product_1720503379ba1b2a571ea9f1887b466f3ce419c4c9.webp).
- `msi-cubi-n-adl-1.webp`: [foto produsen](https://storage-asset.msi.com/global/picture/product/product_16818881142a0dfe0b5d8b4ec956da70af982cd2f5.webp).
- `msi-cubi-n-adl-2.webp`: [foto produsen](https://storage-asset.msi.com/global/picture/product/product_1681888114aaa4efb6136c5253865b93a256694890.webp).
- `msi-pro-dp21-14m-1.webp`: [foto produsen](https://storage-asset.msi.com/global/picture/product/product_1722915620efe9b6baf204f9e121c1db6f4357d44c.webp).
- `msi-pro-dp21-14m-2.webp`: [foto produsen](https://storage-asset.msi.com/global/picture/product/product_1722915620cc2b4d92d3f142820bc874ff3d5b9927.webp).
- `asus-rog-g22ch-1.webp`: [foto produsen](https://dlcdnwebimgs.asus.com/gain/6AB8F810-F234-4EE9-A28F-E1BC120E5023).
- `asus-rog-g700-1.webp`: [foto produsen](https://dlcdnwebimgs.asus.com/gain/4C69C7F1-A978-4A87-8759-8A21A1555A25).
