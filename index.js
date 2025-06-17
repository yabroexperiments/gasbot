import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

app.post("/submit", async (req, res) => {
  const { user_code, phone_area, phone_number, d1, d2, d3, d4 } = req.body;
  const logs = [];
  console.log("📥 Received payload:", req.body);

  let browser;

  try {
    logs.push("✅ Launching browser...");
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on("dialog", async (dialog) => {
      logs.push(`💬 Dialog: ${dialog.message()}`);
      await dialog.dismiss();
    });

    logs.push("🌐 Navigating to page...");
    await page.goto("https://www.shinshingas.com.tw/consumer_diy.aspx", { waitUntil: "domcontentloaded" });

    logs.push("📝 Filling form...");
    await page.fill("#AccountNO", user_code);
    await page.fill("#txtZone", phone_area);
    await page.fill("#txtTel", phone_number);
    await page.click("#Button1");

    logs.push("🔎 Checking for error message...");
    await page.waitForLoadState("domcontentloaded");

    const errorExists = await page.$("text=查無資料");
    if (errorExists) {
      logs.push("❌ 查無資料");
      await browser.close();
      return res.status(200).json({ success: false, reason: "查無資料", logs });
    }

    logs.push("🧮 Filling meter readings...");
    await page.fill("#no1", d1);
    await page.fill("#no2", d2);
    await page.fill("#no3", d3);
    await page.fill("#no4", d4);
    await page.click("#LinkButton1");

    logs.push("⏳ Waiting for final confirmation...");
    await page.waitForTimeout(2000);
    await browser.close();

    logs.push("✅ Success! Form submitted.");
    return res.status(200).json({ success: true, logs });

  } catch (err) {
    console.error("🔥 Playwright error:", err);
    if (browser) await browser.close();
    logs.push(`🔥 Error: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message, logs });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🔥 Playwright bot running on port ${port}`);
});
