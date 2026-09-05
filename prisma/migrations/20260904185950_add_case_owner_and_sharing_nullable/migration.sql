-- AlterTable
ALTER TABLE `Case` ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Entity` ADD COLUMN `positionX` DOUBLE NULL,
    ADD COLUMN `positionY` DOUBLE NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `emailVerifiedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `CaseShare` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caseId` INTEGER NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'viewer',
    `invitedEmail` VARCHAR(191) NULL,
    `userId` INTEGER NULL,
    `linkToken` VARCHAR(191) NULL,
    `createdById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CaseShare_linkToken_key`(`linkToken`),
    INDEX `CaseShare_caseId_idx`(`caseId`),
    INDEX `CaseShare_userId_idx`(`userId`),
    UNIQUE INDEX `CaseShare_caseId_invitedEmail_key`(`caseId`, `invitedEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VerificationToken_token_key`(`token`),
    INDEX `VerificationToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Case_userId_idx` ON `Case`(`userId`);

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseShare` ADD CONSTRAINT `CaseShare_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseShare` ADD CONSTRAINT `CaseShare_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CaseShare` ADD CONSTRAINT `CaseShare_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationToken` ADD CONSTRAINT `VerificationToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
