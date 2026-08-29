import axios from "axios";

async function testSendOtp() {
  const randomEmail = `test_random_${Date.now()}_${Math.random().toString(36).substring(7)}@gmail.com`;
  console.log("Testing with completely fresh random email:", randomEmail);

  console.log("\n--- Testing Production (https://www.intrihub.com/api/mobile/auth/send-otp) ---");
  try {
    const prodRes = await axios.post("https://www.intrihub.com/api/mobile/auth/send-otp", {
      email: randomEmail,
      purpose: "business",
    });
    console.log("PROD SUCCESS RESPONSE:", prodRes.status, prodRes.data);
  } catch (err: any) {
    console.log("PROD REJECTED / ERROR STATUS:", err?.response?.status);
    console.log("PROD DATA:", err?.response?.data);
  }

  console.log("\n--- Testing Approved Vendor on Production (vishalpoddar393@gmail.com) ---");
  try {
    const vendorRes = await axios.post("https://www.intrihub.com/api/mobile/auth/send-otp", {
      email: "vishalpoddar393@gmail.com",
      purpose: "business",
    });
    console.log("VENDOR PROD RESPONSE:", vendorRes.status, vendorRes.data);
  } catch (err: any) {
    console.log("VENDOR PROD ERROR:", err?.response?.status, err?.response?.data);
  }
}

testSendOtp();
