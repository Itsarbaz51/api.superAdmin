-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `completed_at` DATETIME(3) NULL;
