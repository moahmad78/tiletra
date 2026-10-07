import { redirect } from "next/navigation";

export default function CpoRecycleBinPage() {
  redirect("/cpo/catalog?status=recycle_bin");
}
