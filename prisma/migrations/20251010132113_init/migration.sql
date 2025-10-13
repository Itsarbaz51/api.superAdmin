/*
  Warnings:

  - You are about to drop the column `provider_id` on the `provider_credentials` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[providerId,env]` on the table `provider_credentials` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerId` to the `provider_credentials` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `provider_credentials` DROP FOREIGN KEY `provider_credentials_provider_id_fkey`;

-- DropIndex
DROP INDEX `provider_credentials_provider_id_fkey` ON `provider_credentials`;

-- AlterTable
ALTER TABLE `provider_credentials` DROP COLUMN `provider_id`,
    ADD COLUMN `providerId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX `provider_credentials_providerId_env_key` ON `provider_credentials`(`providerId`, `env`);

-- AddForeignKey
ALTER TABLE `provider_credentials` ADD CONSTRAINT `provider_credentials_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `service_providers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
