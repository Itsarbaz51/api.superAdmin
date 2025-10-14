/*
  Warnings:

  - The values [PERCENT] on the enum `commission_earnings_commission_type` will be removed. If these variants are still used in the database, this will fail.
  - The values [PERCENT] on the enum `commission_earnings_commission_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `currency` on the `wallets` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(6))`.
  - You are about to drop the `address` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auditlog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `address` DROP FOREIGN KEY `Address_city_id_fkey`;

-- DropForeignKey
ALTER TABLE `address` DROP FOREIGN KEY `Address_state_id_fkey`;

-- DropForeignKey
ALTER TABLE `auditlog` DROP FOREIGN KEY `AuditLog_userId_fkey`;

-- DropForeignKey
ALTER TABLE `business_kycs` DROP FOREIGN KEY `business_kycs_address_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_kycs` DROP FOREIGN KEY `user_kycs_address_id_fkey`;

-- DropIndex
DROP INDEX `business_kycs_address_id_fkey` ON `business_kycs`;

-- DropIndex
DROP INDEX `commission_settings_scope_role_id_target_user_id_service_id_idx` ON `commission_settings`;

-- DropIndex
DROP INDEX `user_kycs_address_id_fkey` ON `user_kycs`;

-- AlterTable
ALTER TABLE `commission_earnings` MODIFY `commission_type` ENUM('FLAT', 'PERCENTAGE') NOT NULL;

-- AlterTable
ALTER TABLE `commission_settings` ADD COLUMN `channel` VARCHAR(191) NULL,
    MODIFY `commission_type` ENUM('FLAT', 'PERCENTAGE') NOT NULL;

-- AlterTable
ALTER TABLE `ledger_entries` ADD COLUMN `reference_type` ENUM('TRANSACTION', 'COMMISSION', 'REFUND', 'ADJUSTMENT', 'BONUS', 'CHARGE') NULL;

-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `external_ref_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `wallets` MODIFY `currency` ENUM('INR', 'USD', 'EUR', 'GBP', 'AED') NOT NULL DEFAULT 'INR';

-- DropTable
DROP TABLE `address`;

-- DropTable
DROP TABLE `auditlog`;

-- CreateTable
CREATE TABLE `addresses` (
    `id` VARCHAR(191) NOT NULL,
    `address` LONGTEXT NOT NULL,
    `pin_code` VARCHAR(191) NOT NULL,
    `state_id` VARCHAR(191) NOT NULL,
    `city_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `commission_settings_scope_role_id_target_user_id_service_id__idx` ON `commission_settings`(`scope`, `role_id`, `target_user_id`, `service_id`, `channel`);

-- CreateIndex
CREATE INDEX `transactions_external_ref_id_idx` ON `transactions`(`external_ref_id`);

-- AddForeignKey
ALTER TABLE `user_kycs` ADD CONSTRAINT `user_kycs_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_kycs` ADD CONSTRAINT `business_kycs_address_id_fkey` FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_state_id_fkey` FOREIGN KEY (`state_id`) REFERENCES `states`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `addresses` ADD CONSTRAINT `addresses_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
