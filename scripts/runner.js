/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

const target = process.argv[2];
if (!target) {
  console.error("Veuillez spécifier le script à exécuter (ex: node scripts/runner.js scripts/verify-data-integrity.ts)");
  process.exit(1);
}

const jiti = require("jiti")(path.resolve(__dirname, "..", "package.json"), {
  alias: { "@": path.resolve(__dirname, "..", "src") },
});

jiti(path.resolve(process.cwd(), target));
