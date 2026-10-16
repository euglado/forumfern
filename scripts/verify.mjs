import fs from "node:fs";
import path from "node:path";

const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const allowed = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "(MIT OR Apache-2.0)",
  "MIT OR Apache-2.0",
]);
let packages = 0,
  files = 0;
for (const [key, p] of Object.entries(lock.packages)) {
  if (!key) continue;
  packages++;
  if (
    !allowed.has(p.license) ||
    p.hasInstallScript ||
    !p.resolved?.startsWith("https://registry.npmjs.org/") ||
    !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(p.integrity ?? "")
  )
    throw Error(`Dependency review required: ${key}`);
}
const patterns = [
  /mfa\.[A-Za-z0-9_-]{60,}/,
  /\b[A-Za-z0-9_-]{23,30}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,110}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{30,}/,
  /DISCORD_TOKEN\s*=\s*[A-Za-z0-9_.-]{30,}/,
];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw Error("Unexpected symlink");
    if (entry.isDirectory()) {
      walk(file);
      continue;
    }
    if (entry.name.startsWith(".env") && entry.name !== ".env.example")
      throw Error("Remove local environment files before supply checks");
    files++;
    const source = fs.readFileSync(file, "utf8");
    if (patterns.some((p) => p.test(source)))
      throw Error(`Possible credential in ${file}`);
  }
}
walk(".");
console.log(
  `Supply checks passed: ${packages} dependency license/registry/SHA-512/no-install-script records; ${files} source credential-pattern scans.`,
);
