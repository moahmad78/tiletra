import { GET } from "../app/api/uploads/[filename]/route";
import { NextRequest } from "next/server";

async function main() {
  const filename = "1000055016-1787424186312-nvwc2.webp";
  const req = new NextRequest(`http://localhost:3000/api/uploads/${filename}`);
  const res = await GET(req, { params: Promise.resolve({ filename }) });

  console.log(`Status: ${res.status}`);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
  const blob = await res.blob();
  console.log(`Body size: ${blob.size} bytes, type: ${blob.type}`);
}

main().catch(console.error);
