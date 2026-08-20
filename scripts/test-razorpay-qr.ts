import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

console.log("Testing Razorpay QR Code API with Key ID:", key_id);

const razorpay = new Razorpay({
  key_id: key_id || "",
  key_secret: key_secret || "",
});

async function run() {
  try {
    const qrOptions = {
      type: "upi_qr",
      name: "Intrihub Order",
      usage: "single_use",
      fixed_amount: true,
      payment_amount: 10000, // 100 INR in paise
      description: "Intrihub Order QR",
      close_by: Math.floor(Date.now() / 1000) + 900, // 15 mins
      notes: {
        purpose: "Checkout Scan and Pay",
      },
    };

    console.log("Creating QR Code with options:", qrOptions);
    const qr: any = await razorpay.qrCode.create(qrOptions as any);
    console.log("\n✔ QR Code Created Successfully!");
    console.log("QR Code ID:", qr.id);
    console.log("Image URL:", qr.image_url);
    console.log("Status:", qr.status);
    console.log("Close By (timestamp):", qr.close_by);
    console.log("Payments Amount Received:", qr.payments_amount_received);

    // Test fetching QR Code status
    console.log("\nTesting QR Code fetch by ID...");
    const fetchedQr: any = await razorpay.qrCode.fetch(qr.id);
    console.log("Fetched QR Status:", fetchedQr.status);
    console.log("Fetched QR Payments Amount:", fetchedQr.payments_amount_received);
    console.log("Fetched QR Payments Count:", fetchedQr.payments_count);

    // Test fetching payments for this QR Code
    if (razorpay.qrCode.fetchAllPayments) {
      const payments: any = await razorpay.qrCode.fetchAllPayments(qr.id);
      console.log("Fetched QR Payments:", payments);
    }
  } catch (err: any) {
    console.error("QR Code API Error:", err?.error || err?.message || err);
  }
}

run();
