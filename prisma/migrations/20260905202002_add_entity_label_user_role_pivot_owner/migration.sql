-- AlterTable
ALTER TABLE `entity` ADD COLUMN `label` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `pivotrule` ADD COLUMN `createdById` INTEGER NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'user';

-- CreateIndex
CREATE INDEX `PivotRule_createdById_idx` ON `PivotRule`(`createdById`);

-- AddForeignKey
ALTER TABLE `PivotRule` ADD CONSTRAINT `PivotRule_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
