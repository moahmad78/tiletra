import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

const ARTIFACTS_DIR = "C:\\Users\\moahm\\.gemini\\antigravity-ide\\brain\\8e3b0fea-74b4-48e7-ac5f-08af6a436ae4";

async function generateScreenshots() {
  console.log("Launching Chromium via Playwright...");
  const browser = await chromium.launch({ headless: true });

  // 1. AppInstallPrompt Screenshot (Android Mobile Viewport 412x892)
  {
    const page = await browser.newPage({
      viewport: { width: 412, height: 892 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>IntriHub Storefront</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; margin: 0; padding: 0; }
      </style>
    </head>
    <body class="relative min-h-screen bg-slate-50 flex flex-col justify-between p-4">
      <!-- Simulated Storefront Background Header -->
      <div class="space-y-4 pt-2">
        <div class="flex items-center justify-between pb-3 border-b border-slate-200">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-[#052A51] flex items-center justify-center text-white font-black text-sm">IH</div>
            <span class="text-base font-black text-[#052A51]">IntriHub</span>
          </div>
          <div class="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">Bangalore (560114)</div>
        </div>

        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80">
          <div class="h-32 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-xl p-4 text-white flex flex-col justify-between">
            <span class="text-[10px] font-black uppercase tracking-wider bg-[#F26522] w-fit px-2 py-0.5 rounded text-white">Wholesale Hub</span>
            <div>
              <h2 class="text-base font-black">Direct Factory Tile &amp; Building Materials</h2>
              <p class="text-xs text-slate-300 mt-0.5">Delivered within 60 minutes across Bangalore</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div class="h-20 bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-400 font-bold text-xs">Vitrified Tiles</div>
            <div class="text-xs font-bold text-slate-900">Double Charge 2x2</div>
            <div class="text-xs font-black text-[#F26522] mt-0.5">₹48 / sq.ft</div>
          </div>
          <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div class="h-20 bg-slate-100 rounded-lg mb-2 flex items-center justify-center text-slate-400 font-bold text-xs">Bath &amp; Sanitary</div>
            <div class="text-xs font-bold text-slate-900">Wall Hung Commode</div>
            <div class="text-xs font-black text-[#F26522] mt-0.5">₹4,250</div>
          </div>
        </div>
      </div>

      <!-- ─── THE NEW APPINSTALLPROMPT COMPONENT ─── -->
      <aside aria-label="Install IntriHub App" class="fixed bottom-4 left-3 right-3 z-50">
        <div class="mx-auto max-w-md rounded-2xl bg-gradient-to-br from-[#052A51] via-[#04203D] to-[#021529] p-4 text-white shadow-2xl border border-white/20 backdrop-blur-md relative overflow-hidden">
          <!-- Glow Accent -->
          <div class="absolute -top-10 -right-10 w-28 h-28 bg-[#F26522]/20 rounded-full blur-2xl pointer-events-none"></div>

          <!-- Close Button -->
          <button type="button" class="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 text-white/70 flex items-center justify-center">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          <div class="flex items-start gap-3.5 pr-7">
            <!-- App Icon -->
            <div class="w-13 h-13 rounded-2xl bg-white p-1 shrink-0 shadow-md border border-white/25 flex items-center justify-center">
              <div class="w-full h-full rounded-xl bg-[#052A51] flex items-center justify-center font-black text-lg text-white">IH</div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[#F26522] rounded text-white shadow-2xs flex items-center gap-1">
                  ★ Google Play
                </span>
                <span class="text-[11px] text-amber-300 font-bold">★ 4.9</span>
                <span class="text-[10px] text-white/60 font-medium">(10k+ Orders)</span>
              </div>
              <h3 class="text-sm font-black text-white leading-tight">
                Experience IntriHub App
              </h3>
              <p class="text-[11px] text-white/75 leading-snug mt-0.5">
                Faster orders, live truck tracking &amp; wholesale factory prices directly on your phone.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2.5 mt-3.5 pt-2.5 border-t border-white/10">
            <button type="button" class="px-3 py-2 rounded-xl text-xs font-semibold text-white/70">
              Not now
            </button>

            <button type="button" class="flex-1 py-2.5 px-4 bg-[#F26522] text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
              <span>Install on Play Store</span>
            </button>
          </div>
        </div>
      </aside>
    </body>
    </html>
    `;

    await page.setContent(htmlContent);
    await page.waitForTimeout(500);
    const outputPath = path.join(ARTIFACTS_DIR, "app_install_prompt_mobile.png");
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log("Saved screenshot:", outputPath);
    await page.close();
  }

  // 2. Soft Update Dialog Screenshot (Mobile Viewport 390x844)
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Soft Update Dialog</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; padding: 0; }
      </style>
    </head>
    <body class="bg-[#050F1E]/80 min-h-screen flex items-center justify-center p-6">
      <div class="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative flex flex-col items-center">
        <!-- Close Button (Soft update only) -->
        <button class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <!-- Badge -->
        <div class="relative mb-3">
          <div class="w-18 h-18 rounded-full bg-[#052A51] flex items-center justify-center text-white shadow-lg">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
          </div>
          <div class="absolute -top-1 -right-1 bg-amber-100 p-1 rounded-full text-emerald-600">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        </div>

        <h3 class="text-xl font-black text-slate-900 text-center mb-1">New Update Available! 🚀</h3>
        
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-semibold text-slate-500">Current: v1.2.3</span>
          <span class="text-xs text-slate-400">→</span>
          <span class="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">Latest: v1.2.5</span>
        </div>

        <p class="text-xs text-slate-600 text-center leading-relaxed mb-4">
          A fresh update of IntriHub is here with faster loading, smooth checkout, and new features.
        </p>

        <!-- Release Notes -->
        <div class="w-full bg-slate-50 p-3.5 rounded-2xl border border-slate-200 mb-5">
          <div class="text-[11px] font-black uppercase text-slate-700 mb-2 tracking-wider">What's New:</div>
          <div class="space-y-1.5 text-xs text-slate-700 font-medium">
            <div class="flex items-center gap-2">
              <span class="text-emerald-500">✓</span> Faster catalog &amp; tiles browsing
            </div>
            <div class="flex items-center gap-2">
              <span class="text-emerald-500">✓</span> Instant live order tracking
            </div>
            <div class="flex items-center gap-2">
              <span class="text-emerald-500">✓</span> Performance &amp; stability improvements
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="w-full space-y-2">
          <button class="w-full h-12 bg-[#052A51] hover:bg-[#041F3D] text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
            <span>Update Now</span>
          </button>
          <button class="w-full h-10 text-slate-500 font-bold text-xs flex items-center justify-center">
            Later (Remind in 2 days)
          </button>
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent);
    await page.waitForTimeout(500);
    const outputPath = path.join(ARTIFACTS_DIR, "soft_update_dialog_mobile.png");
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log("Saved screenshot:", outputPath);
    await page.close();
  }

  // 3. Force Update Dialog Screenshot (Blocking Fullscreen)
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Force Update Dialog</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; padding: 0; }
      </style>
    </head>
    <body class="bg-[#051A33] min-h-screen flex items-center justify-center p-6">
      <div class="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl relative flex flex-col items-center border border-slate-100">
        <!-- Badge -->
        <div class="relative mb-3">
          <div class="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-white shadow-xl shadow-red-600/30">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>

        <h3 class="text-xl font-black text-slate-900 text-center mb-1">Update Required ⚠️</h3>
        
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-semibold text-slate-500">Installed: v1.1.0</span>
          <span class="text-xs text-slate-400">→</span>
          <span class="text-xs font-black text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">Required: v1.2.0+</span>
        </div>

        <p class="text-xs text-slate-600 text-center leading-relaxed mb-5">
          This version of IntriHub is deprecated and no longer supported. Please update immediately from Google Play Store to continue ordering materials.
        </p>

        <div class="w-full bg-red-50/70 p-3.5 rounded-2xl border border-red-200/80 mb-6 text-center">
          <p class="text-xs font-bold text-red-800">
            🔒 App access is blocked until updated to ensure secure checkout &amp; order fulfillment.
          </p>
        </div>

        <!-- ONLY 1 Action Button: No close or Later button -->
        <div class="w-full">
          <button class="w-full h-13 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/25">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
            <span>Update Now on Google Play</span>
          </button>
        </div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent);
    await page.waitForTimeout(500);
    const outputPath = path.join(ARTIFACTS_DIR, "force_update_dialog_mobile.png");
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log("Saved screenshot:", outputPath);
    await page.close();
  }

  await browser.close();
  console.log("All screenshots generated successfully!");
}

generateScreenshots().catch(console.error);
