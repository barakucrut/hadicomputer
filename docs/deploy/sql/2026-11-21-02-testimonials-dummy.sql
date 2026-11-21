-- ============================================================
-- 10 TESTIMONI CONTOH (DUMMY) — hanya untuk pratinjau tampilan.
-- Bukan ulasan pelanggan asli. Nama ditandai "Contoh Pelanggan"
-- dan keterangan "Data contoh". WAJIB dihapus setelah owner
-- melihat bentuknya: jalankan 2026-11-21-03-testimonials-dummy-delete.sql
-- atau hapus dari Admin → Testimoni.
--
-- Prasyarat: 2026-11-21-01-testimonials.sql sudah dijalankan.
-- Aman dijalankan ulang (id tetap; baris yang sudah ada diperbarui).
-- Foto: avatar ilustrasi DiceBear (bukan foto orang asli), dimuat dari api.dicebear.com.
-- ============================================================

INSERT INTO `testimonials`
  (`id`, `name`, `descriptor`, `quote`, `rating`, `label`, `photoUrl`, `source`, `sourceUrl`, `isActive`, `isFeatured`, `sortOrder`, `createdAt`, `updatedAt`)
VALUES
  ('dummy-testi-01', 'Contoh Pelanggan 1', 'Data contoh', 'Laptop kantor yang tadinya lemot sekarang lancar lagi. Penjelasannya jelas, dikasih tahu dulu apa yang perlu diganti sebelum dikerjakan.', 5, 'Servis laptop', 'https://api.dicebear.com/9.x/notionists/svg?seed=ContohPelanggan1&backgroundColor=e8f0e3', 'GOOGLE', NULL, 1, 1, 1, NOW(3), NOW(3)),
  ('dummy-testi-02', 'Contoh Pelanggan 2', 'Data contoh', 'Dibantu pilih laptop sesuai budget kuliah. Tidak dipaksa ambil yang mahal.', 5, 'Beli laptop', 'https://api.dicebear.com/9.x/notionists/svg?seed=ContohPelanggan2&backgroundColor=fdf0d9', 'GOOGLE', NULL, 1, 1, 2, NOW(3), NOW(3)),
  ('dummy-testi-03', 'Contoh Pelanggan 3', 'Data contoh', 'Rakit PC untuk editing video, komponennya disesuaikan sama kebutuhan dan dijelaskan satu per satu. Hasil rakitannya rapi.', 5, 'Rakit PC', 'https://api.dicebear.com/9.x/notionists/svg?seed=ContohPelanggan3&backgroundColor=e3ecf7', 'WHATSAPP', NULL, 1, 0, 3, NOW(3), NOW(3)),
  ('dummy-testi-04', 'Contoh Pelanggan 4', 'Data contoh', 'Respon WhatsApp cepat, tanya stok langsung dijawab.', NULL, 'Konsultasi', 'https://api.dicebear.com/9.x/notionists/svg?seed=ContohPelanggan4&backgroundColor=f1e8f7', 'WHATSAPP', NULL, 1, 0, 4, NOW(3), NOW(3)),
  ('dummy-testi-05', 'Contoh Pelanggan 5', 'Data contoh', 'Beli laptop bekas pilihan, kondisinya sesuai yang diinfokan. Ada catatan kondisi baterai dan garansi tokonya juga.', 4, 'Laptop bekas', 'https://api.dicebear.com/9.x/notionists/svg?seed=ContohPelanggan5&backgroundColor=fde8e8', 'GOOGLE', NULL, 1, 0, 5, NOW(3), NOW(3)),
  ('dummy-testi-06', 'Contoh Pelanggan 6', 'Data contoh', 'Ganti SSD dan upgrade RAM, ditunggu selesai hari itu juga.', NULL, 'Upgrade', 'https://api.dicebear.com/9.x/notionists/svg?seed=ContohPelanggan6&backgroundColor=e8f0e3', 'DIRECT', NULL, 1, 0, 6, NOW(3), NOW(3)),
  ('dummy-testi-07', 'Contoh Pelanggan 7', 'Data contoh', 'Pembersihan dan ganti thermal paste, suhu laptop gaming turun jauh. Tempatnya nyaman buat nunggu.', 5, 'Perawatan', 'https://api.dicebear.com/9.x/notionists/svg?seed=ContohPelanggan7&backgroundColor=fdf0d9', 'GOOGLE', NULL, 1, 0, 7, NOW(3), NOW(3)),
  ('dummy-testi-08', 'Contoh Pelanggan 8', 'Data contoh', 'Beli beberapa unit PC untuk kantor, dibantu sampai instalasi awal.', 4, 'PC kantor', 'https://api.dicebear.com/9.x/notionists/svg?seed=ContohPelanggan8&backgroundColor=e3ecf7', 'DIRECT', NULL, 1, 0, 8, NOW(3), NOW(3)),
  ('dummy-testi-09', 'Contoh Pelanggan 9', 'Data contoh', 'Keyboard laptop rusak kena tumpahan, diganti dengan part yang pas.', NULL, 'Servis laptop', 'https://api.dicebear.com/9.x/notionists/svg?seed=ContohPelanggan9&backgroundColor=f1e8f7', 'WHATSAPP', NULL, 1, 0, 9, NOW(3), NOW(3)),
  ('dummy-testi-10', 'Contoh Pelanggan 10', 'Data contoh', 'Konsultasi spesifikasi untuk desain grafis, dikasih beberapa pilihan beserta kelebihan dan kekurangannya, jadi gampang memutuskan.', 5, 'Konsultasi', 'https://api.dicebear.com/9.x/notionists/svg?seed=ContohPelanggan10&backgroundColor=fde8e8', 'GOOGLE', NULL, 1, 0, 10, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `photoUrl` = VALUES(`photoUrl`),
  `updatedAt` = NOW(3);
