import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to admin login...");
  await page.goto("http://localhost:3000/admin/login");

  // Enter email
  console.log("Entering email...");
  await page.fill("input[type=email]", "admin@intrihub.com");
  await page.click("button:has-text(\"Send OTP\")");

  // Wait for OTP to be generated in DB
  console.log("Waiting for OTP to be generated...");
  await page.waitForTimeout(3000);

  // Fetch OTP from DB
  const tokenRecord = await prisma.emailOtpToken.findFirst({
    where: { email: "admin@intrihub.com", used: false },
    orderBy: { createdAt: "desc" }
  });

  if (!tokenRecord) {
    console.error("Could not find OTP in database!");
    await browser.close();
    process.exit(1);
  }

  console.log("Found OTP:", tokenRecord.otp);

  // Enter OTP
  const otpChars = tokenRecord.otp.split("");
  for (let i = 0; i < otpChars.length; i++) {
    await page.fill(`input[aria-label="Digit ${i + 1}"]`, otpChars[i]);
  }
  
  await page.click("button:has-text(\"Verify\")");

  // Wait for login success
  console.log("Waiting for login to complete...");
  await page.waitForURL("**/admin**");
  console.log("Successfully logged in!");

  // Navigate to CPO panel
  console.log("Navigating to CPO panel...");
  await page.goto("http://localhost:3000/cpo");
  await page.waitForTimeout(2000);

  console.log("Going to /cpo/catalog/new...");
  await page.goto("http://localhost:3000/cpo/catalog/new");
  await page.waitForTimeout(3000);
  
  console.log("Filling demo item details...");
  // We need to fill in some details to test upload
  // Wait for the form to appear
  try {
    await page.fill("input[name=name]", "Demo Item Automated");
    await page.fill("input[name=price]", "100");
    // Other required fields...
  } catch (e) {
    console.log("Could not find form inputs directly. Just taking a screenshot.");
  }

  console.log("Taking screenshot of the page...");
  await page.screenshot({ path: "scratch/cpo_screenshot.png", fullPage: true });

  await browser.close();
}

main().catch(console.error).finally(() => prisma.$disconnect());
