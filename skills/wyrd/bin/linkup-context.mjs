#!/usr/bin/env node
// Fetch cited, current context for one verified market question.
// Usage: node linkup-context.mjs "Will ...?"

const key = process.env.LINKUP_API_KEY;
const question = process.argv.slice(2).join(" ").trim();

if (!key) {
  console.error("LINKUP_API_KEY is not set");
  process.exit(1);
}
if (!question) {
  console.error("pass a market question");
  process.exit(1);
}

const response = await fetch("https://api.linkup.so/v1/search", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    q: `Find the freshest reliable news or public internet context relevant to this prediction-market question: ${question}`,
    depth: "fast",
    outputType: "searchResults",
    maxResults: 5,
  }),
});

if (!response.ok) {
  console.error(`Linkup returned ${response.status}`);
  process.exit(1);
}

console.log(JSON.stringify(await response.json(), null, 2));
