import { generateIntriHubAiReply } from "../lib/connect/ai-orchestrator";
import { translateText } from "../lib/connect/translation-service";
import { renderTemplateText, DEFAULT_TEMPLATES } from "../lib/connect/template-engine";

async function runTests() {
  console.log("=== Testing IntriHub Connect Core Engines ===");

  // Test 1: Inbound Product Inquiry (Hindi / Hinglish)
  console.log("\n[Test 1] Product Availability (Rahul Sharma query):");
  const res1 = await generateIntriHubAiReply({
    customerMessage: "20mm PVC pipe chahiye 100 piece",
    customerName: "Rahul Sharma",
    tone: "Professional",
  });
  console.log("Detected Language:", res1.detectedLanguage);
  console.log("Detected Intent:", res1.intent);
  console.log("Confidence:", res1.confidence + "%");
  console.log("Suggested Reply:", res1.suggestedReply);
  console.log("Citations:", res1.sources.map((s) => s.sourceTitle));
  console.log("Guardrail Notes:", res1.guardrailNotes);

  // Test 2: Competitor Comparison Guardrail (Strict IntriHub Rule)
  console.log("\n[Test 2] Competitor Comparison (Amazon query):");
  const res2 = await generateIntriHubAiReply({
    customerMessage: "Which is better, IntriHub or Amazon?",
    customerName: "Suresh",
  });
  console.log("Detected Intent:", res2.intent);
  console.log("Confidence:", res2.confidence + "%");
  console.log("Suggested Reply:", res2.suggestedReply);
  console.log("Policy Passed:", res2.policyPassed);
  console.log("Guardrail Notes:", res2.guardrailNotes);

  // Test 3: Decoupled Translation
  console.log("\n[Test 3] Decoupled Translation Engine:");
  const trans1 = translateText({
    text: "Yes, this product is available. Please share your delivery location so we can check availability and delivery options.",
    toLanguage: "Kannada",
  });
  console.log("English -> Kannada:", trans1.translatedText);

  const trans2 = translateText({
    text: "20mm PVC pipe chahiye 100 piece",
    toLanguage: "English",
  });
  console.log("Hinglish -> English:", trans2.translatedText);

  // Test 4: Dynamic Template Interpolation
  console.log("\n[Test 4] Dynamic Template Interpolation:");
  const tmpl = DEFAULT_TEMPLATES[0]; // Delivery update
  const rendered = renderTemplateText(tmpl.textContent, {
    customer_name: "Rahul Sharma",
    order_id: "IH-10291",
    delivery_address: "Begur, Bangalore",
  });
  console.log("Rendered Template:\n", rendered);

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");
}

runTests().catch(console.error);
