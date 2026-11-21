-- AlterTable
ALTER TABLE `tenant_settings` ADD COLUMN `googleReviewUrl` VARCHAR(500) NULL;

-- CreateTable
CREATE TABLE `testimonials` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(40) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `descriptor` VARCHAR(120) NULL,
    `quote` VARCHAR(300) NOT NULL,
    `rating` TINYINT NULL,
    `label` VARCHAR(80) NULL,
    `photoUrl` VARCHAR(255) NULL,
    `source` ENUM('GOOGLE', 'WHATSAPP', 'DIRECT') NOT NULL DEFAULT 'DIRECT',
    `sourceUrl` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `testimonials_tenantId_isActive_isFeatured_sortOrder_idx`(`tenantId`, `isActive`, `isFeatured`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `testimonials` ADD CONSTRAINT `testimonials_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

