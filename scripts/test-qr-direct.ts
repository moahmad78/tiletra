import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

const authHeader = "Basic " + Buffer.from(`${key_id}:${key_secret}`).toString("base64");

async function testCorrectParams() {
  const payload = {
    type: "upi_qr",
    name: "Intrihub Store",
    usage: "single_payment",
    fixed_amount: true,
    amount: 50000, // 500 INR in paise
    description: "Payment for order #test123",
    close_by: Math.floor(Date.now() / 1000) + 1200, // 20 mins
    notes: {
      order_id: "test123",
      source: "Intrihub Checkout",
    },
  };

  console.log("Testing Razorpay QR API with correct params...");
  try {
    const res = await fetch("https://api.razorpay.com/v1/payments/qr_codes", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));

    if (data.id) {
      console.log("\nTesting GET QR Code Status for:", data.id);
      const getRes = await fetch(`https://api.razorpay.com/v1/payments/qr_codes/${data.id}`, {
        headers: { Authorization: authHeader },
      });
      const getData = await getRes.json();
      console.log("GET Response:", JSON.stringify(getData, null, 2));
    }
  } catch (e: any) {
    console.error("Fetch error:", e);
  }
}

testCorrectParams();
