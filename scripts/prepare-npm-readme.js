import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const npmReadmePath = path.join(rootDir, "npm.README.md");
const readmePath = path.join(rootDir, "README.md");
const backupPath = path.join(rootDir, ".README.github.bak");

if (fs.existsSync(npmReadmePath)) {
  fs.copyFileSync(readmePath, backupPath);
  fs.copyFileSync(npmReadmePath, readmePath);
  console.log("📦 [prepublishOnly] Swapped README.md with consumer npm.README.md");
}
