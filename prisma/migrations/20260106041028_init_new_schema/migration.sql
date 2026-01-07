/*
  Warnings:

  - You are about to drop the column `userId` on the `reports` table. All the data in the column will be lost.
  - Added the required column `reporterId` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetId` to the `reports` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_postId_fkey`;

-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_userId_fkey`;

-- DropIndex
DROP INDEX `reports_postId_userId_key` ON `reports`;

-- DropIndex
DROP INDEX `reports_userId_fkey` ON `reports`;

-- AlterTable
ALTER TABLE `reports` DROP COLUMN `userId`,
    ADD COLUMN `reporterId` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `targetId` VARCHAR(191) NOT NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'POST',
    MODIFY `postId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `reports_reporterId_idx` ON `reports`(`reporterId`);

-- CreateIndex
CREATE INDEX `reports_targetId_idx` ON `reports`(`targetId`);

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_targetId_fkey` FOREIGN KEY (`targetId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
