const fs = require('fs');
const content = fs.readFileSync('lib/data/usps.ts', 'utf8');
const matches = [...content.matchAll(/metaDescription:\s*"([^"]+)"/g)];
let allValid = true;
matches.forEach((m, idx) => {
  const len = m[1].length;
  const valid = len >= 150 && len <= 160;
  if (!valid) allValid = false;
  console.log(`USP #${idx + 1}: length ${len} -> ${valid ? 'OK' : 'INVALID'}`);
});
console.log(`ALL VALID: ${allValid}`);
