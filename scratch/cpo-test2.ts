import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to vendor login...");
  await page.goto("http://localhost:3000/vendor/login", { timeout: 120000 });

  console.log("Entering email...");
  await page.fill("input[type=email]", "cpo@intrihub.com");
  
  await page.click("form button[type=submit]");

  console.log("Waiting for OTP to be generated...");
  // Wait for the OTP input to be visible in the DOM
  await page.waitForSelector('input[inputmode="numeric"]', { state: 'visible', timeout: 120000 });
  console.log("OTP inputs are visible now.");

  const tokenRecord = await prisma.emailOtpToken.findFirst({
    where: { email: "cpo@intrihub.com", used: false },
    orderBy: { createdAt: "desc" }
  });

  if (!tokenRecord) {
    console.error("Could not find OTP in database!");
    await browser.close();
    process.exit(1);
  }

  console.log("Found OTP:", tokenRecord.otp);

  const otpChars = tokenRecord.otp.split("");
  const inputs = page.locator('input[inputmode="numeric"]');
  for (let i = 0; i < otpChars.length; i++) {
    await inputs.nth(i).fill(otpChars[i]);
  }
  
  console.log("Clicking Verify...");
  try {
    await page.click("button:has-text(\"Verify & Enter Vendor Panel\")", { timeout: 3000 });
  } catch(e) {
    console.log("Could not find Verify button, might have auto-submitted.");
  }
  
  console.log("Waiting for login to complete...");
  try {
    await page.waitForURL("**/cpo**", { timeout: 30000 });
    console.log("Successfully logged in!");
  } catch(e) {
    console.error("Failed to navigate to /cpo");
    await page.screenshot({ path: "scratch/cpo_login_failed.png", fullPage: true });
    await browser.close();
    process.exit(1);
  }

  await page.waitForLoadState("networkidle");

  console.log("Going to /cpo/catalog/new...");
  await page.goto("http://localhost:3000/cpo/catalog/new", { timeout: 60000 });
  await page.waitForLoadState("networkidle");
  
  console.log("Taking screenshot of the page...");
  await page.screenshot({ path: "scratch/cpo_screenshot.png", fullPage: true });

  console.log("Filling demo item form...");
  await page.fill('input[name="title"]', "Demo Automated Item");
  await page.fill('input[name="price"]', "99.99");
  await page.fill('textarea[name="description"]', "This is an automated demo item uploaded via CPO Panel.");
  
  console.log("Submitting form...");
  await page.click('button[type="submit"]');
  
  console.log("Waiting for form submission...");
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "scratch/cpo_screenshot_after_submit.png", fullPage: true });

  await browser.close();
  console.log("DONE");
}

main().catch(console.error).finally(() => prisma.$disconnect());
