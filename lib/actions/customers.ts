"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { totalSpent: "desc" },
    });
    return customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function updateCustomerStatus(id: string, status: string) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: { status },
    });
    safeRevalidate("/admin/customers");
    return { success: true, customer };
  } catch (error: any) {
    console.error("Error updating customer status:", error);
    return { success: false, error: error?.message || "Failed to update customer" };
  }
}

export async function updateCustomerNotes(id: string, notes: string) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: { notes },
    });
    safeRevalidate("/admin/customers");
    return { success: true, customer };
  } catch (error: any) {
    console.error("Error updating customer notes:", error);
    return { success: false, error: error?.message || "Failed to update notes" };
  }
}
