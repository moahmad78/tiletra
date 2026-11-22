async function checkReceipts() {
  const ids = ["01a2026d-1036-7339-9e66-82eeb1ce5e34", "01a2026d-108d-7766-a1a7-4337649f3854"];
  const res = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids })
  });
  const data = await res.json();
  console.log("RECEIPTS:", JSON.stringify(data, null, 2));
}
checkReceipts().catch(console.error);
