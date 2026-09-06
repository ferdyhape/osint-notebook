-- AlterTable
ALTER TABLE `Entity` ADD COLUMN `label` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `PivotRule` ADD COLUMN `createdById` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'user';

-- CreateIndex
CREATE INDEX `PivotRule_createdById_idx` ON `PivotRule`(`createdById`);

-- AddForeignKey
ALTER TABLE `PivotRule` ADD CONSTRAINT `PivotRule_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
