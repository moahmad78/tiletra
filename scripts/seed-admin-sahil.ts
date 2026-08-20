import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const email = "sahil@intrihub.com";
  const password = "sahil@7814";
  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
  const phone = "+919264920211";

  console.log("Upserting Super Admin User: Sahil Sheikh...");

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Sahil Sheikh",
      role: "admin",
      authProvider: "credentials",
      passwordHash,
      phoneVerified: true,
      emailVerified: true,
    },
    create: {
      name: "Sahil Sheikh",
      email,
      phone,
      role: "admin",
      authProvider: "credentials",
      passwordHash,
      phoneVerified: true,
      emailVerified: true,
    },
  });

  console.log("✅ Admin user upserted successfully:", {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
}

main()
  .catch((e) => {
    console.error("Error creating admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
