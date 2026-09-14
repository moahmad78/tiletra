const puppeteer = require("puppeteer-core");
const path = require("path");

const USER_AGENT =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.127 Mobile Safari/537.36";

async function main() {
  console.log("Launching local Chrome for Play Store screenshots...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
      `--user-agent=${USER_AGENT}`,
      "--user-data-dir=C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\910d6514-c3b1-4dca-9ff0-00990a0c1afb\\chrome-shots",
      "--hide-scrollbars",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    page.on("console", (msg) => {
      const text = msg.text();
      if (!text.includes("shadow*") && !text.includes("pointerEvents")) {
        console.log("PAGE LOG:", msg.type(), text);
      }
    });
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

    await page.setViewport({
      width: 412,
      height: 915,
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
    });

    console.log("Navigating to http://localhost:5000/...");
    await page.goto("http://localhost:5000/", { waitUntil: "networkidle0", timeout: 30000 });

    console.log("Waiting 6 seconds for products & categories to load from API...");
    await new Promise((r) => setTimeout(r, 6000));

    const outPath = path.join(__dirname, "..", "play-store-screenshots", "01-home.png");
    await page.screenshot({ path: outPath, type: "png" });
    console.log("01-home.png saved successfully to:", outPath);
  } catch (err) {
    console.error("Error during capture:", err);
  } finally {
    await browser.close();
  }
}

main();
