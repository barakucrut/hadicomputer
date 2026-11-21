-- AlterTable
ALTER TABLE `tenants` ADD COLUMN `demoToken` VARCHAR(64) NULL,
    ADD COLUMN `demoTokenExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `liveAt` DATETIME(3) NULL,
    ADD COLUMN `siteStatus` ENUM('DEMO', 'LIVE') NOT NULL DEFAULT 'LIVE';

-- CreateTable
CREATE TABLE `demo_views` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(40) NOT NULL,
    `device` VARCHAR(20) NOT NULL DEFAULT 'desktop',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `demo_views_tenantId_createdAt_idx`(`tenantId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `tenants_demoToken_key` ON `tenants`(`demoToken`);

-- AddForeignKey
ALTER TABLE `demo_views` ADD CONSTRAINT `demo_views_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

