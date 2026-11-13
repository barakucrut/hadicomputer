"use client";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { ProductGrid } from "./product-card";
import { EmptyState } from "./ui";
import { categories } from "@/lib/repository";

export function FeaturedProducts({
  products,
  mobileProducts,
}: {
  products: Product[];
  mobileProducts?: Product[];
}) {
  const [tab, setTab] = useState("Semua");
  const tabs = [{ name: "Semua", value: "" }, ...categories];
  const filtered = products
    .filter(
      (p) =>
        tab === "Semua" ||
        p.category === tabs.find((t) => t.name === tab)?.value,
    )
    .slice(0, 4);
  return (
    <>
      <div
        className="filter-tabs"
        role="group"
        aria-label="Kategori produk pilihan"
      >
        {tabs.map((t) => (
          <button
            className={t.name === tab ? "active" : ""}
            key={t.name}
            aria-pressed={t.name === tab}
            onClick={() => setTab(t.name)}
          >
            {t.name}
          </button>
        ))}
      </div>
      {filtered.length ? (
        <ProductGrid
          products={filtered}
          mobileProducts={tab === "Semua" ? mobileProducts : undefined}
        />
      ) : (
        <EmptyState description="Pilihan kategori ini belum tersedia. Jelajahi produk lainnya di katalog." />
      )}
    </>
  );
}
