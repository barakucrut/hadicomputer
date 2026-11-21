import { getLiveStoreSettings } from "./live-repository";

/** Nama & data dasar toko aktif untuk metadata halaman (judul, OG, deskripsi). */
export async function getStoreBrand() {
  const store = await getLiveStoreSettings();
  return {
    brand: store.name || "Toko",
    store,
  };
}
