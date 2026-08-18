"use server";

import { prisma } from "@/lib/prisma";
import { formatProduct } from "@/lib/formatters";

export async function syncCartToDb(
  userId: string,
  items: { productId: string; variantId: string; quantity: number }[]
) {
  try {
    if (!userId) return { success: false, error: "No userId provided" };

    // Verify user exists in DB to prevent foreign key error
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // Check if userId is a phone number or create a guest user record
      const cleanPhone = userId.replace(/\D/g, "");
      if (cleanPhone.length === 10) {
        user = await prisma.user.upsert({
          where: { phone: cleanPhone },
          update: {},
          create: {
            phone: cleanPhone,
            role: "customer",
          },
        });
      }
    }

    if (!user) {
      return { success: false, error: "Valid user account required to sync cart" };
    }

    // Find or create user cart
    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
      });
    }

    // Delete existing items and insert new items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    for (const item of items) {
      // Check if variant exists
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });
      if (variant) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId,
            boxQuantity: item.quantity,
          },
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error syncing cart to DB:", error);
    return { success: false, error: error?.message || "Failed to sync cart" };
  }
}

export async function getCartForUser(userId: string) {
  try {
    if (!userId) return [];

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    variants: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || !cart.items) return [];

    return cart.items.map((item) => ({
      product: formatProduct(item.variant.product),
      variant: {
        id: item.variant.id,
        size: item.variant.size,
        finish: item.variant.finish as any,
        color: item.variant.color,
        pricePerBox: item.variant.pricePerBox,
        pricePerSqft: item.variant.pricePerSqft,
        sqftPerBox: item.variant.sqftPerBox,
        stockBoxes: item.variant.stockBoxes,
      },
      quantity: item.boxQuantity,
    }));
  } catch (error) {
    console.error("Error fetching cart for user:", error);
    return [];
  }
}
