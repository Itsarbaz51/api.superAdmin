/*
  Warnings:

  - You are about to drop the column `kyc_id` on the `pii_consents` table. All the data in the column will be lost.
  - You are about to drop the `userkyc` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user_kyc_id` to the `pii_consents` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `pii_consents` DROP FOREIGN KEY `pii_consents_kyc_id_fkey`;

-- DropForeignKey
ALTER TABLE `userkyc` DROP FOREIGN KEY `UserKyc_addressId_fkey`;

-- DropForeignKey
ALTER TABLE `userkyc` DROP FOREIGN KEY `UserKyc_businessKycId_fkey`;

-- DropForeignKey
ALTER TABLE `userkyc` DROP FOREIGN KEY `UserKyc_userId_fkey`;

-- DropIndex
DROP INDEX `pii_consents_kyc_id_fkey` ON `pii_consents`;

-- AlterTable
ALTER TABLE `pii_consents` DROP COLUMN `kyc_id`,
    ADD COLUMN `user_kyc_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- DropTable
DROP TABLE `userkyc`;

-- CreateTable
CREATE TABLE `user_kyc` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `fatherName` VARCHAR(191) NOT NULL,
    `dob` DATETIME(3) NOT NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECT') NOT NULL DEFAULT 'PENDING',
    `addressId` VARCHAR(191) NOT NULL,
    `panFile` VARCHAR(191) NOT NULL,
    `aadhaarFile` VARCHAR(191) NOT NULL,
    `addressProofFile` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NOT NULL,
    `businessKycId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_kyc` ADD CONSTRAINT `user_kyc_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_kyc` ADD CONSTRAINT `user_kyc_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_kyc` ADD CONSTRAINT `user_kyc_businessKycId_fkey` FOREIGN KEY (`businessKycId`) REFERENCES `business_kycs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pii_consents` ADD CONSTRAINT `pii_consents_user_kyc_id_fkey` FOREIGN KEY (`user_kyc_id`) REFERENCES `user_kyc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
