export interface FAQCategory {
  id: string;
  name: string;
}

export interface FAQItem {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
}

export const INTRIHUB_FAQS: FAQItem[] = [
  // ── Delivery & Timing ──
  {
    id: "del-1",
    categoryId: "delivery",
    question: "How does 60-minute direct site delivery work in Bengaluru?",
    answer: "We operate dedicated micro-dark stores and direct tier-1 manufacturer fulfillment points positioned across North, South, East, and Central Bengaluru. Once an order is confirmed, our dispatch system assigns a specialized freight vehicle with live GPS tracking directly to your construction or renovation site.",
  },
  {
    id: "del-2",
    categoryId: "delivery",
    question: "What is your delivery radius and do you deliver outside Bengaluru?",
    answer: "Our express 60-minute service covers all major zones in Bengaluru (Begur, Whitefield, HSR Layout, Indiranagar, Electronic City, Yelahanka, Kanakapura Road, etc.). For Mysuru, Hyderabad, Chennai, and other cities across India, we dispatch heavy freight consignments arriving within 24 to 72 hours.",
  },
  {
    id: "del-3",
    categoryId: "delivery",
    question: "Is delivery free, or are there minimum order requirements?",
    answer: "Standard site delivery is 100% FREE for all orders above ₹15,000. For orders below this threshold, a flat weight-based logistics fee starting from ₹99 applies. Free delivery is automatically applied in your cart upon checkout.",
  },
  {
    id: "del-4",
    categoryId: "delivery",
    question: "Do you unload materials at the site?",
    answer: "Yes, our drivers drop off materials at curbside or ground floor staging areas. If your project requires manual labor to carry tiles or plywood to upper floors without elevator access, our dispatch team can coordinate on-site unloading labor upon request.",
  },

  // ── Ordering & Payment ──
  {
    id: "ord-1",
    categoryId: "orders",
    question: "How does the Smart Calculator on product pages work?",
    answer: "Our unit-aware calculator lives right on every product page. Simply input your room dimensions (length and width in feet or meters), and it instantly calculates the exact number of boxes, square footage, and pieces required, automatically applying a standard 10% cutting and wastage margin.",
  },
  {
    id: "ord-2",
    categoryId: "orders",
    question: "What payment methods are supported on IntriHub?",
    answer: "We accept all major payment methods via PCI-DSS 256-bit encrypted Razorpay: UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD) for verified site orders up to eligible limits.",
  },
  {
    id: "ord-3",
    categoryId: "orders",
    question: "Can I get a GST invoice for commercial input tax credit (ITC)?",
    answer: "Yes. During checkout or in your Account profile, enter your company name and 15-digit GSTIN. We issue automated B2B GST tax invoices with 100% valid Input Tax Credit (ITC) eligibility.",
  },

  // ── Returns & Breakage ──
  {
    id: "ret-1",
    categoryId: "returns",
    question: "What if tiles or delicate sanitaryware arrive broken or damaged?",
    answer: "We offer an unconditional Damage Protection Guarantee. Simply take clear photos or a short video of the damaged carton or tiles and WhatsApp them to our priority resolution desk at +91 70901 20211 within 48 hours of delivery. We immediately dispatch free priority replacement crates.",
  },
  {
    id: "ret-2",
    categoryId: "returns",
    question: "What is the return window for unused boxes?",
    answer: "Unopened, full boxes in their original manufacturer packaging can be returned within 7 calendar days of delivery. For site safety and batch control, opened or partially used boxes cannot be accepted.",
  },
  {
    id: "ret-3",
    categoryId: "returns",
    question: "How quickly are refunds processed?",
    answer: "Once returned boxes are received and verified at our warehouse, refunds are initiated back to your original payment mode (UPI, card, bank transfer) within 3 to 5 business days.",
  },

  // ── Bulk & Contractor Desk ──
  {
    id: "blk-1",
    categoryId: "bulk",
    question: "Do contractors, interior designers, and architects get trade pricing?",
    answer: "Yes. We offer tiered bulk trade discounts on commercial volume orders. You can connect with our Trade Desk via WhatsApp (+91 70901 20211) or register for a Contractor Account to receive dedicated relationship management and custom quotes.",
  },
  {
    id: "blk-2",
    categoryId: "bulk",
    question: "Can I request physical tile or surface samples before placing a large order?",
    answer: "Yes! We provide free sample pieces and catalog swatches for architects, interior designers, and builders in Bengaluru. Book a free site consultation or sample request via our Helpline.",
  },

  // ── Vendor Onboarding ──
  {
    id: "ven-1",
    categoryId: "vendor",
    question: "How can manufacturers and distributors sell on IntriHub?",
    answer: "If you manufacture or distribute certified tiles, electrical, plumbing, sanitary, plywood, or hardware supplies, you can apply directly at intrihub.com/vendor/apply. Our vendor onboarding team will review your catalog and verify your warehouse within 24 to 48 hours.",
  },
  {
    id: "ven-2",
    categoryId: "vendor",
    question: "What are the payout terms for vendors?",
    answer: "Vendor payouts are processed on an automated weekly settlement cycle directly to your verified business bank account with detailed itemized remittance statements.",
  },
];
