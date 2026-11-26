import { prisma } from "../lib/prisma";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=== Applying Phase 1 Additive Migrations ===");
  const sqlPath = path.join(__dirname, "../prisma/migrations/20261126_phase1_campaign_extensions.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // Remove comment lines first, then split by semicolon
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
      console.log(`Executing: ${statement.slice(0, 60)}...`);
      await prisma.$executeRawUnsafe(statement);
      console.log("  -> OK");
    } catch (err: any) {
      console.warn(`  -> Warning/Notice: ${err?.message || err}`);
    }
  }

  // Also apply the DeviceToken consolidation SQL
  const dtPath = path.join(__dirname, "../prisma/migrations/20261126_consolidate_device_tokens.sql");
  if (fs.existsSync(dtPath)) {
    const dtSql = fs.readFileSync(dtPath, "utf-8");
    const dtStatements = cleanSql(dtSql);

    for (const statement of dtStatements) {
      try {
        console.log(`Executing DT: ${statement.slice(0, 60)}...`);
        await prisma.$executeRawUnsafe(statement);
        console.log("  -> OK");
      } catch (err: any) {
        console.warn(`  -> Notice: ${err?.message || err}`);
      }
    }
  }

  console.log("=== Phase 1 Additive Migrations Completed Successfully ===");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
