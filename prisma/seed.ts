import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import productsData from "../src/lib/products.json";
import { banners, categories, services, store } from "../src/lib/repository";
import type { Product as JsonProduct } from "../src/lib/types";
import { HADI_TENANT_ID } from "../src/lib/tenant-service";

const tenantId = HADI_TENANT_ID;

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Admin User
  const passwordHash = bcrypt.hashSync("admin123", 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@hadicomputer.com" },
    update: { passwordHash, name: "Owner Hadi Computer" },
    create: {
      email: "admin@hadicomputer.com",
      passwordHash,
      name: "Owner Hadi Computer",
      role: "OWNER",
      tenantId,
    },
  });
  console.log("✅ Admin user ready:", admin.email);

  // 2. Store Settings
  await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {
      storeName: store.name,
      whatsappNumber: "6285769000007",
      address: store.address || "Jl. Ahmad Yani No. 45, Lantai 1",
      openHours: store.hours || "Buka setiap hari: 08.00 – 22.00 WIB",
      whatsappDefaultTemplate:
        "Halo Hadi Computer, saya ingin berkonsultasi mengenai perangkat laptop/komputer.",
    },
    create: {
      id: "default",
      storeName: store.name,
      whatsappNumber: "6285769000007",
      address: store.address || "Jl. Ahmad Yani No. 45, Lantai 1",
      openHours: store.hours || "Buka setiap hari: 08.00 – 22.00 WIB",
      whatsappDefaultTemplate:
        "Halo Hadi Computer, saya ingin berkonsultasi mengenai perangkat laptop/komputer.",
    },
  });
  console.log("✅ Store settings ready");

  // 3. Categories
  const categoryMap = new Map<string, string>();
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const cat = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId, slug: c.value } },
      update: {
        name: c.name,
        icon: c.icon,
        description: c.description,
        sortOrder: i,
        isActive: true,
      },
      create: {
        tenantId,
        name: c.name,
        slug: c.value,
        icon: c.icon,
        description: c.description,
        sortOrder: i,
        isActive: true,
      },
    });
    categoryMap.set(c.value, cat.id);
  }
  console.log(`✅ ${categoryMap.size} categories ready`);

  // 4. Brands (Collected from products)
  const products = productsData as JsonProduct[];
  const uniqueBrands = Array.from(new Set(products.map((p) => p.brand.trim())));
  const brandMap = new Map<string, string>();
  for (let i = 0; i < uniqueBrands.length; i++) {
    const brandName = uniqueBrands[i];
    const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const brand = await prisma.brand.upsert({
      where: { tenantId_slug: { tenantId, slug } },
      update: { name: brandName, sortOrder: i },
      create: { tenantId, name: brandName, slug, sortOrder: i },
    });
    brandMap.set(brandName, brand.id);
  }
  console.log(`✅ ${brandMap.size} brands ready`);

  // 5. Products, Variants, Images, Specs
  for (const p of products) {
    const categoryId = categoryMap.get(p.category) || Array.from(categoryMap.values())[0];
    const brandId = brandMap.get(p.brand) || Array.from(brandMap.values())[0];
    const condition = p.condition === "bekas" ? "BEKAS" : "BARU";
    const availability =
      p.availability === "habis"
        ? "HABIS"
        : p.availability === "preorder"
        ? "PREORDER"
        : "TERSEDIA";

    const basePrice = p.price ? BigInt(p.price) : null;
    const originalPrice = p.originalPrice ? BigInt(p.originalPrice) : null;
    const isFeatured = p.labels?.includes("Pilihan Hadi") || false;
    const isBestSeller = p.labels?.includes("Terlaris") || false;
    const isPromo = p.labels?.includes("Promo") || Boolean(p.originalPrice && p.price && p.originalPrice > p.price);
    const isNewArrival = p.labels?.includes("Terbaru") || false;

    // Upsert Product
    const product = await prisma.product.upsert({
      where: { tenantId_slug: { tenantId, slug: p.slug } },
      update: {
        code: p.code,
        name: p.name,
        summary: p.summary,
        description: p.description,
        condition,
        basePrice,
        originalPrice,
        availability,
        warranty: p.warranty || "Garansi Toko 1 Bulan",
        bonus: p.bonus || null,
        isFeatured,
        isBestSeller,
        isPromo,
        isNewArrival,
        needs: p.needs ? (p.needs as any) : undefined,
        categoryId,
        brandId,
        publicationStatus: "PUBLISHED",
      },
      create: {
        tenantId,
        code: p.code,
        slug: p.slug,
        name: p.name,
        summary: p.summary,
        description: p.description,
        condition,
        basePrice,
        originalPrice,
        availability,
        warranty: p.warranty || "Garansi Toko 1 Bulan",
        bonus: p.bonus || null,
        isFeatured,
        isBestSeller,
        isPromo,
        isNewArrival,
        needs: p.needs ? (p.needs as any) : undefined,
        categoryId,
        brandId,
        publicationStatus: "PUBLISHED",
      },
    });

    // Delete existing relations to refresh cleanly
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productSpec.deleteMany({ where: { productId: product.id } });

    // Insert Images
    if (p.images && p.images.length > 0) {
      await prisma.productImage.createMany({
        data: p.images.map((img, idx) => ({
          productId: product.id,
          url: img,
          altText: `${p.name} - ${idx + 1}`,
          isPrimary: idx === 0,
          sortOrder: idx,
        })),
      });
    }

    // Insert Specs
    if (p.specs && p.specs.length > 0) {
      await prisma.productSpec.createMany({
        data: p.specs.map((spec, idx) => ({
          productId: product.id,
          key: spec.name,
          value: spec.value,
          sortOrder: idx,
        })),
      });
    }

    // Insert Variants
    if (p.variants && p.variants.length > 0) {
      await prisma.productVariant.createMany({
        data: p.variants.map((v, idx) => ({
          productId: product.id,
          name: v.name,
          price: v.price ? BigInt(v.price) : null,
          originalPrice: v.originalPrice ? BigInt(v.originalPrice) : null,
          availability:
            v.availability === "habis"
              ? "HABIS"
              : v.availability === "preorder"
              ? "PREORDER"
              : "TERSEDIA",
          isDefault: idx === 0,
          sortOrder: idx,
        })),
      });
    }
  }
  console.log(`✅ ${products.length} products with variants, images, and specs synced`);

  // 6. Banners & Hotspots
  for (let i = 0; i < banners.length; i++) {
    const b = banners[i];
    const banner = await prisma.banner.upsert({
      where: { id: b.id },
      update: {
        title: b.title,
        subtitle: b.description,
        badgeText: b.eyebrow,
        ctaLabel: b.cta,
        ctaUrl: b.href,
        imageUrl: b.image,
        imageAlt: b.title,
        bgTheme: b.theme,
        sortOrder: i,
        isActive: true,
      },
      create: {
        tenantId,
        id: b.id,
        title: b.title,
        subtitle: b.description,
        badgeText: b.eyebrow,
        ctaLabel: b.cta,
        ctaUrl: b.href,
        imageUrl: b.image,
        imageAlt: b.title,
        bgTheme: b.theme,
        sortOrder: i,
        isActive: true,
      },
    });

    await prisma.bannerHotspot.deleteMany({ where: { bannerId: banner.id } });
    if (b.hotspots && b.hotspots.length > 0) {
      await prisma.bannerHotspot.createMany({
        data: b.hotspots.map((h, idx) => ({
          bannerId: banner.id,
          label: h.label,
          xPercent: h.x,
          yPercent: h.y,
          sortOrder: idx,
        })),
      });
    }
  }
  console.log(`✅ ${banners.length} banners with hotspots synced`);

  // 7. Services
  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    await prisma.service.upsert({
      where: { tenantId_slug: { tenantId, slug: s.slug } },
      update: {
        title: s.name,
        summary: s.summary,
        description: s.description,
        estimatedTime: "1 - 3 Hari Kerja",
        priceInfo: s.price ? `Mulai Rp ${s.price.toLocaleString("id-ID")}` : "Konsultasi / Sesuai Kerusakan",
        ctaWhatsappText: `Halo Hadi Computer, saya ingin konsultasi mengenai layanan ${s.name}.`,
        imageUrl: s.image,
        isActive: true,
        sortOrder: i,
      },
      create: {
        tenantId,
        title: s.name,
        slug: s.slug,
        summary: s.summary,
        description: s.description,
        estimatedTime: "1 - 3 Hari Kerja",
        priceInfo: s.price ? `Mulai Rp ${s.price.toLocaleString("id-ID")}` : "Konsultasi / Sesuai Kerusakan",
        ctaWhatsappText: `Halo Hadi Computer, saya ingin konsultasi mengenai layanan ${s.name}.`,
        imageUrl: s.image,
        isActive: true,
        sortOrder: i,
      },
    });
  }
  console.log(`✅ ${services.length} services synced`);

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
