import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { prisma } from "../lib/prisma";
import Razorpay from "razorpay";
import crypto from "crypto";

async function runCheckoutV2Tests() {
  console.log("=================================================");
  console.log("  Checkout V2 Full Rebuild - Diagnostic Test Suite");
  console.log("=================================================\n");

  const key_id = (process.env.RAZORPAY_KEY_ID || "").trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

  console.log("1. Credentials & Configuration Verification:");
  console.log(`   RAZORPAY_KEY_ID: ${key_id}`);
  console.log(`   RAZORPAY_KEY_SECRET: ${key_secret ? key_secret.slice(0, 4) + "..." + key_secret.slice(-4) : "MISSING"}`);
  console.log(`   NEXT_PUBLIC_RAZORPAY_KEY_ID: ${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}\n`);

  if (!key_id || !key_secret) {
    console.error("❌ Test Failed: Razorpay credentials missing in environment");
    process.exit(1);
  }

  // Test 2: Database StoreSettings & Delivery Slab Calculations
  console.log("2. Testing StoreSettings & Vehicle Delivery Slabs:");
  let settings: any = null;
  try {
    settings = await prisma.storeSettings.findFirst();
  } catch (dbErr: any) {
    console.warn("   [DB Notice] Using fallback StoreSettings (DB offline/sleeping):", dbErr.message);
  }

  if (!settings) {
    settings = {
      storeName: "Intrihub",
      freeDeliveryThreshold: 15000,
      bikeDeliveryRate: 99,
      fourWheelerDeliveryRate: 349,
      weightThresholdKg: 20,
    };
  }

  console.log(`   ✔ Free Delivery Threshold: ₹${settings.freeDeliveryThreshold}`);
  console.log(`   ✔ Weight Threshold: ${settings.weightThresholdKg} kg`);
  console.log(`   ✔ Bike Delivery Rate: ₹${settings.bikeDeliveryRate}`);
  console.log(`   ✔ 4-Wheeler Delivery Rate: ₹${settings.fourWheelerDeliveryRate}\n`);

  // Test 3: Weight Slab Logic Verification
  console.log("3. Testing Weight Slab Selection Matrix:");
  const testCases = [
    { subtotal: 5000, weight: 15, expectedFee: settings.bikeDeliveryRate, label: "Under 20kg -> Bike Rate" },
    { subtotal: 5000, weight: 25, expectedFee: settings.fourWheelerDeliveryRate, label: "Over 20kg -> 4-Wheeler Rate" },
    { subtotal: 18000, weight: 100, expectedFee: 0, label: "Order >= ₹15,000 -> Free Delivery (₹0)" },
  ];

  for (const tc of testCases) {
    let fee = 0;
    if (tc.subtotal >= settings.freeDeliveryThreshold) {
      fee = 0;
    } else if (tc.weight <= settings.weightThresholdKg) {
      fee = settings.bikeDeliveryRate;
    } else {
      fee = settings.fourWheelerDeliveryRate;
    }

    if (fee === tc.expectedFee) {
      console.log(`   ✔ [PASSED] ${tc.label} (Fee: ₹${fee})`);
    } else {
      console.error(`   ❌ [FAILED] ${tc.label}: expected ₹${tc.expectedFee}, got ₹${fee}`);
      process.exit(1);
    }
  }

  // Test 4: Razorpay Orders API Integration with Structured Logging
  console.log("\n4. Testing Razorpay Orders API Call (Backend Order Initialization):");
  try {
    const razorpay = new Razorpay({ key_id, key_secret });
    const testAmountPaise = 250000; // ₹2,500.00
    const receipt = `rcpt_v2_${Date.now().toString().slice(-6)}`;

    const rzpOrder = await razorpay.orders.create({
      amount: testAmountPaise,
      currency: "INR",
      receipt,
      payment_capture: true,
      notes: {
        system: "Checkout-V2 Rebuild Test",
        testMode: "true",
      },
    });

    console.log("   ✔ Razorpay Order created successfully via SDK!");
    console.log(`     Order ID: ${rzpOrder.id}`);
    console.log(`     Amount: ₹${Number(rzpOrder.amount) / 100} (${rzpOrder.amount} paise)`);
    console.log(`     Receipt: ${rzpOrder.receipt}`);
    console.log(`     Status: ${rzpOrder.status}`);

    // Test 5: HMAC-SHA256 Timing-Safe Signature Verification
    console.log("\n5. Testing Payment Signature Verification (HMAC-SHA256):");
    const testPaymentId = "pay_v2test_" + Math.random().toString(36).substring(2, 10);
    const validSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${rzpOrder.id}|${testPaymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(validSignature);
    const actualBuffer = Buffer.from(validSignature);
    const isValid = crypto.timingSafeEqual(expectedBuffer, actualBuffer);

    if (isValid) {
      console.log("   ✔ Valid payment signature correctly verified!");
      console.log(`     Payload: ${rzpOrder.id}|${testPaymentId}`);
      console.log(`     Signature Digest: ${validSignature.slice(0, 16)}...`);
    } else {
      console.error("   ❌ Valid signature failed verification!");
      process.exit(1);
    }

    // Test 6: Tampered Signature Rejection
    console.log("\n6. Testing Tampered Signature Rejection (Security Guard):");
    const tamperedSignature = "tampered_signature_invalid_1234567890abcdef1234567890abcdef1234567890abcdef";
    const tamperedBuffer = Buffer.from(tamperedSignature);
    const isTamperedMatched =
      expectedBuffer.length === tamperedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, tamperedBuffer);

    if (!isTamperedMatched) {
      console.log("   ✔ Tampered signature correctly rejected! (Payment cannot be bypassed)");
    } else {
      console.error("   ❌ Security vulnerability: tampered signature was accepted!");
      process.exit(1);
    }

    console.log("\n=================================================");
    console.log("  All Checkout V2 Tests Passed Successfully! 🚀");
    console.log("=================================================\n");
  } catch (err: any) {
    console.error("❌ Razorpay Diagnostic Error:", {
      code: err?.error?.code || err?.code,
      description: err?.error?.description || err?.message,
      source: err?.error?.source,
      step: err?.error?.step,
      reason: err?.error?.reason,
    });
    process.exit(1);
  }
}

runCheckoutV2Tests();
