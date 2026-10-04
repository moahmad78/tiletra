import CpoPhasePlaceholder from "@/components/cpo/CpoPhasePlaceholder";

export default function CpoMerchandisingPage() {
  return (
    <CpoPhasePlaceholder
      title="Storefront Merchandising & Collections"
      phase={3}
      description="Visual merchandising tools, curated collections, promotional tags, and ranking boosts."
      features={[
        "Curate homepage collections and promotional hero carousels",
        "Best-seller and Trending tag assignments across vendor catalogs",
        "Supplier search ranking boosts based on fulfillment speed and customer ratings",
        "Seasonal tile and construction material campaigns",
      ]}
    />
  );
}
