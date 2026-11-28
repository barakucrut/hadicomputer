-- Tambah bahasa & mata uang etalase per tenant (Fase 2 bilingual)
ALTER TABLE `tenant_settings` ADD COLUMN `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR',
    ADD COLUMN `locale` VARCHAR(10) NOT NULL DEFAULT 'id';
