const fs = require("fs");
const path = require("path");

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === "node_modules" || file === ".next" || file === ".git" || file === "urbanfix") continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else if (/\.(tsx|ts|jsx|js|json|md)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = walk(path.join(__dirname, ".."));
let totalReplacements = 0;

for (const file of allFiles) {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("unsplash.com")) {
    console.log("Replacing unsplash URLs in:", file);
    
    // Choose appropriate placeholder based on context/file
    let replaced = content;
    
    if (file.includes("category") || file.includes("Category")) {
      replaced = replaced.replace(/https?:\/\/(images|plus)\.unsplash\.com\/[a-zA-Z0-9_\-\.\?\=\&]+/g, "/placeholders/category.svg");
    } else if (file.includes("banner") || file.includes("Hero") || file.includes("Banner")) {
      replaced = replaced.replace(/https?:\/\/(images|plus)\.unsplash\.com\/[a-zA-Z0-9_\-\.\?\=\&]+/g, "/placeholders/banner.svg");
    } else {
      replaced = replaced.replace(/https?:\/\/(images|plus)\.unsplash\.com\/[a-zA-Z0-9_\-\.\?\=\&]+/g, "/placeholders/product.svg");
    }
    
    if (replaced !== content) {
      fs.writeFileSync(file, replaced, "utf8");
      totalReplacements++;
    }
  }
}

console.log(`Replaced unsplash URLs in ${totalReplacements} files.`);
