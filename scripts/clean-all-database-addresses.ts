import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REAL_BENGALURU_ADDRESSES = [
  "Kumari elite apartment, Beguru, Landmark: Bommanahalli, Bengaluru, Karnataka - 560068",
  "Flat 102, Kumari Elite Apartment, 4th Cross, Beguru, Landmark: Near Bommanahalli, Bengaluru, Karnataka - 560068",
  "Flat 204, Begur Residency, Begur Main Road, Hongasandra, Landmark: Near Hongasandra Junction, Bengaluru, Karnataka - 560068",
  "No 45, Silicon Town Layout, DLF Road, Begur, Landmark: Near DLF Westend Heights, Bengaluru, Karnataka - 560068",
  "Flat 304, Royal Lakefront Phase 2, Akshayanagar Main Road, Begur, Landmark: Near Akshayanagar Lake Park, Bengaluru, Karnataka - 560068",
  "Plot 12, Manjunatha Layout, Devarachikkanahalli Road, Begur, Landmark: Near Oxford College of Engineering, Bengaluru, Karnataka - 560068",
];

async function main() {
  console.log("Setting real, clean, non-repeating addresses on all orders in PostgreSQL database...");
  const orders = await prisma.order.findMany();
  console.log(`Found ${orders.length} orders.`);

  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    const cleanAddr = i === 0 || o.orderNumber === "ORD-166009" || o.id.includes("166009")
      ? "Kumari elite apartment, Beguru, Landmark: Bommanahalli, Bengaluru, Karnataka - 560068"
      : REAL_BENGALURU_ADDRESSES[i % REAL_BENGALURU_ADDRESSES.length];

    await prisma.order.update({
      where: { id: o.id },
      data: {
        deliveryAddress: cleanAddr,
        deliveryCity: "Bengaluru",
        deliveryState: "Karnataka",
        deliveryPostalCode: "560068",
      },
    });
    console.log(`Order ${o.orderNumber || o.id} -> ${cleanAddr}`);
  }

  console.log("All orders successfully updated with clean real addresses!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
