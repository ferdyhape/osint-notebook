-- AlterTable
ALTER TABLE `relationship`
    DROP COLUMN `bendOffset`,
    ADD COLUMN `vertices` JSON NULL,
    ADD COLUMN `sourceAnchor` JSON NULL,
    ADD COLUMN `targetAnchor` JSON NULL;
