/*
  Warnings:

  - You are about to drop the column `refresh_token_expires_at` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `settings` ALTER COLUMN `created_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `refresh_token_expires_at`;
