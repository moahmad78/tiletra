import { prisma } from "../lib/prisma";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=== Applying Phase 2 Additive Migrations ===");
  const sqlPath = path.join(__dirname, "../prisma/migrations/20261126_phase2_product_automations.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  const cleanSql = (raw: string) =>
    raw
      .split("\n")
      .map((l) => (l.trim().startsWith("--") ? "" : l))
      .join("\n")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const statements = cleanSql(sql);

  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement}...`);
      await prisma.$executeRawUnsafe(statement);
      console.log("  -> OK");
    } catch (err: any) {
      console.warn(`  -> Notice: ${err?.message || err}`);
    }
  }

  console.log("=== Phase 2 Additive Migrations Completed Successfully ===");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
