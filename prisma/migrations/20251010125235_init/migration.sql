/*
  Warnings:

  - You are about to drop the column `gst_number` on the `business_kycs` table. All the data in the column will be lost.
  - You are about to drop the column `pan_number` on the `business_kycs` table. All the data in the column will be lost.
  - You are about to drop the column `udhyam_aadhar` on the `business_kycs` table. All the data in the column will be lost.
  - You are about to drop the `user_kycs` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `business_kyc_id` to the `pii_consents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kyc_id` to the `pii_consents` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `user_kycs` DROP FOREIGN KEY `user_kycs_address_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_kycs` DROP FOREIGN KEY `user_kycs_business_kyc_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_kycs` DROP FOREIGN KEY `user_kycs_user_id_fkey`;

-- DropIndex
DROP INDEX `business_kycs_gst_number_key` ON `business_kycs`;

-- DropIndex
DROP INDEX `business_kycs_pan_number_key` ON `business_kycs`;

-- AlterTable
ALTER TABLE `business_kycs` DROP COLUMN `gst_number`,
    DROP COLUMN `pan_number`,
    DROP COLUMN `udhyam_aadhar`;

-- AlterTable
ALTER TABLE `pii_consents` ADD COLUMN `business_kyc_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `kyc_id` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- DropTable
DROP TABLE `user_kycs`;

-- CreateTable
CREATE TABLE `UserKyc` (
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
ALTER TABLE `UserKyc` ADD CONSTRAINT `UserKyc_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserKyc` ADD CONSTRAINT `UserKyc_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserKyc` ADD CONSTRAINT `UserKyc_businessKycId_fkey` FOREIGN KEY (`businessKycId`) REFERENCES `business_kycs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pii_consents` ADD CONSTRAINT `pii_consents_kyc_id_fkey` FOREIGN KEY (`kyc_id`) REFERENCES `UserKyc`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pii_consents` ADD CONSTRAINT `pii_consents_business_kyc_id_fkey` FOREIGN KEY (`business_kyc_id`) REFERENCES `business_kycs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
