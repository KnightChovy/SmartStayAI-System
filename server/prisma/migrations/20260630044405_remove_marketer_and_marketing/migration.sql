/*
  Warnings:

  - The values [marketer] on the enum `StaffRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [marketing_content] on the enum `TemplateType` will be removed. If these variants are still used in the database, this will fail.
  - The values [marketer] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `content_drafts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `content_metrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scheduled_posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_accounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StaffRole_new" AS ENUM ('staff');
ALTER TABLE "hotel_staff_assignments" ALTER COLUMN "assigned_role" TYPE "StaffRole_new" USING ("assigned_role"::text::"StaffRole_new");
ALTER TYPE "StaffRole" RENAME TO "StaffRole_old";
ALTER TYPE "StaffRole_new" RENAME TO "StaffRole";
DROP TYPE "public"."StaffRole_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TemplateType_new" AS ENUM ('chatbot_system', 'review_response');
ALTER TABLE "ai_prompt_templates" ALTER COLUMN "template_type" TYPE "TemplateType_new" USING ("template_type"::text::"TemplateType_new");
ALTER TYPE "TemplateType" RENAME TO "TemplateType_old";
ALTER TYPE "TemplateType_new" RENAME TO "TemplateType";
DROP TYPE "public"."TemplateType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('guest', 'customer', 'staff', 'hotel_partner', 'platform_manager', 'admin');
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "smart_alerts" ALTER COLUMN "target_role" TYPE "UserRole_new" USING ("target_role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "content_drafts" DROP CONSTRAINT "content_drafts_approved_by_fkey";

-- DropForeignKey
ALTER TABLE "content_drafts" DROP CONSTRAINT "content_drafts_created_by_fkey";

-- DropForeignKey
ALTER TABLE "content_drafts" DROP CONSTRAINT "content_drafts_hotel_id_fkey";

-- DropForeignKey
ALTER TABLE "content_metrics" DROP CONSTRAINT "content_metrics_hotel_id_fkey";

-- DropForeignKey
ALTER TABLE "content_metrics" DROP CONSTRAINT "content_metrics_scheduled_post_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_posts" DROP CONSTRAINT "scheduled_posts_content_draft_id_fkey";

-- DropForeignKey
ALTER TABLE "scheduled_posts" DROP CONSTRAINT "scheduled_posts_social_account_id_fkey";

-- DropForeignKey
ALTER TABLE "social_accounts" DROP CONSTRAINT "social_accounts_hotel_id_fkey";

-- DropTable
DROP TABLE "content_drafts";

-- DropTable
DROP TABLE "content_metrics";

-- DropTable
DROP TABLE "scheduled_posts";

-- DropTable
DROP TABLE "social_accounts";

-- DropEnum
DROP TYPE "ContentType";

-- DropEnum
DROP TYPE "DraftStatus";

-- DropEnum
DROP TYPE "PostStatus";

-- DropEnum
DROP TYPE "SocialPlatform";
