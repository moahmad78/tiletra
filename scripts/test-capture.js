const puppeteer = require("puppeteer-core");
const path = require("path");

async function main() {
  console.log("Launching local Chrome via puppeteer-core...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-web-security",
      "--user-data-dir=C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\910d6514-c3b1-4dca-9ff0-00990a0c1afb\\chrome-data",
      "--hide-scrollbars",
    ],
  });

  try {
    const page = await browser.newPage();
    page.on("console", (msg) => console.log("PAGE LOG:", msg.type(), msg.text()));
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

    await page.setRequestInterception(true);
    page.on("request", async (req) => {
      if (req.url() === "http://localhost:8081/" || req.url() === "http://localhost:8081") {
        try {
          const res = await fetch("http://localhost:8081/");
          let html = await res.text();
          html = html.replace('<script src=', '<script type="module" src=');
          req.respond({
            status: 200,
            contentType: "text/html",
            body: html,
          });
        } catch (e) {
          req.continue();
        }
      } else {
        req.continue();
      }
    });

    await page.setViewport({
      width: 412,
      height: 915,
      deviceScaleFactor: 2.625,
      isMobile: true,
      hasTouch: true,
    });

    console.log("Navigating to http://localhost:8081...");
    await page.goto("http://localhost:8081", { waitUntil: "domcontentloaded", timeout: 120000 });

    const title = await page.title();
    console.log("Page title:", title);

    // Wait a moment for Expo / React Native Web hydration and splash transition
    await new Promise((r) => setTimeout(r, 6000));

    const outPath = path.join(__dirname, "..", "play-store-screenshots", "test-render.png");
    await page.screenshot({ path: outPath, type: "png" });
    console.log("Screenshot saved to:", outPath);
  } catch (err) {
    console.error("Capture error:", err);
  } finally {
    await browser.close();
  }
}

main();
