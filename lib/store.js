// const fs = require("fs");
// const path = require("path");

// function resolvePath(file) {
//   return path.join(__dirname, "..", "data", file);
// }

// function ensureFile(file, fallback) {
//   const p = resolvePath(file);
//   if (!fs.existsSync(p)) {
//     fs.mkdirSync(path.dirname(p), { recursive: true });
//     fs.writeFileSync(p, JSON.stringify(fallback, null, 2), "utf-8");
//   }
// }

// function readJson(file, fallback = []) {
//   ensureFile(file, fallback);
//   const raw = fs.readFileSync(resolvePath(file), "utf-8");
//   return JSON.parse(raw);
// }

// function writeJson(file, data) {
//   const p = resolvePath(file);
//   fs.mkdirSync(path.dirname(p), { recursive: true });
//   fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf-8");
// }

// module.exports = { readJson, writeJson };

const fs = require("fs");
const path = require("path");

const dataFile = (name) => path.join(process.cwd(), "data", name);

function readJson(name) {
  return JSON.parse(fs.readFileSync(dataFile(name), "utf8"));
}

function writeJson(name, data) {
  fs.writeFileSync(dataFile(name), JSON.stringify(data, null, 2), "utf8");
}

module.exports = { readJson, writeJson };

