async function main() {
  try {
    const res = await fetch("http://localhost:8081");
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("HTML length:", text.length);
    console.log("Preview:\n", text.slice(0, 300));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
main();
