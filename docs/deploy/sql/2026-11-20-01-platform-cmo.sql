-- AlterTable
ALTER TABLE `platform_users` ADD COLUMN `managerId` VARCHAR(191) NULL,
    MODIFY `role` ENUM('SUPERADMIN', 'CMO', 'MARKETING') NOT NULL DEFAULT 'MARKETING';

-- CreateIndex
CREATE INDEX `platform_users_managerId_idx` ON `platform_users`(`managerId`);

-- AddForeignKey
ALTER TABLE `platform_users` ADD CONSTRAINT `platform_users_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `platform_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

