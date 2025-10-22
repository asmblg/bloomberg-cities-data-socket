// generate-jsons.js
require('dotenv').config();

const fs = require('fs');
const csv = require('csv-parser');
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---- Config ----
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 80);
const CSV_SEPARATOR = process.env.CSV_SEPARATOR || ','; // set to ";" if needed

// ---- Helpers ----
const normalizeHeader = (h) =>
  String(h).toLowerCase().replace(/\ufeff/g, '').trim().replace(/\s+/g, '_');

function detectKeys(headers) {
  const idCandidates = [
    'occ_id', 'id', 'code', 'occupation_code', 'soc_code', 'isco_code'
  ];
  const nameCandidates = [
    'occ_name', 'name', 'occupation_name', 'occupation', 'occupation_title', 'job_title', 'title', 'label'
  ];
  const idKey = idCandidates.find(k => headers.includes(k));
  const nameKey = nameCandidates.find(k => headers.includes(k));
  return { idKey, nameKey };
}

function chunk(arr, size) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, (i + 1) * size)
  );
}

// Translate a batch of names
async function translateBatch(names) {
  const prompt = `
Translate the following occupation titles into European Portuguese (pt-PT).
Return ONLY a JSON object where each key is the exact English title and the value is the translation.
No comments, no code fences, no extra text.

${JSON.stringify(names, null, 2)}
`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a professional translator into European Portuguese (pt-PT) only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0,
  });

  let jsonText = response.choices[0].message.content.trim();

  // Ensure valid JSON (sometimes models wrap in ```json)
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json|```/g, '').trim();
  }

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error('❌ JSON parse error. Raw response:\n', jsonText);
    throw err;
  }
}

async function processCSV(filePath) {
  const rows = [];

  // Step 1: Read CSV (normalize headers)
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({
        separator: CSV_SEPARATOR,
        mapHeaders: ({ header }) => normalizeHeader(header),
      }))
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  if (!rows.length) {
    console.error('❌ CSV appears empty.');
    process.exit(1);
  }

  const headers = Object.keys(rows[0]);
  const { idKey, nameKey } = detectKeys(headers);

  if (!idKey || !nameKey) {
    console.error('❌ Could not find id/name columns.');
    console.error('Detected headers:', headers);
    console.error('Looking for any of:');
    console.error('- id: occ_id | id | code | occupation_code | soc_code | isco_code');
    console.error('- name: occ_name | name | occupation_name | occupation | occupation_title | job_title | title | label');
    process.exit(1);
  }

  console.log(`🔎 Using idField="${idKey}", nameField="${nameKey}"`);

  // Step 2: Build English map + collect unique titles
  const enMap = {};
  const uniqueTitles = [];
  const seen = new Set();
  let missingId = 0, missingName = 0;

  for (const row of rows) {
    const id = String(row[idKey] ?? '').trim();
    const name = String(row[nameKey] ?? '').trim();

    if (!id) { missingId++; continue; }
    if (!name) { missingName++; continue; }

    enMap[id] = name;
    if (!seen.has(name)) {
      seen.add(name);
      uniqueTitles.push(name);
    }
  }

  if (missingId || missingName) {
    console.warn(`⚠️ Skipped rows — missing id: ${missingId}, missing name: ${missingName}`);
  }

  // Step 3: Batch translations on unique titles
  const enToPt = {};
  const batches = chunk(uniqueTitles, BATCH_SIZE);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`🔄 Translating batch ${i + 1}/${batches.length} (${batch.length} titles)...`);
    const translations = await translateBatch(batch);
    Object.assign(enToPt, translations);
  }

  // Step 4: Build PT map by ID using the EN->PT dictionary
  const ptMap = {};
  for (const [id, english] of Object.entries(enMap)) {
    ptMap[id] = enToPt[english] ?? english; // fallback to EN if a title wasn’t returned
  }

  // Step 5: Write JSON files
  fs.writeFileSync('names_en.json', JSON.stringify(enMap, null, 2));
  fs.writeFileSync('names_pt.json', JSON.stringify(ptMap, null, 2));
  console.log('✅ Done! Files: names_en.json & names_pt.json');
}

// Run with: node generate-jsons.js input.csv
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('❌ Please provide a CSV file: node generate-jsons.js input.csv');
  process.exit(1);
}

processCSV(inputFile).catch((err) => {
  // Helpful diagnostics for 429/insufficient_quota vs parse issues
  if (err?.error?.code === 'insufficient_quota') {
    console.error('❌ OpenAI API says: insufficient_quota. Add billing on platform.openai.com and retry.');
  } else {
    console.error('❌ Failed:', err?.message || err);
  }
  process.exit(1);
});


// // generate-jsons.js
// require('dotenv').config();

// const fs = require('fs');
// const csv = require('csv-parser');
// const OpenAI = require('openai');

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Translate a batch of names
// async function translateBatch(names) {
//   const prompt = `
// Translate the following occupation titles into European Portuguese.
// Return ONLY a JSON object where each key is the English title and the value is the translation.
// Do not add explanations.

// ${JSON.stringify(names, null, 2)}
// `;

//   const response = await client.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       { role: "system", content: "You are a professional translator into European Portuguese." },
//       { role: "user", content: prompt }
//     ],
//     temperature: 0,
//   });

//   let jsonText = response.choices[0].message.content.trim();

//   // Ensure valid JSON (sometimes the model adds formatting)
//   try {
//     if (jsonText.startsWith("```")) {
//       jsonText = jsonText.replace(/```json|```/g, "").trim();
//     }
//     return JSON.parse(jsonText);
//   } catch (err) {
//     console.error("❌ JSON parse error. Raw response:\n", jsonText);
//     throw err;
//   }
// }

// async function processCSV(filePath, idField = 'OCC_ID', nameField = 'OCC_NAME') {
//   const enMap = {};
//   const ptMap = {};

//   const rows = [];

//   // Step 1: Read CSV
//   await new Promise((resolve, reject) => {
//     fs.createReadStream(filePath)
//       .pipe(csv())
//       .on('data', (row) => rows.push(row))
//       .on('end', resolve)
//       .on('error', reject);
//   });

//   // console.log(rows);

//   // Step 2: Build English map
//   for (const row of rows) {
//     enMap[row[idField]] = row[nameField];
//   }

//   // console.log(enMap);

//   // Step 3: Batch translations
//   const names = rows.map(r => r[nameField]);
//   const batchSize = 50; // tweak if needed
//   for (let i = 0; i < names.length; i += batchSize) {
//     const batch = names.slice(i, i + batchSize);
//     console.log(`🔄 Translating batch ${i / batchSize + 1}...`);
//     const translations = await translateBatch(batch);

//     // console.log(translations);

//     for (const row of rows) {
//       if (translations[row[nameField]]) {
//         ptMap[`${row[idField]}`] = translations[row[nameField]];
//       }
//     }
//   }

//   //  console.log(ptMap);

//   // Step 4: Write JSON files
//   fs.writeFileSync("names_en.json", JSON.stringify(enMap, null, 2));
//   fs.writeFileSync("names_pt.json", JSON.stringify(ptMap, null, 2));

//   console.log("✅ Done! Files: names_en.json & names_pt.json");
// }

// // Run with: node generate-jsons.js input.csv
// const inputFile = process.argv[2];
// if (!inputFile) {
//   console.error("❌ Please provide a CSV file: node generate-jsons.js input.csv");
//   process.exit(1);
// }

// processCSV(inputFile);
