/*
  Warnings:

  - Made the column `wallet_id` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `netAmount` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_wallet_id_fkey`;

-- DropIndex
DROP INDEX `transactions_wallet_id_fkey` ON `transactions`;

-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `transactions` MODIFY `wallet_id` VARCHAR(191) NOT NULL,
    MODIFY `netAmount` BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_wallet_id_fkey` FOREIGN KEY (`wallet_id`) REFERENCES `wallets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
