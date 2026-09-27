import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("q") || "").trim();

    if (!rawQuery || rawQuery.length < 2) {
      return NextResponse.json({
        success: true,
        query: rawQuery,
        customers: [],
        orders: [],
        returns: [],
        complaints: [],
      });
    }

    // Clean query: strip #, spaces, leading dashes
    const cleanQuery = rawQuery.replace(/^[#\s]+/, "");
    // Extract digits for phone search
    const digitsOnly = rawQuery.replace(/\D/g, "");
    const last10Digits = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : digitsOnly;

    // 1. Search Orders
    const orderWhereClauses: any[] = [
      { id: { contains: cleanQuery, mode: "insensitive" } },
      { customerName: { contains: cleanQuery, mode: "insensitive" } },
      { customerEmail: { contains: cleanQuery, mode: "insensitive" } },
      { deliveryCity: { contains: cleanQuery, mode: "insensitive" } },
    ];

    if (last10Digits.length >= 4) {
      orderWhereClauses.push({
        customerPhone: { contains: last10Digits },
      });
    }

    const matchingOrders = await prisma.order.findMany({
      where: {
        OR: orderWhereClauses,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                slug: true,
              },
            },
          },
        },
        returnRequests: {
          orderBy: { createdAt: "desc" },
        },
        complaints: {
          orderBy: { createdAt: "desc" },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            addresses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    // 2. Search Customers (CRM and Users)
    const customerWhereClauses: any[] = [
      { name: { contains: cleanQuery, mode: "insensitive" } },
      { email: { contains: cleanQuery, mode: "insensitive" } },
    ];

    if (last10Digits.length >= 4) {
      customerWhereClauses.push({
        phone: { contains: last10Digits },
      });
    }

    const [matchingCrmCustomers, matchingUsers] = await Promise.all([
      prisma.customer.findMany({
        where: { OR: customerWhereClauses },
        take: 10,
      }),
      prisma.user.findMany({
        where: {
          OR: customerWhereClauses.map((c) =>
            "phone" in c ? { phone: { contains: last10Digits } } : c
          ),
        },
        include: {
          addresses: true,
          orders: {
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
              items: true,
              returnRequests: true,
            },
          },
        },
        take: 10,
      }),
    ]);

    // Build unified customer profiles
    const customerMap = new Map<string, any>();

    matchingUsers.forEach((u) => {
      const phoneKey = u.phone.replace(/\D/g, "").slice(-10);
      customerMap.set(phoneKey, {
        id: u.id,
        name: u.name || "Customer",
        phone: u.phone,
        email: u.email,
        addresses: u.addresses || [],
        totalOrders: u.orders?.length || 0,
        recentOrders: u.orders || [],
        source: "user",
      });
    });

    matchingCrmCustomers.forEach((c) => {
      const phoneKey = c.phone.replace(/\D/g, "").slice(-10);
      const existing = customerMap.get(phoneKey);
      if (!existing) {
        customerMap.set(phoneKey, {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          addresses: [],
          totalOrders: c.totalOrders,
          totalSpent: c.totalSpent,
          recentOrders: [],
          source: "crm",
        });
      } else {
        existing.totalSpent = c.totalSpent;
        if (c.totalOrders > existing.totalOrders) {
          existing.totalOrders = c.totalOrders;
        }
      }
    });

    // Also extract customers found directly from orders
    matchingOrders.forEach((o) => {
      const phoneKey = o.customerPhone.replace(/\D/g, "").slice(-10);
      if (phoneKey && !customerMap.has(phoneKey)) {
        customerMap.set(phoneKey, {
          id: o.userId || `ord-${phoneKey}`,
          name: o.customerName || "Customer",
          phone: o.customerPhone,
          email: o.customerEmail,
          addresses: o.deliveryAddress
            ? [
                {
                  id: "ord-addr",
                  street: o.deliveryAddress,
                  city: o.deliveryCity,
                  pincode: o.deliveryPostalCode,
                  isDefault: true,
                },
              ]
            : [],
          totalOrders: 1,
          totalSpent: o.total,
          recentOrders: [o],
          source: "order",
        });
      }
    });

    // 3. Search standalone Return Requests & Complaints if relevant
    const matchingReturns = await prisma.returnRequest.findMany({
      where: {
        OR: [
          { orderId: { contains: cleanQuery, mode: "insensitive" } },
          { reason: { contains: cleanQuery, mode: "insensitive" } },
          { notes: { contains: cleanQuery, mode: "insensitive" } },
          { status: { contains: cleanQuery, mode: "insensitive" } },
        ],
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            total: true,
            createdAt: true,
          },
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    const matchingComplaints = await prisma.complaintNote.findMany({
      where: {
        OR: [
          { note: { contains: cleanQuery, mode: "insensitive" } },
          { orderId: { contains: cleanQuery, mode: "insensitive" } },
          { customerName: { contains: cleanQuery, mode: "insensitive" } },
          ...(last10Digits.length >= 4
            ? [{ customerPhone: { contains: last10Digits } }]
            : []),
        ],
      },
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            total: true,
          },
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      query: rawQuery,
      customers: Array.from(customerMap.values()),
      orders: matchingOrders,
      returns: matchingReturns,
      complaints: matchingComplaints,
    });
  } catch (error: any) {
    console.error("Help search API error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Search failed" },
      { status: 500 }
    );
  }
}
