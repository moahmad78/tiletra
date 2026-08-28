import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deliveryPartnerId, orderId, latitude, longitude, accuracy, speed, heading, markArrived } = body;

    if (!deliveryPartnerId || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: "deliveryPartnerId, latitude and longitude are required" }, { status: 400 });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    // 1. Update DeliveryPartner current location
    await prisma.deliveryPartner.update({
      where: { id: deliveryPartnerId },
      data: {
        currentLatitude: lat,
        currentLongitude: lng,
        currentAccuracy: accuracy ? Number(accuracy) : null,
        lastLocationAt: new Date(),
      },
    });

    // 2. Log location point if order is active
    if (orderId) {
      await prisma.deliveryLocationLog.create({
        data: {
          orderId,
          deliveryPartnerId,
          latitude: lat,
          longitude: lng,
          accuracy: accuracy ? Number(accuracy) : null,
          speed: speed ? Number(speed) : null,
          heading: heading ? Number(heading) : null,
        },
      });

      if (markArrived) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            deliveryArrivedAt: new Date(),
            orderStatus: "Out for Delivery",
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delivery location update error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to update delivery location" }, { status: 500 });
  }
}
