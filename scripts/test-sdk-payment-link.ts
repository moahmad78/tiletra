import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const key_id = (process.env.RAZORPAY_KEY_ID || "").trim();
const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

console.log("Using key_id:", key_id);
console.log("Using key_secret:", key_secret.slice(0, 4) + "..." + key_secret.slice(-4));

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

async function testSdkPaymentLink() {
  const expireBy = Math.floor(Date.now() / 1000) + (16 * 60); // 16 minutes buffer
  const payload = {
    amount: 250000, // ₹2500 in paise
    currency: "INR",
    accept_partial: false,
    description: "Intrihub Order TL-998811",
    customer: {
      name: "Mohammad Ahmad",
      email: "test@intrihub.com",
      contact: "9876543210",
    },
    notify: {
      sms: false,
      email: false,
      whatsapp: false,
    },
    reminder_enable: false,
    expire_by: expireBy,
    notes: {
      order_id: "TL-998811",
      source: "Intrihub Scan & Pay QR",
    },
  };

  try {
    console.log("Creating payment link via razorpay.paymentLink.create...");
    const data: any = await razorpay.paymentLink.create(payload as any);
    console.log("✔ Razorpay SDK PaymentLink Created Successfully!");
    console.log("ID:", data.id);
    console.log("Short URL:", data.short_url);
    console.log("Status:", data.status);
    console.log("Amount:", data.amount);

    console.log("\nTesting razorpay.paymentLink.fetch...");
    const fetched: any = await razorpay.paymentLink.fetch(data.id);
    console.log("✔ Fetched status:", fetched.status, "amount_paid:", fetched.amount_paid);
  } catch (err: any) {
    console.error("SDK Error:", err?.error || err);
  }
}

testSdkPaymentLink();
