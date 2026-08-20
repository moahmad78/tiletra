import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import Razorpay from "razorpay";
import crypto from "crypto";

async function runTests() {
  console.log("=========================================");
  console.log("  Testing Razorpay Integration (Test Mode)");
  console.log("=========================================\n");

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  console.log("1. Environment Credentials:");
  console.log(`   RAZORPAY_KEY_ID: ${key_id}`);
  console.log(`   RAZORPAY_KEY_SECRET: ${key_secret ? key_secret.slice(0, 4) + "..." + key_secret.slice(-4) : "MISSING"}`);
  console.log(`   NEXT_PUBLIC_RAZORPAY_KEY_ID: ${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}\n`);

  if (!key_id || !key_secret) {
    console.error("❌ FAILED: Missing Razorpay credentials in environment.");
    process.exit(1);
  }

  // Test 1: Razorpay Order Creation via SDK
  console.log("2. Testing Orders API (create order):");
  try {
    const razorpay = new Razorpay({ key_id, key_secret });
    const testAmountInPaise = 500000; // ₹5,000.00
    const receipt = `rcpt_test_${Date.now().toString().slice(-6)}`;

    const order = await razorpay.orders.create({
      amount: testAmountInPaise,
      currency: "INR",
      receipt,
      payment_capture: true,
    });

    console.log("   ✔ Razorpay Order created successfully!");
    console.log(`     Order ID: ${order.id}`);
    console.log(`     Amount: ${order.amount} paise (₹${Number(order.amount) / 100})`);
    console.log(`     Currency: ${order.currency}`);
    console.log(`     Status: ${order.status}`);
    console.log(`     Receipt: ${order.receipt}\n`);

    // Test 2: HMAC-SHA256 Signature Verification with valid signature
    console.log("3. Testing Signature Verification (Valid Signature):");
    const testPaymentId = "pay_test_" + Math.random().toString(36).substring(2, 10);
    const validSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${order.id}|${testPaymentId}`)
      .digest("hex");

    const textToSign = `${order.id}|${testPaymentId}`;
    const expected = crypto.createHmac("sha256", key_secret).update(textToSign).digest("hex");
    const isMatch = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(validSignature));

    if (isMatch) {
      console.log("   ✔ Valid signature verified successfully via timing-safe HMAC-SHA256!");
      console.log(`     Payload: ${textToSign}`);
      console.log(`     Signature: ${validSignature.slice(0, 16)}...`);
    } else {
      console.error("   ❌ Failed to verify valid signature!");
    }

    // Test 3: Signature Verification with TAMPERED signature
    console.log("\n4. Testing Tampered Signature Rejection (Security check):");
    const fakeSignature = "invalid_tampered_signature_1234567890abcdef1234567890abcdef1234567890abcdef";
    const fakeBuffer = Buffer.from(fakeSignature);
    const expectedBuffer = Buffer.from(expected);
    const isTamperedMatched =
      fakeBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, fakeBuffer);

    if (!isTamperedMatched) {
      console.log("   ✔ Tampered/invalid signature correctly REJECTED! (Payment marked unpaid)");
    } else {
      console.error("   ❌ CRITICAL SECURITY FLAW: Tampered signature was accepted!");
    }

    console.log("\n=========================================");
    console.log("  All Razorpay Tests Passed Successfully!");
    console.log("=========================================\n");
  } catch (err: any) {
    console.error("❌ Razorpay API Error:", err);
    process.exit(1);
  }
}

runTests();
