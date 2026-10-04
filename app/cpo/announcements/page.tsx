import CpoPhasePlaceholder from "@/components/cpo/CpoPhasePlaceholder";

export default function CpoAnnouncementsPage() {
  return (
    <CpoPhasePlaceholder
      title="Vendor Broadcasts & Announcements"
      phase={2}
      description="Direct operational announcements, policy updates, and holiday schedule notices to suppliers."
      features={[
        "Targeted broadcasts to all vendors or specific product categories",
        "Multi-channel dispatch (In-App notifications, WhatsApp partner templates, Email alerts)",
        "Read receipt tracking and vendor acknowledgment audit",
        "Seasonal holiday warehouse closure notifications",
      ]}
    />
  );
}
