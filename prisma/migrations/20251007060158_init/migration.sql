-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `email_verification_token_expires` DATETIME(3) NULL;
