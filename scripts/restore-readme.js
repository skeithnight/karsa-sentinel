import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const readmePath = path.join(rootDir, "README.md");
const backupPath = path.join(rootDir, ".README.github.bak");

if (fs.existsSync(backupPath)) {
  fs.copyFileSync(backupPath, readmePath);
  fs.unlinkSync(backupPath);
  console.log("🔄 [postpublish] Restored original GitHub README.md");
}
