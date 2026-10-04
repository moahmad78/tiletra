import { prisma } from "../lib/prisma";

async function main() {
  const cpoEmail = "cpo@intrihub.com";
  const existing = await prisma.user.findFirst({
    where: { email: { equals: cpoEmail, mode: "insensitive" } },
  });

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        email: cpoEmail,
        phone: "+919999900001",
        name: "IntriHub CPO",
        role: "cpo",
        emailVerified: true,
        phoneVerified: true,
      },
    });
    console.log("Created initial CPO user in DB:", user);
  } else {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { role: "cpo" },
    });
    console.log("Updated existing user to CPO role in DB:", updated);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
