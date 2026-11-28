import type { Locale } from "@/lib/i18n";

/**
 * Teks & data landing page rigspace.id (satu tempat untuk wording, harga, dan template — ID & EN).
 * Aturan: tanpa angka/testimoni karangan, tanpa fitur yang belum ada kecuali diberi label "segera" (`|segera`).
 */

export const BRAND_LINE = "Rig your store.";
export const BRAND_COLORS = ["#dd2028", "#2563eb", "#111413", "#16a34a", "#facc15"];

export interface LandingPlan {
  id: string;
  name: string;
  for: string;
  price: string;
  period: string;
  alt: string;
  features: string[];
  cta: string;
  highlight: boolean;
}

export interface LandingCopy {
  locale: Locale;
  soonLabel: string;
  meta: {
    title: string;
    description: string;
    ogLocale: string;
    ogAlt: string;
  };
  nav: {
    ariaLabel: string;
    items: { href: string; label: string }[];
    login: string;
    cta: string;
    langAriaLabel: string;
  };
  hero: {
    ariaLabel: string;
    eyebrow: string;
    lines: [string, string, string];
    lead: string;
    tryLabel: string;
    storePlaceholder: string;
    fallbackStoreWord: string;
    brandColorLabel: string;
    colorAriaPrefix: string;
    cta: string;
    freeLabel: string;
    hint: string;
    liveBadge: string;
    desktopAltPrefix: string;
    mobileAltPrefix: string;
    desktopAltFallback: string;
    toastTitle: string;
    toastMessage: string;
    toastMetaPrefix: string;
  };
  marquee: {
    ariaLabel: string;
    items: string[];
  };
  problems: {
    eyebrow: string;
    heading: string;
    items: { title: string; body: string }[];
  };
  features: {
    eyebrow: string;
    heading: string;
    coreTag: string;
    proTag: string;
    catalogTitle: string;
    catalogBody: string;
    specs: { label: string; value: string }[];
    waTitle: string;
    waBody: string;
    waTimestamp: string;
    waPrefix: string;
    waProduct: string;
    waSuffix: string;
    studioTitle: string;
    studioBody: string;
    migrateTitle: string;
    migrateBody: string;
    pcBuilderTitle: string;
    pcBuilderBody: string;
    domainTitle: string;
    domainBody: string;
  };
  steps: {
    eyebrow: string;
    heading: string;
    items: { title: string; body: string }[];
  };
  templates: {
    eyebrow: string;
    heading: string;
    lead: string;
    more: string;
    items: { id: string; name: string; note: string; image: string }[];
  };
  report: {
    eyebrow: string;
    heading: string;
    lead: string;
    checks: { label: string; soon?: boolean }[];
    dashTitle: string;
    dashPeriod: string;
    kpis: { label: string; value: string }[];
    bars: [string, number, number][];
    note: string;
  };
  pricing: {
    eyebrow: string;
    heading: string;
    popularBadge: string;
    footNote: string;
    plans: LandingPlan[];
  };
  faq: {
    eyebrow: string;
    heading: string;
    items: { q: string; a: string }[];
  };
  final: {
    eyebrow: string;
    heading: string;
    lead: string;
    waCta: string;
  };
  form: {
    title: string;
    storeLabel: string;
    storePlaceholder: string;
    cityLabel: string;
    cityPlaceholder: string;
    whatsappLabel: string;
    whatsappPlaceholder: string;
    linkLabel: string;
    linkPlaceholder: string;
    submit: string;
    sending: string;
    genericError: string;
    helperText: string;
    orDirectPrefix: string;
    directChatLink: string;
    doneTitle: string;
    doneThankYou: string;
    doneBody: string;
  };
  footer: {
    features: string;
    pricing: string;
    loginCms: string;
    contact: string;
  };
}

const LANDING_ID: LandingCopy = {
  locale: "id",
  soonLabel: "SEGERA",
  meta: {
    title: "Rigspace.id — Website Toko Komputer, Siap Jualan",
    description:
      "Platform website khusus toko komputer: katalog dengan spesifikasi, chat WhatsApp langsung, tanpa potongan marketplace. Minta demo gratis dengan produk toko Anda sendiri.",
    ogLocale: "id_ID",
    ogAlt: "Contoh website toko komputer di Rigspace.id",
  },
  nav: {
    ariaLabel: "Navigasi",
    items: [
      { href: "#fitur", label: "Fitur" },
      { href: "#cara-kerja", label: "Cara Kerja" },
      { href: "#contoh", label: "Contoh" },
      { href: "#harga", label: "Harga" },
      { href: "#faq", label: "FAQ" },
    ],
    login: "Masuk",
    cta: "Minta Demo",
    langAriaLabel: "Pilih bahasa",
  },
  hero: {
    ariaLabel: "Pengantar",
    eyebrow: "Platform website khusus toko komputer",
    lines: ["Pembeli datang.", "Chat masuk.", "Margin utuh."],
    lead: "Website khusus toko komputer — katalog lengkap dengan spesifikasi, pembeli langsung chat WhatsApp, tanpa potongan marketplace.",
    tryLabel: "Coba sekarang — ketik nama toko Anda",
    storePlaceholder: "Nama toko Anda",
    fallbackStoreWord: "Toko",
    brandColorLabel: "Warna brand:",
    colorAriaPrefix: "Warna",
    cta: "Jadikan website asli — Demo Gratis",
    freeLabel: "Gratis",
    hint: "disiapkan dengan produk toko Anda sendiri",
    liveBadge: "Pratinjau langsung, tanpa daftar",
    desktopAltPrefix: "Contoh tampilan website toko",
    mobileAltPrefix: "Contoh tampilan website toko",
    desktopAltFallback: "Anda",
    toastTitle: "Chat WhatsApp masuk",
    toastMessage: "Halo kak, promo bundling laptop minggu ini masih ada?",
    toastMetaPrefix: "Baru saja · dari",
  },
  marquee: {
    ariaLabel: "Dibuat untuk",
    items: ["Toko laptop", "Rakit PC", "Servis komputer", "Printer & aksesori", "Gaming gear", "Laptop bekas"],
  },
  problems: {
    eyebrow: "Masalahnya",
    heading: "Jualan online seharusnya tidak semahal ini.",
    items: [
      {
        title: "Potongan marketplace makan margin.",
        body: "Biaya admin marketplace bisa 4–8,5% per transaksi, sementara margin laptop sering hanya beberapa persen.",
      },
      {
        title: "Pembeli mudah pindah toko.",
        body: "Di marketplace, toko Anda bersebelahan dengan pesaing yang lebih murah sepuluh ribu.",
      },
      {
        title: "Website lama ribet dan rawan.",
        body: "Puluhan plugin, tidak ada yang merawat, dan kadang disusupi link judi tersembunyi tanpa Anda sadari.",
      },
    ],
  },
  features: {
    eyebrow: "Fitur",
    heading: "Semua yang dibutuhkan toko komputer. Tidak lebih, tidak kurang.",
    coreTag: "INTI",
    proTag: "PRO",
    catalogTitle: "Katalog dengan spesifikasi",
    catalogBody: "Filter prosesor, RAM, VGA, baru atau bekas. Pembeli langsung paham, tidak perlu tanya satu per satu.",
    specs: [
      { label: "Prosesor", value: "Intel Core i7 · Ryzen 7" },
      { label: "RAM", value: "16 GB" },
      { label: "VGA", value: "RTX 4060" },
      { label: "Kondisi", value: "Baru · Bekas" },
    ],
    waTitle: "Tombol WhatsApp di setiap produk",
    waBody: "Pertanyaan masuk lengkap dengan nama produk dan harga — dan tercatat di laporan Anda.",
    waTimestamp: "WhatsApp · baru saja",
    waPrefix: "Halo, saya mau tanya stok ",
    waProduct: "Asus Zenbook Pro Dual Screen",
    waSuffix: " masih ada?",
    studioTitle: "Studio Banner",
    studioBody: "Foto produk diubah jadi banner promo yang rapi, tanpa desainer.",
    migrateTitle: "Pindah tanpa ketik ulang",
    migrateBody: "Katalog diimpor dari Excel atau website lama Anda.",
    pcBuilderTitle: "PC Builder & Trade-In",
    pcBuilderBody: "Pembeli merakit PC sendiri atau menaksir tukar tambah laptop lamanya — fitur yang tidak dimiliki website biasa.",
    domainTitle: "Domain sendiri & muncul di Google",
    domainBody: "SEO lokal per toko, tampil saat orang mencari toko komputer di kotanya.",
  },
  steps: {
    eyebrow: "Cara kerja",
    heading: "Lihat dulu, baru putuskan.",
    items: [
      { title: "Kirim link toko Anda", body: "Dari marketplace, website lama, atau file katalog." },
      { title: "Kami siapkan demonya", body: "Website dengan nama, logo, dan produk Anda sendiri — gratis." },
      { title: "Cocok? Langsung live", body: "Di namatoko.rigspace.id atau domain Anda sendiri." },
    ],
  },
  templates: {
    eyebrow: "Contoh website",
    heading: "Satu toko, banyak gaya.",
    lead: 'Contoh tampilan untuk toko fiktif "Rig Computer". Warna, logo, dan font mengikuti brand toko Anda.',
    more: "Pilihan template & font terus bertambah.",
    items: [
      { id: "precision", name: "Precision", note: "Bersih & presisi", image: "/platform/landing/tpl-precision.webp" },
      { id: "classic-retail", name: "Classic", note: "Toko serba ada", image: "/platform/landing/tpl-classic-retail.webp" },
      { id: "minimalist-boutique", name: "Boutique", note: "Minimalis", image: "/platform/landing/tpl-minimalist-boutique.webp" },
      { id: "gaming-arena", name: "Gaming Arena", note: "Untuk rakit PC", image: "/platform/landing/tpl-gaming-arena.webp" },
    ],
  },
  report: {
    eyebrow: "Laporan",
    heading: "Tahu produk mana yang paling ditanyakan.",
    lead: "Bukan sekadar jumlah pengunjung — Anda melihat pertanyaan yang benar-benar masuk, produk apa, dan dari halaman mana.",
    checks: [
      { label: "Klik WhatsApp per produk" },
      { label: "Produk paling banyak ditanyakan" },
      { label: "Stok habis yang masih banyak ditanya", soon: true },
    ],
    dashTitle: "Inquiry WhatsApp",
    dashPeriod: "30 hari terakhir",
    kpis: [
      { label: "Chat masuk", value: "128" },
      { label: "Produk ditanya", value: "46" },
      { label: "Dari Google", value: "38%" },
    ],
    bars: [
      ["Asus Zenbook Pro Dual", 92, 24],
      ["MSI Pro DP21 14M", 70, 18],
      ["Rakit PC Gaming 12jt", 55, 14],
      ["Printer Epson L3250", 38, 10],
    ],
    note: "Ilustrasi tampilan laporan, bukan data toko sungguhan.",
  },
  pricing: {
    eyebrow: "Harga",
    heading: "Harga jelas, tanpa potongan per transaksi.",
    popularBadge: "Paling dipilih",
    footNote: "Semua paket diawali demo gratis dengan produk toko Anda sendiri.",
    plans: [
      {
        id: "starter",
        name: "Starter",
        for: "Toko servis & aksesori",
        price: "Rp 1,49 jt",
        period: "/ tahun",
        alt: "atau Rp 150rb / bulan",
        features: ["Katalog produk baru & bekas", "Tombol WhatsApp di setiap produk", "CMS sederhana", "Domain sendiri"],
        cta: "Minta Demo",
        highlight: false,
      },
      {
        id: "pro",
        name: "Pro",
        for: "Toko retail komputer & rakit PC",
        price: "Rp 2,79 jt",
        period: "/ tahun",
        alt: "atau Rp 280rb / bulan",
        features: ["Semua fitur Starter", "SEO lokal", "PC Builder Simulator|segera", "Kalkulator Trade-In|segera", "Broadcast promo WhatsApp|segera"],
        cta: "Minta Demo Gratis",
        highlight: true,
      },
      {
        id: "enterprise",
        name: "Enterprise",
        for: "Distributor & toko grosir",
        price: "Rp 4,9 jt",
        period: "/ tahun",
        alt: "+ biaya setup",
        features: ["Semua fitur Pro", "Fitur & integrasi sesuai kebutuhan", "Pendampingan khusus", "Keranjang belanja|segera", "Payment gateway (bayar online)|segera"],
        cta: "Hubungi Sales",
        highlight: false,
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    heading: "Pertanyaan yang sering muncul.",
    items: [
      { q: "Perlu bisa coding?", a: "Tidak. Produk, banner, dan harga diatur dari CMS yang sederhana." },
      { q: "Bisa pakai domain sendiri?", a: "Bisa. Atau pakai alamat namatoko.rigspace.id tanpa biaya tambahan." },
      { q: "Produk di marketplace bisa dipindah?", a: "Bisa. Kami bantu impor dari Excel, marketplace, atau website lama." },
      { q: "Data toko milik siapa?", a: "Milik Anda. Katalog bisa diekspor kapan saja." },
      { q: "Pembeli bayar lewat mana?", a: "Lewat WhatsApp & transfer seperti biasa — langsung ke rekening toko Anda. Keranjang belanja & payment gateway untuk paket Enterprise segera hadir." },
      { q: "Kalau berhenti langganan?", a: "Website dinonaktifkan di akhir masa langganan, data katalog tetap bisa Anda ekspor." },
    ],
  },
  final: {
    eyebrow: "Mulai sekarang",
    heading: "Website toko Anda bisa jadi minggu ini.",
    lead: "Kirim nama toko Anda. Tim kami siapkan demonya dengan produk Anda sendiri, gratis dan tanpa komitmen.",
    waCta: "Chat Tim Sales di WhatsApp",
  },
  form: {
    title: "Minta Demo Gratis",
    storeLabel: "Nama toko *",
    storePlaceholder: "Mis. Rig Computer",
    cityLabel: "Kota *",
    cityPlaceholder: "Mis. Jember",
    whatsappLabel: "Nomor WhatsApp *",
    whatsappPlaceholder: "08xxxxxxxxxx",
    linkLabel: "Link toko / marketplace (opsional)",
    linkPlaceholder: "tokopedia.com/namatoko",
    submit: "Kirim Permintaan Demo",
    sending: "Mengirim...",
    genericError: "Gagal mengirim permintaan.",
    helperText: "Tim kami menghubungi Anda lewat WhatsApp.",
    orDirectPrefix: "Atau",
    directChatLink: "chat langsung",
    doneTitle: "Permintaan demo terkirim",
    doneThankYou: "Terima kasih",
    doneBody: "Tim kami akan menghubungi Anda lewat WhatsApp untuk menyiapkan demonya.",
  },
  footer: {
    features: "Fitur",
    pricing: "Harga",
    loginCms: "Masuk CMS",
    contact: "Kontak",
  },
};

const LANDING_EN: LandingCopy = {
  locale: "en",
  soonLabel: "SOON",
  meta: {
    title: "Rigspace.id — Website Platform Built for Computer Stores",
    description:
      "Website platform built specifically for computer & PC retailers: spec-rich catalog, direct WhatsApp inquiries, zero marketplace fees. Request a free demo with your own products.",
    ogLocale: "en_US",
    ogAlt: "Computer store storefront preview on Rigspace.id",
  },
  nav: {
    ariaLabel: "Navigation",
    items: [
      { href: "#fitur", label: "Features" },
      { href: "#cara-kerja", label: "How It Works" },
      { href: "#contoh", label: "Examples" },
      { href: "#harga", label: "Pricing" },
      { href: "#faq", label: "FAQ" },
    ],
    login: "Log In",
    cta: "Request Demo",
    langAriaLabel: "Select language",
  },
  hero: {
    ariaLabel: "Introduction",
    eyebrow: "Website platform built for computer stores",
    lines: ["Buyers arrive.", "Chats flow in.", "Keep your margin."],
    lead: "A storefront built for PC & laptop retailers — detailed hardware specs, direct WhatsApp inquiries, zero marketplace commission.",
    tryLabel: "Try it now — type your store name",
    storePlaceholder: "Your store name",
    fallbackStoreWord: "Store",
    brandColorLabel: "Brand color:",
    colorAriaPrefix: "Color",
    cta: "Turn into a live store — Free Demo",
    freeLabel: "Free",
    hint: "prepared with your own store products",
    liveBadge: "Live preview, no sign-up required",
    desktopAltPrefix: "Desktop storefront preview for",
    mobileAltPrefix: "Mobile storefront preview for",
    desktopAltFallback: "your store",
    toastTitle: "New WhatsApp inquiry",
    toastMessage: "Hi, is this week's laptop bundle promo still available?",
    toastMetaPrefix: "Just now · from",
  },
  marquee: {
    ariaLabel: "Built for",
    items: ["Laptop stores", "Custom PC builders", "Computer repair", "Printers & accessories", "Gaming gear", "Refurbished laptops"],
  },
  problems: {
    eyebrow: "The problem",
    heading: "Selling online shouldn't cost this much.",
    items: [
      {
        title: "Marketplace fees eat your margin.",
        body: "Marketplace commissions can take 4–8.5% per order, while hardware and laptop margins are often just a few percent.",
      },
      {
        title: "Buyers easily jump to competitors.",
        body: "On marketplaces, your store sits right next to a competitor selling the same unit for a few dollars less.",
      },
      {
        title: "Legacy websites are fragile and tedious.",
        body: "Dozens of plugins, nobody maintaining them, and hidden spam links creeping in without you ever noticing.",
      },
    ],
  },
  features: {
    eyebrow: "Features",
    heading: "Everything a computer store needs. Nothing it doesn't.",
    coreTag: "CORE",
    proTag: "PRO",
    catalogTitle: "Spec-driven hardware catalog",
    catalogBody: "Filter by CPU, RAM, GPU, new or refurbished. Buyers understand the specs immediately without asking one by one.",
    specs: [
      { label: "Processor", value: "Intel Core i7 · Ryzen 7" },
      { label: "RAM", value: "16 GB" },
      { label: "GPU", value: "RTX 4060" },
      { label: "Condition", value: "New · Used" },
    ],
    waTitle: "WhatsApp button on every product",
    waBody: "Inquiries arrive complete with product name and price — automatically logged in your store analytics.",
    waTimestamp: "WhatsApp · just now",
    waPrefix: "Hi, is the ",
    waProduct: "Asus Zenbook Pro Dual Screen",
    waSuffix: " currently in stock?",
    studioTitle: "Studio Banner",
    studioBody: "Turn plain product photos into clean promotional banners, no designer needed.",
    migrateTitle: "Migrate without retyping",
    migrateBody: "Import your catalog directly from spreadsheets or your existing website.",
    pcBuilderTitle: "PC Builder & Trade-In",
    pcBuilderBody: "Let buyers configure custom PCs or estimate laptop trade-in values — built for hardware retail.",
    domainTitle: "Custom domain & Google SEO",
    domainBody: "Local SEO per store so customers find your computer shop when searching in their city.",
  },
  steps: {
    eyebrow: "How it works",
    heading: "See it first, decide later.",
    items: [
      { title: "Share your store link", body: "From your marketplace page, current website, or product spreadsheet." },
      { title: "We prepare your demo", body: "A working website with your own name, logo, and products — free." },
      { title: "Love it? Go live", body: "Launch on yourstore.rigspace.id or connect your own custom domain." },
    ],
  },
  templates: {
    eyebrow: "Storefront examples",
    heading: "One store, multiple styles.",
    lead: 'Sample layouts for the fictional "Rig Computer" store. Colors, logo, and typography adapt to your brand.',
    more: "More templates & fonts added regularly.",
    items: [
      { id: "precision", name: "Precision", note: "Clean & technical", image: "/platform/landing/tpl-precision.webp" },
      { id: "classic-retail", name: "Classic", note: "All-in-one retail", image: "/platform/landing/tpl-classic-retail.webp" },
      { id: "minimalist-boutique", name: "Boutique", note: "Minimalist", image: "/platform/landing/tpl-minimalist-boutique.webp" },
      { id: "gaming-arena", name: "Gaming Arena", note: "For custom PCs", image: "/platform/landing/tpl-gaming-arena.webp" },
    ],
  },
  report: {
    eyebrow: "Analytics",
    heading: "Know which products buyers ask about most.",
    lead: "More than just page views — see the real inquiries coming in, which products drive interest, and which page they came from.",
    checks: [
      { label: "WhatsApp clicks per product" },
      { label: "Most inquired products" },
      { label: "Out-of-stock items still getting inquiries", soon: true },
    ],
    dashTitle: "WhatsApp Inquiries",
    dashPeriod: "Last 30 days",
    kpis: [
      { label: "Chats received", value: "128" },
      { label: "Products asked", value: "46" },
      { label: "From Google", value: "38%" },
    ],
    bars: [
      ["Asus Zenbook Pro Dual", 92, 24],
      ["MSI Pro DP21 14M", 70, 18],
      ["Custom Gaming PC $800", 55, 14],
      ["Epson L3250 Printer", 38, 10],
    ],
    note: "Illustrative analytics mockup, not live store data.",
  },
  pricing: {
    eyebrow: "Pricing",
    heading: "Transparent pricing, zero per-transaction fees.",
    popularBadge: "Most popular",
    footNote: "Every plan starts with a free demo populated with your own store products.",
    plans: [
      {
        id: "starter",
        name: "Starter",
        for: "Repair shops & accessories",
        price: "$99",
        period: "/ year",
        alt: "or $10 / month",
        features: ["New & used product catalog", "WhatsApp button on every product", "Simple CMS", "Custom domain"],
        cta: "Request Demo",
        highlight: false,
      },
      {
        id: "pro",
        name: "Pro",
        for: "Computer retail & custom PC shops",
        price: "$189",
        period: "/ year",
        alt: "or $19 / month",
        features: ["Everything in Starter", "Local SEO", "PC Builder Simulator|segera", "Trade-In Calculator|segera", "WhatsApp promo broadcast|segera"],
        cta: "Request Free Demo",
        highlight: true,
      },
      {
        id: "enterprise",
        name: "Enterprise",
        for: "Distributors & wholesalers",
        price: "$349",
        period: "/ year",
        alt: "+ setup fee",
        features: ["Everything in Pro", "Custom features & integrations", "Dedicated onboarding", "Shopping cart|segera", "Online payment gateway|segera"],
        cta: "Contact Sales",
        highlight: false,
      },
    ],
  },
  faq: {
    eyebrow: "FAQ",
    heading: "Frequently asked questions.",
    items: [
      { q: "Do I need to know how to code?", a: "No. Products, banners, and pricing are managed from a clean, simple CMS." },
      { q: "Can I use my own domain?", a: "Yes. Or launch on yourstore.rigspace.id at no extra cost." },
      { q: "Can we migrate products from our marketplace?", a: "Yes. We help import your catalog from Excel, marketplaces, or your existing website." },
      { q: "Who owns the store data?", a: "You do. Your product catalog can be exported at any time." },
      { q: "How do customers pay?", a: "Direct via WhatsApp and bank transfer to your own account. Shopping cart & online payment gateway for Enterprise are coming soon." },
      { q: "What happens if I cancel?", a: "Your storefront is deactivated at the end of the billing period, and you can still export your catalog data." },
    ],
  },
  final: {
    eyebrow: "Get started",
    heading: "Your store website can go live this week.",
    lead: "Send us your store name. Our team will prepare a working demo with your own products, free and with no commitment.",
    waCta: "Chat with Sales on WhatsApp",
  },
  form: {
    title: "Request Free Demo",
    storeLabel: "Store name *",
    storePlaceholder: "e.g. Rig Computer",
    cityLabel: "City & Country *",
    cityPlaceholder: "e.g. Singapore",
    whatsappLabel: "WhatsApp number *",
    whatsappPlaceholder: "+65 xxxx xxxx",
    linkLabel: "Store / marketplace link (optional)",
    linkPlaceholder: "yourstore.com",
    submit: "Send Demo Request",
    sending: "Sending...",
    genericError: "Failed to send request.",
    helperText: "Our team will reach out to you via WhatsApp.",
    orDirectPrefix: "Or",
    directChatLink: "chat directly",
    doneTitle: "Demo request sent",
    doneThankYou: "Thank you",
    doneBody: "Our team will contact you via WhatsApp to prepare your personalized demo.",
  },
  footer: {
    features: "Features",
    pricing: "Pricing",
    loginCms: "CMS Login",
    contact: "Contact",
  },
};

export function getLandingContent(locale: Locale = "id"): LandingCopy {
  return locale === "en" ? LANDING_EN : LANDING_ID;
}

// Backward-compatible named exports (bahasa Indonesia bawaan)
export const HERO = LANDING_ID.hero;
export const AUDIENCE = LANDING_ID.marquee.items;
export const PROBLEMS = LANDING_ID.problems.items;
export const STEPS = LANDING_ID.steps.items;
export const TEMPLATES = LANDING_ID.templates.items;
export const PLANS = LANDING_ID.pricing.plans;
export const FAQS = LANDING_ID.faq.items;

/** Slug pratinjau dari nama toko yang diketik pengunjung (hanya tampilan). */
export function previewSlug(name: string, fallback = "namatoko"): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
  return slug || fallback;
}
