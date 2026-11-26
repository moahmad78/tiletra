import { NextRequest, NextResponse } from "next/server";
import { prisma as rawPrisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notification-service";

const prisma = rawPrisma as any;

/**
 * Daily Birthday Wishes Automation Cron
 * Hits once daily (e.g. 09:00 IST).
 * Finds active users whose birthday matches today's month and day,
 * sends personalized push notifications with exclusive birthday rewards.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentDay = now.getUTCDate();
    const currentYear = now.getUTCFullYear();

    // Query users with birthday set
    const usersWithBirthday = await prisma.user.findMany({
      where: {
        birthday: { not: null },
      },
      select: {
        id: true,
        name: true,
        birthday: true,
        language: true,
      },
    });

    const birthdayUsers = usersWithBirthday.filter((u: any) => {
      if (!u.birthday) return false;
      const b = new Date(u.birthday);
      return b.getUTCMonth() === currentMonth && b.getUTCDate() === currentDay;
    });

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of birthdayUsers) {
      // Check if already sent birthday wish this year
      const alreadySent = await prisma.notificationLog.findFirst({
        where: {
          userId: user.id,
          type: "birthday_wish",
          createdAt: {
            gte: new Date(`${currentYear}-01-01T00:00:00Z`),
          },
        },
      });

      if (alreadySent) {
        skippedCount++;
        continue;
      }

      const firstName = user.name ? user.name.split(" ")[0] : "Friend";
      const title =
        user.language === "hi"
          ? `🎂 जन्मदिन मुबारक, ${firstName}!`
          : user.language === "kn"
          ? `🎂 ಹುಟ್ಟುಹಬ್ಬದ ಶುಭಾಶಯಗಳು, ${firstName}!`
          : `🎂 Happy Birthday, ${firstName}!`;

      const body =
        user.language === "hi"
          ? "IntriHub की ओर से आपके लिए खास जन्मदिन गिफ्ट व डिस्काउंट। आज ही ऑर्डर करें!"
          : user.language === "kn"
          ? "IntriHub ನಿಂದ ವಿಶೇಷ ಹುಟ್ಟುಹಬ್ಬದ ಉಡುಗೊರೆ ಮತ್ತು ರಿಯಾಯಿತಿ. ಇಂದೇ ಶಾಪಿಂಗ್ ಮಾಡಿ!"
          : "Celebrate your special day with an exclusive birthday discount from IntriHub!";

      const result = await sendNotification({
        userId: user.id,
        type: "offer_campaign",
        title,
        body,
        target: "offers",
        data: {
          type: "WISH",
          category: "birthday",
          accentColor: "#EC4899", // Festive pink
          ctaLabel: "Claim Birthday Gift",
        },
        sentByAdminId: "automation:birthday",
        ignoreQuietHours: false,
      });

      if (result.status === "sent") {
        sentCount++;
        // Track birthday wish log
        await prisma.notificationLog.create({
          data: {
            userId: user.id,
            type: "birthday_wish",
            platform: "multiple",
            status: "sent",
            sentByAdminId: "automation:birthday",
          },
        }).catch(() => {});
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      eligibleUsers: birthdayUsers.length,
      sentCount,
      skippedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Birthday Wishes Cron] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process birthday wishes" },
      { status: 500 }
    );
  }
}
