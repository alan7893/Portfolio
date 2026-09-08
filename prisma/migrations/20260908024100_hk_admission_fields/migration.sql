-- AlterTable
ALTER TABLE "events" ADD COLUMN "organiser" TEXT;
ALTER TABLE "events" ADD COLUMN "official_name" TEXT;
ALTER TABLE "events" ADD COLUMN "role" TEXT;
ALTER TABLE "events" ADD COLUMN "child_reflection" TEXT;
ALTER TABLE "events" ADD COLUMN "name_on_evidence" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN "photo_purpose" TEXT;
