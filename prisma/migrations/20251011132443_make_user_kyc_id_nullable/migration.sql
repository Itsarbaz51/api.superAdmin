-- AlterTable
ALTER TABLE `business_kycs` ADD COLUMN `udhyam_aadhar` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;
