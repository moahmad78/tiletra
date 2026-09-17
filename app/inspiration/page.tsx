import { redirect } from "next/navigation";

// Legacy /inspiration route permanently redirects to canonical /shop
export default function InspirationPage() {
  redirect("/shop");
}
