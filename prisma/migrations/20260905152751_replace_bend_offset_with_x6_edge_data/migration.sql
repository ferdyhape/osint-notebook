-- AlterTable
ALTER TABLE `Relationship`
    DROP COLUMN `bendOffset`,
    ADD COLUMN `vertices` JSON NULL,
    ADD COLUMN `sourceAnchor` JSON NULL,
    ADD COLUMN `targetAnchor` JSON NULL;
