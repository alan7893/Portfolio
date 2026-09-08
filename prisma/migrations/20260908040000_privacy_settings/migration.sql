-- AlterTable
ALTER TABLE "User" ADD COLUMN "ai_caption_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "ai_generate_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "ai_share_child_name" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "ai_allow_deepseek" BOOLEAN NOT NULL DEFAULT false;
