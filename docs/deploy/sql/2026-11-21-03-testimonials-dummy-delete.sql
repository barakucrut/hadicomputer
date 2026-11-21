-- Hapus 10 testimoni contoh dari 2026-11-21-02-testimonials-dummy.sql.
-- Hanya menyentuh baris berid "dummy-testi-*"; testimoni asli tidak ikut terhapus.
DELETE FROM `testimonials` WHERE `id` LIKE 'dummy-testi-%';
