-- Pending schema migration — apply via Supabase SQL editor
-- Generated: 2026-04-18
-- Apply this, then re-run: pnpm --filter @veritek/api db:seed

-- CreateEnum
CREATE TYPE "service_order_priority" AS ENUM ('low', 'medium', 'high', 'critical');

-- AlterTable: materials
ALTER TABLE "materials"
  ADD COLUMN "is_consigned" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "qty_fitted"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "serial_number" TEXT;

-- AlterTable: private_activities
ALTER TABLE "private_activities"
  ADD COLUMN "location" TEXT,
  ADD COLUMN "subject"  TEXT;

-- AlterTable: products
ALTER TABLE "products"
  ADD COLUMN "serialized" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: service_orders
ALTER TABLE "service_orders"
  ADD COLUMN "contact_name"        TEXT,
  ADD COLUMN "contact_phone"       TEXT,
  ADD COLUMN "customer_due_date"   TIMESTAMP(3),
  ADD COLUMN "problem_description" TEXT,
  ADD COLUMN "resolution"          JSONB,
  ADD COLUMN "short_description"   TEXT,
  ADD COLUMN "signed_by_name"      TEXT,
  ADD COLUMN "sv_number"           TEXT;

-- Replace the integer priority column with the enum
-- (preserves existing rows — existing NULL/0 values become the default 'medium')
ALTER TABLE "service_orders" DROP COLUMN "priority";
ALTER TABLE "service_orders" ADD COLUMN "priority" "service_order_priority" NOT NULL DEFAULT 'medium';

-- CreateTable: problem_codes
CREATE TABLE "problem_codes" (
    "code"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "problem_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable: cause_codes
CREATE TABLE "cause_codes" (
    "code"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "cause_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable: repair_codes
CREATE TABLE "repair_codes" (
    "code"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "repair_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable: resolve_codes
CREATE TABLE "resolve_codes" (
    "code"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "resolve_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable: rejection_codes
CREATE TABLE "rejection_codes" (
    "code"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "rejection_codes_pkey" PRIMARY KEY ("code")
);
