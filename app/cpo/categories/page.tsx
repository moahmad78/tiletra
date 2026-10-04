import CpoPhasePlaceholder from "@/components/cpo/CpoPhasePlaceholder";

export default function CpoCategoriesPage() {
  return (
    <CpoPhasePlaceholder
      title="Category, Brand & Attribute Manager"
      phase={2}
      description="Taxonomy governance across tiles, sanitaryware, fittings, and building materials."
      features={[
        "Hierarchical category and subcategory tree management with slug enforcement",
        "Brand registry and authorized supplier mapping",
        "Attribute templates (thickness, look, grade, finish, water absorption, PEI rating)",
        "Import & export catalog taxonomies across suppliers",
      ]}
    />
  );
}
