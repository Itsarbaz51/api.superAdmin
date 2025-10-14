-- DropForeignKey
ALTER TABLE `pii_consents` DROP FOREIGN KEY `pii_consents_business_kyc_id_fkey`;

-- DropForeignKey
ALTER TABLE `pii_consents` DROP FOREIGN KEY `pii_consents_user_kyc_id_fkey`;

-- DropIndex
DROP INDEX `pii_consents_business_kyc_id_fkey` ON `pii_consents`;

-- DropIndex
DROP INDEX `pii_consents_user_kyc_id_fkey` ON `pii_consents`;

-- AlterTable
ALTER TABLE `pii_consents` MODIFY `business_kyc_id` VARCHAR(191) NULL,
    MODIFY `user_kyc_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `pii_consents` ADD CONSTRAINT `pii_consents_user_kyc_id_fkey` FOREIGN KEY (`user_kyc_id`) REFERENCES `user_kyc`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pii_consents` ADD CONSTRAINT `pii_consents_business_kyc_id_fkey` FOREIGN KEY (`business_kyc_id`) REFERENCES `business_kycs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
