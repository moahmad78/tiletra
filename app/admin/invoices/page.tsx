import TaxInvoiceGenerator from "@/components/admin/TaxInvoiceGenerator";

export const metadata = {
  title: "Tax Invoice Generator | IntriHub Admin",
  description: "Official sequential tax invoice generator for online and manual orders",
};

export default function AdminInvoicePage() {
  return <TaxInvoiceGenerator backHref="/admin/orders" backLabel="Orders" />;
}
