-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` MODIFY `refresh_token` VARCHAR(191) NULL,
    MODIFY `refresh_token_expires_at` DATETIME(3) NULL;
