async function main() {
  const res = await fetch('http://127.0.0.1:3000');
  const html = await res.text();

  // Find images in DesktopBannerCarousel and Category rows
  const regex = /<img[^>]+>/g;
  let match;
  const tags = [];
  while ((match = regex.exec(html)) !== null) {
    tags.push(match[0]);
  }

  console.log(`Total images found in SSR: ${tags.length}`);
  tags.slice(0, 20).forEach((t, i) => console.log(`[${i}]`, t));
}

main().catch(console.error);
