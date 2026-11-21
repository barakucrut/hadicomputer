-- CreateTable
CREATE TABLE `demo_requests` (
    `id` VARCHAR(191) NOT NULL,
    `storeName` VARCHAR(150) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `whatsapp` VARCHAR(20) NOT NULL,
    `storeLink` VARCHAR(300) NULL,
    `status` ENUM('NEW', 'CONTACTED', 'CONVERTED', 'REJECTED') NOT NULL DEFAULT 'NEW',
    `assignedToId` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `demo_requests_assignedToId_status_idx`(`assignedToId`, `status`),
    INDEX `demo_requests_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `demo_requests` ADD CONSTRAINT `demo_requests_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `platform_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

