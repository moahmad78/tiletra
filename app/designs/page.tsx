import { redirect } from "next/navigation";

// Old /designs route now redirects to /shop
export default function DesignsPage() {
  redirect("/shop");
}
