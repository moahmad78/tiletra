import CpoPhasePlaceholder from "@/components/cpo/CpoPhasePlaceholder";

export default function CpoSeoPage() {
  return (
    <CpoPhasePlaceholder
      title="Catalog SEO & Discoverability Suite"
      phase={3}
      description="Meta tags, schema markup, product title optimization, and missing SEO diagnostics."
      features={[
        "Audit products with missing meta titles, descriptions, and primary images",
        "Automated JSON-LD product & review schema generation",
        "Canonical slug management and 301 redirect validation",
        "Search engine & AI Answer Engine Optimization (SearchFIT AEO)",
      ]}
    />
  );
}
