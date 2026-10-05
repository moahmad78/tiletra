import TaxInvoiceGenerator from "@/components/admin/TaxInvoiceGenerator";

export const metadata = {
  title: "Tax Invoice Generator | IntriHub CPO",
  description: "Official sequential tax invoice generator for marketplace vendors and manual orders",
};

export default function CpoInvoicePage() {
  return <TaxInvoiceGenerator backHref="/cpo" backLabel="CPO Portal" />;
}
