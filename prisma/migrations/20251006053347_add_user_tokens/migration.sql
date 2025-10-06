-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `email_verification_token` VARCHAR(191) NULL,
    ADD COLUMN `email_verified_at` DATETIME(3) NULL,
    ADD COLUMN `password_reset_expires` DATETIME(3) NULL,
    ADD COLUMN `password_reset_token` VARCHAR(191) NULL;
