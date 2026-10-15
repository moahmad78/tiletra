import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function parseDates(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(parseDates);
  const res: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
      res[k] = new Date(v);
    } else if (v && typeof v === "object" && !(v instanceof Date)) {
      res[k] = parseDates(v);
    } else {
      res[k] = v;
    }
  }
  return res;
}

async function restoreSnapshot() {
  const snapshotDir = path.resolve(
    process.cwd(),
    "backups",
    "snapshot-pre-recovery-2026-10-07T05-59-48-181Z"
  );

  console.log("==================================================");
  console.log("📦 RESTORING NEON SNAPSHOT TO LOCAL VPS POSTGRESQL");
  console.log(`Directory: ${snapshotDir}`);
  console.log("==================================================\n");

  if (!fs.existsSync(snapshotDir)) {
    throw new Error(`Snapshot directory not found: ${snapshotDir}`);
  }

  // 1. Users
  const usersPath = path.join(snapshotDir, "users.json");
  if (fs.existsSync(usersPath)) {
    const users: any[] = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
    console.log(`👥 Restoring ${users.length} Users...`);
    let userCount = 0;
    for (const u of users) {
      const data = parseDates(u);
      try {
        await prisma.user.upsert({
          where: { id: data.id },
          update: data,
          create: data,
        });
        userCount++;
      } catch (err: any) {
        // Fallback matching by phone or email if id collides
        if (data.phone) {
          try {
            await prisma.user.upsert({
              where: { phone: data.phone },
              update: data,
              create: data,
            });
            userCount++;
          } catch (e) {}
        }
      }
    }
    console.log(`✅ Users restored/merged: ${userCount}/${users.length}`);
  }

  // 2. Categories
  const catPath = path.join(snapshotDir, "categories.json");
  if (fs.existsSync(catPath)) {
    const categories: any[] = JSON.parse(fs.readFileSync(catPath, "utf-8"));
    console.log(`\n📁 Restoring ${categories.length} Categories...`);
    let catCount = 0;
    // Parent categories first
    const parents = categories.filter((c) => !c.parentId);
    const children = categories.filter((c) => c.parentId);

    for (const c of [...parents, ...children]) {
      const data = parseDates(c);
      try {
        await prisma.category.upsert({
          where: { id: data.id },
          update: data,
          create: data,
        });
        catCount++;
      } catch (err: any) {
        try {
          await prisma.category.upsert({
            where: { slug: data.slug },
            update: data,
            create: data,
          });
          catCount++;
        } catch (e) {}
      }
    }
    console.log(`✅ Categories restored/merged: ${catCount}/${categories.length}`);
  }

  // 3. Vendors
  const vendorPath = path.join(snapshotDir, "vendors.json");
  if (fs.existsSync(vendorPath)) {
    const vendors: any[] = JSON.parse(fs.readFileSync(vendorPath, "utf-8"));
    console.log(`\n🏪 Restoring ${vendors.length} Vendors...`);
    let vendorCount = 0;
    for (const v of vendors) {
      const { owner, products, ...cleanVendor } = v;
      const data = parseDates(cleanVendor);
      try {
        await prisma.vendor.upsert({
          where: { id: data.id },
          update: data,
          create: data,
        });
        vendorCount++;
      } catch (err: any) {
        try {
          await prisma.vendor.upsert({
            where: { slug: data.slug },
            update: data,
            create: data,
          });
          vendorCount++;
        } catch (e) {
          console.warn(`Warning upserting vendor ${data.businessName}:`, (e as any)?.message);
        }
      }
    }
    console.log(`✅ Vendors restored/merged: ${vendorCount}/${vendors.length}`);
  }

  // 4. Products
  const prodPath = path.join(snapshotDir, "products.json");
  if (fs.existsSync(prodPath)) {
    const products: any[] = JSON.parse(fs.readFileSync(prodPath, "utf-8"));
    console.log(`\n🛍️ Restoring ${products.length} Products...`);
    let prodCount = 0;
    for (const p of products) {
      const { variants, attributes, priceTiers, category, vendor, ...cleanProduct } = p;
      const data = parseDates(cleanProduct);
      try {
        await prisma.product.upsert({
          where: { id: data.id },
          update: data,
          create: data,
        });
        prodCount++;
      } catch (err: any) {
        try {
          await prisma.product.upsert({
            where: { slug: data.slug },
            update: data,
            create: data,
          });
          prodCount++;
        } catch (e) {
          console.warn(`Warning upserting product ${data.name}:`, (e as any)?.message);
        }
      }
    }
    console.log(`✅ Products restored/merged: ${prodCount}/${products.length}`);
  }

  // 5. Product Variants
  const varPath = path.join(snapshotDir, "product_variants.json");
  if (fs.existsSync(varPath)) {
    const variants: any[] = JSON.parse(fs.readFileSync(varPath, "utf-8"));
    console.log(`\n🎨 Restoring ${variants.length} Product Variants...`);
    let varCount = 0;
    for (const v of variants) {
      const { product, ...cleanVariant } = v;
      const data = parseDates(cleanVariant);
      try {
        await prisma.productVariant.upsert({
          where: { id: data.id },
          update: data,
          create: data,
        });
        varCount++;
      } catch (err: any) {
        // Try fallback if product exists
        try {
          const productExists = await prisma.product.findUnique({ where: { id: data.productId } });
          if (productExists) {
            await prisma.productVariant.create({ data });
            varCount++;
          }
        } catch (e) {}
      }
    }
    console.log(`✅ Product Variants restored/merged: ${varCount}/${variants.length}`);
  }

  // 6. Product Attributes
  const attrPath = path.join(snapshotDir, "product_attributes.json");
  if (fs.existsSync(attrPath)) {
    const attributes: any[] = JSON.parse(fs.readFileSync(attrPath, "utf-8"));
    console.log(`\n🏷️ Restoring ${attributes.length} Product Attributes...`);
    let attrCount = 0;
    for (const a of attributes) {
      const { product, ...cleanAttr } = a;
      const data = parseDates(cleanAttr);
      try {
        await prisma.productAttribute.upsert({
          where: { id: data.id },
          update: data,
          create: data,
        });
        attrCount++;
      } catch (err: any) {}
    }
    console.log(`✅ Product Attributes restored/merged: ${attrCount}/${attributes.length}`);
  }

  // 7. Orders
  const orderPath = path.join(snapshotDir, "orders.json");
  if (fs.existsSync(orderPath)) {
    const orders: any[] = JSON.parse(fs.readFileSync(orderPath, "utf-8"));
    console.log(`\n📦 Restoring ${orders.length} Orders...`);
    let orderCount = 0;
    for (const o of orders) {
      const { items, user, deliveryPartner, returnRequests, complaints, reviews, locationLogs, ...cleanOrder } = o;
      const data = parseDates(cleanOrder);
      try {
        await prisma.order.upsert({
          where: { id: data.id },
          update: data,
          create: data,
        });
        orderCount++;
      } catch (err: any) {
        console.warn(`Warning upserting order ${data.id}:`, (err as any)?.message);
      }
    }
    console.log(`✅ Orders restored/merged: ${orderCount}/${orders.length}`);
  }

  // 8. Order Items
  const orderItemsPath = path.join(snapshotDir, "order_items.json");
  if (fs.existsSync(orderItemsPath)) {
    const items: any[] = JSON.parse(fs.readFileSync(orderItemsPath, "utf-8"));
    console.log(`\n📋 Restoring ${items.length} Order Items...`);
    let itemCount = 0;
    for (const item of items) {
      const { order, product, returnRequests, ...cleanItem } = item;
      const data = parseDates(cleanItem);
      try {
        await prisma.orderItem.upsert({
          where: { id: data.id },
          update: data,
          create: data,
        });
        itemCount++;
      } catch (err: any) {
        console.warn(`Warning upserting order item ${data.id}:`, (err as any)?.message);
      }
    }
    console.log(`✅ Order Items restored/merged: ${itemCount}/${items.length}`);
  }

  console.log("\n==================================================");
  console.log("🎉 DATABASE RESTORATION & MERGE COMPLETE!");
  console.log("==================================================");
}

restoreSnapshot()
  .catch((e) => {
    console.error("FATAL Restore Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
