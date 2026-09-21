/**
 * Approved IntriHub Knowledge Sources (PRD Section 2, 18, 20, 21)
 * Only verified, approved sources are indexed and permitted in AI responses.
 */

export interface ApprovedKnowledgeDocument {
  id: string;
  title: string;
  category: "POLICIES" | "FAQS" | "PRODUCTS" | "SERVICES" | "SOP";
  version: string;
  status: "APPROVED";
  approvedBy: string;
  approvedAt: string;
  tags: string[];
  content: string;
  highlights: string[];
}

export const APPROVED_INTRIHUB_KNOWLEDGE: ApprovedKnowledgeDocument[] = [
  {
    id: "kb-del-01",
    title: "IntriHub Logistics & Delivery Policy",
    category: "POLICIES",
    version: "3.2",
    status: "APPROVED",
    approvedBy: "Operations Head",
    approvedAt: "2026-09-15",
    tags: ["delivery", "bangalore", "shipping", "eta", "charges", "pvc pipe", "tiles"],
    highlights: [
      "Bangalore & Karnataka delivery available across all major pin codes.",
      "Same-day dispatch available for fast-moving construction essentials when ordered before 2:00 PM.",
      "Standard delivery timeline is 24 to 48 hours depending on product bulk and delivery site location.",
      "Customer delivery location (locality or pin code) is mandatory to confirm exact dispatch slot and vehicle type (tempo, flatbed, 3-wheeler).",
      "Delivery charges depend on total weight, volume, and destination distance."
    ],
    content: `IntriHub Logistics & Delivery Policy (v3.2):
1. Coverage: IntriHub operates delivery networks across Bangalore urban, Bangalore rural, and major tier-2 cities across Karnataka.
2. Dispatch Timelines: Same-day dispatch applies to stocked items (standard pipes, tiles, fittings, electrical cables) ordered prior to 2:00 PM IST. Standard delivery is 24 to 48 hours.
3. Bulky & Construction Materials: Pipes (including 20mm, 25mm PVC conduit and plumbing), plywood, ceramic/vitrified tiles, and sanitaryware are transported via dedicated freight vehicles.
4. Mandatory Location Requirement: Agents and AI must always request the customer's delivery location (Area/Pincode) before confirming site offloading logistics or delivery fees.
5. Delivery Charges: Calculated dynamically at checkout based on order tonnage and distance from fulfillment hub.`
  },
  {
    id: "kb-ret-02",
    title: "IntriHub Return, Replacement & Refund Policy",
    category: "POLICIES",
    version: "2.1",
    status: "APPROVED",
    approvedBy: "Legal & Customer Care",
    approvedAt: "2026-08-20",
    tags: ["returns", "refunds", "cancellations", "replacement", "broken"],
    highlights: [
      "Returns accepted within 7 days of delivery for unopened boxes/materials in original condition.",
      "Damaged in transit / defective items must be reported within 48 hours with photographic evidence.",
      "Custom-cut items (e.g. customized electrical wires, custom cut glass/pipes) are non-returnable unless defective.",
      "Refunds are processed within 5-7 business days to the original payment source after warehouse physical inspection.",
      "Strict constraint: Agents and AI must NEVER promise immediate uninspected refunds without warehouse verification."
    ],
    content: `IntriHub Return & Refund Policy (v2.1):
1. Eligibility Window: 7 days from the delivery timestamp for unused, undamaged construction materials in factory packaging.
2. Transit Damage: Any breakage (e.g. cracked tiles, dented fixtures) must be reported within 48 hours of offloading with clear photos.
3. Exclusions: Tinted paint batches, custom cut cables or pipes, and opened chemical bags (adhesives, grouts) cannot be returned.
4. Refund Processing: Refunds require physical gate inspection at IntriHub fulfillment depot. Once cleared, refund initiates within 5-7 banking days.`
  },
  {
    id: "kb-pay-03",
    title: "IntriHub Payment Modes & Commercial Billing",
    category: "POLICIES",
    version: "2.0",
    status: "APPROVED",
    approvedBy: "Finance Director",
    approvedAt: "2026-07-10",
    tags: ["payment", "razorpay", "upi", "gst", "invoice", "credit", "commercial"],
    highlights: [
      "Supported payment modes: UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and NEFT/RTGS for high-volume B2B orders.",
      "GST Input Tax Credit (ITC) invoices are issued for all registered business customers (B2B).",
      "Cash on Delivery (COD) is available only for orders under ₹10,000 in selected Bangalore zones.",
      "Payment failure protocol: If money was debited but order shows pending, banking gateway auto-reconciles within 24 to 48 hours."
    ],
    content: `IntriHub Payment & Invoicing Terms (v2.0):
1. Gateway: Powered by Razorpay secure 256-bit SSL infrastructure.
2. Commercial Invoicing: B2B customers must provide 15-digit GSTIN at checkout or during quotation approval to claim Input Tax Credit (ITC).
3. Failed Transactions: If customer's bank debits amount but no order confirmation generates, advise customer to share UPI UTR or payment reference ID. The accounts team reconciles it inside 24 hours.`
  },
  {
    id: "kb-cat-04",
    title: "Product Catalog & Electrical/Plumbing Guidelines",
    category: "PRODUCTS",
    version: "1.8",
    status: "APPROVED",
    approvedBy: "Catalog Lead",
    approvedAt: "2026-09-01",
    tags: ["pvc pipe", "electrical", "plumbing", "conduit", "finolex", "astral", "supreme", "lights"],
    highlights: [
      "20mm & 25mm PVC Conduit Pipes: Heavy duty, ISI certified, available in bundles of 25/50/100 pieces.",
      "Top plumbing brands stocked: Astral, Supreme, Ashirvad, Finolex.",
      "Commercial lighting: LED panel lights, COB spotlights, floodlights available with 2-year warranty.",
      "Live price and current inventory must always be checked via live catalog system, never memorized statically."
    ],
    content: `IntriHub Construction Catalog Specifications (v1.8):
1. Electrical Conduit Pipes: 20mm & 25mm Medium & Heavy-duty rigid PVC electrical conduit pipes in standard 3-meter lengths. Fire-retardant and shock-proof.
2. Packaging: Typically dispatched in bundled packs (25, 50, or 100 lengths).
3. Bulk Quotations: Orders exceeding 100 pieces qualify for contractor tiered pricing upon location verification.
4. Note on Pricing: Product prices fluctuate with raw material indices (PVC resins/copper). Agents must reference live IntriHub DB for current per-piece rates.`
  },
  {
    id: "kb-sop-05",
    title: "Customer Support Standard Operating Procedure (SOP)",
    category: "SOP",
    version: "3.0",
    status: "APPROVED",
    approvedBy: "Support VP",
    approvedAt: "2026-09-18",
    tags: ["sop", "escalation", "tone", "internal notes", "discounts"],
    highlights: [
      "Rule 1: Never invent unauthorized discounts or guarantee arrival times without dispatch slot confirmation.",
      "Rule 2: When location is unknown, always politely ask for delivery locality or pin code first.",
      "Rule 3: For competitor comparisons (e.g. Amazon, local dealers), state that IntriHub specializes directly in bulk construction supplies with GST compliance and on-site delivery, without bashing competitors.",
      "Rule 4: Internal notes with @mentions should be used when consulting warehouse, sales, or accounts before confirming custom quotations."
    ],
    content: `IntriHub Support Operating Procedure (v3.0):
1. Tone Standards: Courteous, professional, responsive, and direct.
2. Escalation Paths:
   - Bulk pricing (>₹50,000) -> Assign to Sales Team.
   - Payment disputes / double charge -> Assign to Accounts Team.
   - Delay in delivery beyond 48 hours -> Assign to Logistics Team.
3. Multi-language Etiquette: Reply in the customer's preferred or detected language, maintaining professional accuracy.`
  }
];
