"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface AttributeOptionItem {
  id: string;
  scope: "global" | "vendor";
  vendorId?: string | null;
  type: "unit" | "colour" | "dimension" | "custom";
  name: string;
  value: string;
  meta?: any;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export const DEFAULT_PRESET_UNITS = [
  { name: "Weight", value: "kg", meta: { family: "weight" } },
  { name: "Weight", value: "g", meta: { family: "weight" } },
  { name: "Weight", value: "mg", meta: { family: "weight" } },
  { name: "Volume", value: "L", meta: { family: "volume" } },
  { name: "Volume", value: "ml", meta: { family: "volume" } },
  { name: "Quantity", value: "pcs", meta: { family: "count" } },
  { name: "Quantity", value: "dozen", meta: { family: "count" } },
  { name: "Quantity", value: "pack", meta: { family: "count" } },
  { name: "Quantity", value: "box", meta: { family: "count" } },
  { name: "Area", value: "sqft", meta: { family: "area" } },
  { name: "Area", value: "sqm", meta: { family: "area" } },
  { name: "Length", value: "m", meta: { family: "length" } },
  { name: "Length", value: "cm", meta: { family: "length" } },
  { name: "Length", value: "ft", meta: { family: "length" } },
  { name: "Length", value: "inch", meta: { family: "length" } },
  { name: "Packaging", value: "bucket", meta: { family: "container" } },
  { name: "Packaging", value: "bag", meta: { family: "container" } },
  { name: "Packaging", value: "roll", meta: { family: "container" } },
];

export const DEFAULT_PRESET_COLOURS = [
  { name: "White", value: "White", meta: { hex: "#FFFFFF" } },
  { name: "Off White", value: "Off White", meta: { hex: "#FAF9F6" } },
  { name: "Ivory", value: "Ivory", meta: { hex: "#FFFFF0" } },
  { name: "Beige", value: "Beige", meta: { hex: "#F5F5DC" } },
  { name: "Grey", value: "Grey", meta: { hex: "#808080" } },
  { name: "Light Grey", value: "Light Grey", meta: { hex: "#D3D3D3" } },
  { name: "Dark Grey", value: "Dark Grey", meta: { hex: "#A9A9A9" } },
  { name: "Charcoal", value: "Charcoal", meta: { hex: "#36454F" } },
  { name: "Black", value: "Black", meta: { hex: "#000000" } },
  { name: "Brown", value: "Brown", meta: { hex: "#8B4513" } },
  { name: "Terracotta", value: "Terracotta", meta: { hex: "#E2725B" } },
  { name: "Blue", value: "Blue", meta: { hex: "#1E3A8A" } },
  { name: "Navy Blue", value: "Navy Blue", meta: { hex: "#000080" } },
  { name: "Green", value: "Green", meta: { hex: "#15803D" } },
  { name: "Red", value: "Red", meta: { hex: "#DC2626" } },
  { name: "Yellow", value: "Yellow", meta: { hex: "#EAB308" } },
  { name: "Gold", value: "Gold", meta: { hex: "#D4AF37" } },
  { name: "Silver", value: "Silver", meta: { hex: "#C0C0C0" } },
];

export const DEFAULT_PRESET_DIMENSIONS = [
  { name: "Dimension Unit", value: "mm", meta: { type: "dimension_unit" } },
  { name: "Dimension Unit", value: "cm", meta: { type: "dimension_unit" } },
  { name: "Dimension Unit", value: "m", meta: { type: "dimension_unit" } },
  { name: "Dimension Unit", value: "inch", meta: { type: "dimension_unit" } },
  { name: "Dimension Unit", value: "ft", meta: { type: "dimension_unit" } },
];

export const DEFAULT_CUSTOM_ATTRIBUTES = [
  { name: "Material", value: "Ceramic", meta: {} },
  { name: "Material", value: "Vitrified", meta: {} },
  { name: "Material", value: "Porcelain", meta: {} },
  { name: "Material", value: "Stainless Steel 304", meta: {} },
  { name: "Grade", value: "Premium", meta: {} },
  { name: "Grade", value: "Standard", meta: {} },
  { name: "Finish", value: "Glossy", meta: {} },
  { name: "Finish", value: "Matte", meta: {} },
  { name: "Finish", value: "Satin", meta: {} },
  { name: "Finish", value: "Rustic", meta: {} },
];

/**
 * Ensures global attribute defaults exist in database
 */
export async function ensureDefaultAttributeOptions() {
  try {
    const globalCount = await prisma.attributeOption.count({
      where: { scope: "global" },
    });

    if (globalCount === 0) {
      const recordsToCreate = [
        ...DEFAULT_PRESET_UNITS.map((u, i) => ({
          scope: "global",
          type: "unit",
          name: u.name,
          value: u.value,
          meta: u.meta,
          displayOrder: i,
        })),
        ...DEFAULT_PRESET_COLOURS.map((c, i) => ({
          scope: "global",
          type: "colour",
          name: c.name,
          value: c.value,
          meta: c.meta,
          displayOrder: i,
        })),
        ...DEFAULT_PRESET_DIMENSIONS.map((d, i) => ({
          scope: "global",
          type: "dimension",
          name: d.name,
          value: d.value,
          meta: d.meta,
          displayOrder: i,
        })),
        ...DEFAULT_CUSTOM_ATTRIBUTES.map((ca, i) => ({
          scope: "global",
          type: "custom",
          name: ca.name,
          value: ca.value,
          meta: ca.meta,
          displayOrder: i,
        })),
      ];

      await prisma.attributeOption.createMany({
        data: recordsToCreate,
        skipDuplicates: true,
      });
    }
  } catch (err) {
    console.error("Failed to seed default attribute options:", err);
  }
}

/**
 * Fetch attribute options available to a surface (global + vendor-specific)
 */
export async function getAttributeOptions(params?: {
  vendorId?: string | null;
  type?: "unit" | "colour" | "dimension" | "custom";
}) {
  try {
    await ensureDefaultAttributeOptions();

    const where: any = {
      isActive: true,
    };

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.vendorId) {
      where.OR = [
        { scope: "global" },
        { vendorId: params.vendorId },
      ];
    } else {
      where.scope = "global";
    }

    const options = await prisma.attributeOption.findMany({
      where,
      orderBy: [
        { displayOrder: "asc" },
        { name: "asc" },
        { value: "asc" },
      ],
    });

    return {
      success: true,
      options: options.map((opt) => ({
        id: opt.id,
        scope: opt.scope as "global" | "vendor",
        vendorId: opt.vendorId,
        type: opt.type as "unit" | "colour" | "dimension" | "custom",
        name: opt.name,
        value: opt.value,
        meta: opt.meta,
        displayOrder: opt.displayOrder,
        isActive: opt.isActive,
        createdAt: opt.createdAt,
      })),
    };
  } catch (error: any) {
    console.error("getAttributeOptions error:", error);
    return {
      success: false,
      options: [],
      error: error?.message || "Failed to load attribute options",
    };
  }
}

/**
 * Add a new custom attribute option (unit, colour, dimension, or custom name/value)
 */
export async function createAttributeOption(data: {
  type: "unit" | "colour" | "dimension" | "custom";
  name: string;
  value: string;
  meta?: any;
  vendorId?: string | null;
  scope?: "global" | "vendor";
}) {
  try {
    const trimmedName = data.name.trim();
    const trimmedValue = data.value.trim();

    if (!trimmedName || !trimmedValue) {
      return { success: false, error: "Name and value are required" };
    }

    const scope = data.scope || (data.vendorId ? "vendor" : "global");

    // Check for existing duplicate
    const existing = await prisma.attributeOption.findFirst({
      where: {
        type: data.type,
        name: { equals: trimmedName, mode: "insensitive" },
        value: { equals: trimmedValue, mode: "insensitive" },
        OR: [
          { scope: "global" },
          ...(data.vendorId ? [{ vendorId: data.vendorId }] : []),
        ],
      },
    });

    if (existing) {
      return {
        success: true,
        option: existing,
        message: "Option already exists",
      };
    }

    const created = await prisma.attributeOption.create({
      data: {
        type: data.type,
        name: trimmedName,
        value: trimmedValue,
        meta: data.meta || {},
        scope,
        vendorId: scope === "vendor" ? data.vendorId : null,
      },
    });

    return { success: true, option: created };
  } catch (error: any) {
    console.error("createAttributeOption error:", error);
    return { success: false, error: error?.message || "Failed to save option" };
  }
}

/**
 * Promote a vendor-scoped attribute option to global (CPO or Admin action)
 */
export async function promoteAttributeOptionToGlobal(id: string) {
  try {
    const updated = await prisma.attributeOption.update({
      where: { id },
      data: {
        scope: "global",
        vendorId: null,
      },
    });

    return { success: true, option: updated };
  } catch (error: any) {
    console.error("promoteAttributeOptionToGlobal error:", error);
    return { success: false, error: error?.message || "Failed to promote option" };
  }
}

/**
 * Delete or disable an attribute option
 */
export async function deleteAttributeOption(id: string) {
  try {
    await prisma.attributeOption.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: any) {
    console.error("deleteAttributeOption error:", error);
    return { success: false, error: error?.message || "Failed to delete option" };
  }
}
