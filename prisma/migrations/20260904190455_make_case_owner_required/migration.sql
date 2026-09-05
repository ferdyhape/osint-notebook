/*
  Warnings:

  - Made the column `userId` on table `case` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Case` DROP FOREIGN KEY `Case_userId_fkey`;

-- AlterTable
ALTER TABLE `Case` MODIFY `userId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
