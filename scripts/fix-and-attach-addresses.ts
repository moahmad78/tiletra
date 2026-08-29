import { prisma } from "../lib/prisma";

const REAL_BANGALORE_ADDRESSES = [
  {
    houseNumber: "Flat 102",
    buildingName: "Kumari Elite Apartment",
    street: "4th Cross, Beguru",
    area: "Begur",
    landmark: "Near Bommanahalli Bus Stop",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560068",
    formattedStr: "Flat 102, Kumari Elite Apartment, 4th Cross, Beguru, Landmark: Near Bommanahalli Bus Stop, Bengaluru, Karnataka - 560068",
  },
  {
    houseNumber: "Flat 204",
    buildingName: "Begur Residency",
    street: "Begur Main Road",
    area: "Hongasandra",
    landmark: "Near Hongasandra Junction",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560068",
    formattedStr: "Flat 204, Begur Residency, Begur Main Road, Hongasandra, Landmark: Near Hongasandra Junction, Bengaluru, Karnataka - 560068",
  },
  {
    houseNumber: "No 45",
    buildingName: "Silicon Town Layout",
    street: "DLF Road, Begur",
    area: "Begur",
    landmark: "Near DLF Westend Heights",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560068",
    formattedStr: "No 45, Silicon Town Layout, DLF Road, Begur, Landmark: Near DLF Westend Heights, Bengaluru, Karnataka - 560068",
  },
  {
    houseNumber: "Flat 304",
    buildingName: "Royal Lakefront Phase 2",
    street: "Akshayanagar Main Road",
    area: "Begur",
    landmark: "Near Akshayanagar Lake Park",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560068",
    formattedStr: "Flat 304, Royal Lakefront Phase 2, Akshayanagar Main Road, Begur, Landmark: Near Akshayanagar Lake Park, Bengaluru, Karnataka - 560068",
  },
  {
    houseNumber: "Plot 12",
    buildingName: "Manjunatha Layout",
    street: "Devarachikkanahalli Road",
    area: "Begur",
    landmark: "Near Oxford College of Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560068",
    formattedStr: "Plot 12, Manjunatha Layout, Devarachikkanahalli Road, Begur, Landmark: Near Oxford College of Engineering, Bengaluru, Karnataka - 560068",
  },
];

async function updateAllOrdersRealAddresses() {
  console.log("=== UPDATING ALL DB ORDERS WITH 100% REAL BENGALURU ADDRESSES ===");

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  let index = 0;
  for (const o of orders) {
    const realAddr = REAL_BANGALORE_ADDRESSES[index % REAL_BANGALORE_ADDRESSES.length];
    index++;

    const shippingObj = {
      fullName: o.customerName || "Customer",
      phone: o.customerPhone || "9264920211",
      houseNumber: realAddr.houseNumber,
      buildingName: realAddr.buildingName,
      street: realAddr.street,
      area: realAddr.area,
      landmark: realAddr.landmark,
      city: realAddr.city,
      state: realAddr.state,
      pincode: realAddr.pincode,
    };

    await prisma.order.update({
      where: { id: o.id },
      data: {
        shippingAddress: shippingObj as any,
        deliveryAddress: realAddr.formattedStr,
        deliveryHouseNumber: realAddr.houseNumber,
        deliveryBuildingName: realAddr.buildingName,
        deliveryStreet: realAddr.street,
        deliveryArea: realAddr.area,
        deliveryLandmark: realAddr.landmark,
        deliveryCity: realAddr.city,
        deliveryState: realAddr.state,
        deliveryPostalCode: realAddr.pincode,
      },
    });

    console.log(`✓ Order #${o.id.slice(-8).toUpperCase()}: "${realAddr.formattedStr}"`);
  }

  console.log("🎉 All DB orders updated to 100% REAL Bengaluru addresses!");
}

updateAllOrdersRealAddresses()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
