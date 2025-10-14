/*
  Warnings:

  - A unique constraint covering the columns `[user_id,piiType,scope]` on the table `pii_consents` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX `pii_consents_user_id_piiType_scope_key` ON `pii_consents`(`user_id`, `piiType`, `scope`);
