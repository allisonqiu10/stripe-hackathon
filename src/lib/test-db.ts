// OWNER: P1
// Test-only helper: temp SQLite DB per test file. Call setupTestDb() BEFORE importing src/lib/db.
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function setupTestDb() {
  const dir = mkdtempSync(join(tmpdir(), "giveback-test-"));
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
  execSync("npx prisma migrate deploy", { env: process.env, stdio: "pipe" });
  (globalThis as { db?: unknown }).db = undefined;
  const { db } = await import("./db");
  return db;
}

export async function clearTables(db: Awaited<ReturnType<typeof setupTestDb>>) {
  await db.donation.deleteMany();
  await db.order.deleteMany();
  await db.merchant.deleteMany();
  await db.cause.deleteMany();
}
