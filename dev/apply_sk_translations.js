const fs = require('fs');

const cardLabel = process.argv[2];
const translationsFile = process.argv[3];

if (!cardLabel || !translationsFile) {
  console.error('Usage: node apply_sk_translations.js <cardLabel> <translations.json>');
  process.exit(1);
}

const jsonPath = '/Users/erikwoodworth/Coding/bloomberg-cities-dashboard/dev/bratislava.sk.json';
const skTranslations = JSON.parse(fs.readFileSync(translationsFile, 'utf8'));

const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

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

let updated = 0;
let missing = 0;
for (const id of Object.keys(card.manifest)) {
  if (skTranslations[id]) {
    card.manifest[id] = skTranslations[id];
    updated++;
  } else {
    console.warn(`⚠️  No translation for id=${id} ("${card.manifest[id]}")`);
    missing++;
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
console.log(`✅ Updated ${updated} entries, ${missing} missing translations.`);
