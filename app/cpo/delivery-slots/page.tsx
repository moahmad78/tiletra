import CpoPhasePlaceholder from "@/components/cpo/CpoPhasePlaceholder";

export default function CpoDeliverySlotsPage() {
  return (
    <CpoPhasePlaceholder
      title="Delivery Slot Oversight & Capacity Monitor"
      phase={3}
      description="Supplier dispatch capacity oversight, blocked delivery dates, and scheduled delivery health."
      features={[
        "Vendor-wise delivery slot definitions & capacity inspection",
        "Scheduled delivery bottleneck alerts and delayed dispatches",
        "Override vendor capacity caps during peak renovation seasons",
        "Direct integration with IntriHub scheduled-delivery dispatch engine",
      ]}
    />
  );
}
