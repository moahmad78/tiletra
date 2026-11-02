import { permanentRedirect } from "next/navigation";

// Old /designs route permanently redirects to /shop
export default function DesignsPage() {
  permanentRedirect("/shop");
}
