import type { Availability, Condition, HomepageConfig } from "@/lib/types";
import type { Locale } from "./index";

export interface StorefrontCopy {
  locale: Locale;
  availability: Record<Availability, string>;
  condition: Record<Condition, string>;
  contactForPrice: string;
  contactShort: string;
  savePrefix: string;
  youSavePrefix: string;
  normalPricePrefix: string;
  offSuffix: string;
  nav: {
    home: string;
    catalog: string;
    services: string;
    testimonials: string;
    deals: string;
    searchPlaceholder: string;
    viewAll: string;
    allProducts: string;
    allServices: string;
    featured: string;
    brands: string;
    categories: string;
    contactStore: string;
  };
  product: {
    chatWhatsApp: string;
    askAboutProduct: string;
    warranty: string;
    condition: string;
    code: string;
    specs: string;
    description: string;
    variants: string;
    bonus: string;
    share: string;
    copied: string;
    outOfStockNote: string;
    inStockNote: string;
    preorderNote: string;
  };
  catalog: {
    title: string;
    searchPlaceholder: string;
    allCategories: string;
    allBrands: string;
    allConditions: string;
    allStatuses: string;
    sortLabel: string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    priceRange: string;
    applyFilter: string;
    resetFilter: string;
    emptyTitle: string;
    emptyBody: string;
    showingPrefix: string;
    productsUnit: string;
  };
  hostPage: {
    demoEyebrow: string;
    demoTitle: string;
    demoBody: string;
    notFoundTitle: string;
    notFoundBody: string;
    backToRoot: string;
    demoMetaTitle: string;
    notFoundMetaTitle: string;
  };
  defaultHomepage: HomepageConfig;
  defaultOpenHours: string;
}

const STOREFRONT_ID: StorefrontCopy = {
  locale: "id",
  availability: {
    tersedia: "Tersedia",
    preorder: "Preorder",
    habis: "Stok habis",
  },
  condition: {
    baru: "Baru",
    bekas: "Bekas",
  },
  contactForPrice: "Hubungi untuk harga",
  contactShort: "Hubungi",
  savePrefix: "Hemat",
  youSavePrefix: "Kamu hemat",
  normalPricePrefix: "Normal",
  offSuffix: "lebih hemat",
  nav: {
    home: "Beranda",
    catalog: "Katalog",
    services: "Layanan",
    testimonials: "Testimoni",
    deals: "Promo",
    searchPlaceholder: "Cari laptop, PC, atau merek...",
    viewAll: "Lihat semua",
    allProducts: "Semua Produk",
    allServices: "Semua Layanan",
    featured: "Unggulan",
    brands: "Merek",
    categories: "Kategori",
    contactStore: "Hubungi Toko",
  },
  product: {
    chatWhatsApp: "Tanya via WhatsApp",
    askAboutProduct: "Tanya Produk Ini",
    warranty: "Garansi",
    condition: "Kondisi",
    code: "Kode",
    specs: "Spesifikasi",
    description: "Deskripsi",
    variants: "Pilih Varian",
    bonus: "Bonus",
    share: "Bagikan",
    copied: "Tautan disalin",
    outOfStockNote: "Stok sedang habis — hubungi kami untuk info restock.",
    inStockNote: "Siap kirim / ambil di toko.",
    preorderNote: "Tersedia untuk pemesanan preorder.",
  },
  catalog: {
    title: "Katalog Produk",
    searchPlaceholder: "Cari nama produk, merek, atau kode...",
    allCategories: "Semua Kategori",
    allBrands: "Semua Merek",
    allConditions: "Semua Kondisi",
    allStatuses: "Semua Status",
    sortLabel: "Urutkan",
    sortNewest: "Terbaru",
    sortPriceAsc: "Harga Terendah",
    sortPriceDesc: "Harga Tertinggi",
    priceRange: "Rentang Harga",
    applyFilter: "Terapkan",
    resetFilter: "Reset",
    emptyTitle: "Produk tidak ditemukan",
    emptyBody: "Coba ubah kata kunci atau filter pencarian Anda.",
    showingPrefix: "Menampilkan",
    productsUnit: "produk",
  },
  hostPage: {
    demoEyebrow: "SEGERA HADIR",
    demoTitle: "Website ini sedang disiapkan",
    demoBody:
      "Halaman ini belum dibuka untuk umum. Jika Anda menerima link demo, link tersebut mungkin sudah kedaluwarsa — minta link baru ke tim yang mengirimkannya.",
    notFoundTitle: "Toko tidak ditemukan",
    notFoundBody: "Alamat ini belum terdaftar sebagai toko di Rigspace.id. Periksa kembali ejaan alamatnya.",
    backToRoot: "Ke",
    demoMetaTitle: "Segera hadir",
    notFoundMetaTitle: "Toko tidak ditemukan — Rigspace.id",
  },
  defaultHomepage: {
    featuredTitle: "Pilihan Toko, untuk harimu.",
    featuredEyebrow: "DIPILIH UNTUKMU",
    featuredDescription: "Kenali perangkat yang bisa jadi teman aktivitasmu berikutnya.",
    bestSellerTitle: "Favorit di Toko Ini",
    bestSellerEyebrow: "KURASI OWNER",
    bestSellerDescription: "Koleksi produk paling diminati yang siap menemani produktivitas harianmu.",
    waConsultLabel: "Tanya Toko",
    waFloatingLabel: "Tanya via WhatsApp",
    storeSectionTitle: "Lihat langsung. Ngobrol lebih nyaman.",
    storeSectionEyebrow: "SAMPAI KETEMU DI TOKO",
    storeSectionDescription: "Kenali pilihan perangkatmu dan diskusikan kebutuhan langsung.",
    sections: {
      heroSlider: true,
      valueStrip: true,
      categories: true,
      promoWeek: true,
      featured: true,
      needs: true,
      latest: true,
      pcGaming: true,
      services: true,
      testimonials: true,
      storeLocation: true,
    },
  },
  defaultOpenHours: "Buka setiap hari: 08.00 – 22.00 WIB",
};

const STOREFRONT_EN: StorefrontCopy = {
  locale: "en",
  availability: {
    tersedia: "In Stock",
    preorder: "Pre-order",
    habis: "Out of Stock",
  },
  condition: {
    baru: "New",
    bekas: "Used",
  },
  contactForPrice: "Contact for price",
  contactShort: "Inquire",
  savePrefix: "Save",
  youSavePrefix: "You save",
  normalPricePrefix: "Was",
  offSuffix: "off",
  nav: {
    home: "Home",
    catalog: "Catalog",
    services: "Services",
    testimonials: "Reviews",
    deals: "Deals",
    searchPlaceholder: "Search laptops, PCs, or brands...",
    viewAll: "View all",
    allProducts: "All Products",
    allServices: "All Services",
    featured: "Featured",
    brands: "Brands",
    categories: "Categories",
    contactStore: "Contact Store",
  },
  product: {
    chatWhatsApp: "Chat on WhatsApp",
    askAboutProduct: "Inquire About This Product",
    warranty: "Warranty",
    condition: "Condition",
    code: "SKU",
    specs: "Specifications",
    description: "Description",
    variants: "Select Variant",
    bonus: "Bonus",
    share: "Share",
    copied: "Link copied",
    outOfStockNote: "Currently out of stock — message us for restock updates.",
    inStockNote: "Ready for delivery or in-store pickup.",
    preorderNote: "Available for pre-order.",
  },
  catalog: {
    title: "Product Catalog",
    searchPlaceholder: "Search product name, brand, or SKU...",
    allCategories: "All Categories",
    allBrands: "All Brands",
    allConditions: "All Conditions",
    allStatuses: "All Statuses",
    sortLabel: "Sort by",
    sortNewest: "Newest",
    sortPriceAsc: "Price: Low to High",
    sortPriceDesc: "Price: High to Low",
    priceRange: "Price Range",
    applyFilter: "Apply",
    resetFilter: "Reset",
    emptyTitle: "No products found",
    emptyBody: "Try adjusting your search keywords or filters.",
    showingPrefix: "Showing",
    productsUnit: "products",
  },
  hostPage: {
    demoEyebrow: "COMING SOON",
    demoTitle: "This storefront is being prepared",
    demoBody:
      "This page is not yet open to the public. If you received a demo link, it may have expired — please request a fresh link from the team.",
    notFoundTitle: "Store not found",
    notFoundBody: "This address is not registered as a store on Rigspace.id. Please double-check the URL spelling.",
    backToRoot: "Go to",
    demoMetaTitle: "Coming soon",
    notFoundMetaTitle: "Store not found — Rigspace.id",
  },
  defaultHomepage: {
    featuredTitle: "Curated picks for your setup.",
    featuredEyebrow: "FEATURED PICKS",
    featuredDescription: "Discover reliable hardware tailored for your daily workflow and gaming.",
    bestSellerTitle: "Store Favorites",
    bestSellerEyebrow: "BEST SELLERS",
    bestSellerDescription: "Our most popular machines trusted by customers every day.",
    waConsultLabel: "Chat Store",
    waFloatingLabel: "Chat on WhatsApp",
    storeSectionTitle: "See it in person. Talk to our specialists.",
    storeSectionEyebrow: "VISIT OUR STORE",
    storeSectionDescription: "Explore our devices firsthand and discuss your exact requirements.",
    sections: {
      heroSlider: true,
      valueStrip: true,
      categories: true,
      promoWeek: true,
      featured: true,
      needs: true,
      latest: true,
      pcGaming: true,
      services: true,
      testimonials: true,
      storeLocation: true,
    },
  },
  defaultOpenHours: "Open daily: 09:00 – 21:00",
};

export function getStorefrontCopy(locale?: Locale | null): StorefrontCopy {
  return locale === "en" ? STOREFRONT_EN : STOREFRONT_ID;
}
