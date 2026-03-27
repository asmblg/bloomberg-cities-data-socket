const fs = require('fs');
const path = require('path');

const cardLabel = process.argv[2];
const outputFile = process.argv[3];

if (!cardLabel || !outputFile) {
  console.error('Usage: node extract_occupations.js <cardLabel> <outputFile.csv>');
  process.exit(1);
}

const json = JSON.parse(fs.readFileSync('/Users/erikwoodworth/Coding/bloomberg-cities-dashboard/dev/bratislava.sk.json', 'utf8'));

function findCard(node) {
  if (!node || typeof node !== 'object') return null;
  if (node.label === cardLabel && node.manifest) return node;
  for (const v of Object.values(node)) {
    const r = findCard(v);
    if (r) return r;
  }
  return null;
}

const card = findCard(json);
if (!card) {
  console.error(`Card "${cardLabel}" not found`);
  process.exit(1);
}

const rows = ['occ_id,occ_name'];
for (const [id, name] of Object.entries(card.manifest)) {
  rows.push(`${id},"${name.replace(/"/g, '""')}"`);
}

fs.writeFileSync(outputFile, rows.join('\n'));
console.log(`Wrote ${Object.keys(card.manifest).length} rows to ${outputFile}`);
