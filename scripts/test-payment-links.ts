import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

const authHeader = "Basic " + Buffer.from(`${key_id}:${key_secret}`).toString("base64");

async function testPaymentLinks() {
  const payload = {
    amount: 50000, // 500.00 INR
    currency: "INR",
    accept_partial: false,
    description: "Payment for Intrihub Order",
    customer: {
      name: "Test Customer",
      email: "test@intrihub.com",
      contact: "+919876543210",
    },
    notify: {
      sms: false,
      email: false,
    },
    reminder_enable: false,
    notes: {
      order_id: "test1234",
    },
  };

  console.log("Testing Razorpay Payment Links API (POST /v1/payment_links)...");
  try {
    const res = await fetch("https://api.razorpay.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log("Payment Link Response:", JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error("Fetch error:", e);
  }
}

testPaymentLinks();
