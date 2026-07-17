/**
 * Kickline sync runner — Vercel/CI uses committed data/kickLines/master.json.
 * Local dev with 킥문장_마스터DB.xlsx + Python openpyxl regenerates master.json.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const masterJson = path.join(root, "data", "kickLines", "master.json");
const xlsxPath = path.join(root, "킥문장_마스터DB.xlsx");
const pyScript = path.join(root, "scripts", "sync_kicklines_from_xlsx.py");

function findPython() {
  for (const cmd of ["python3", "python"]) {
    const probe = spawnSync(cmd, ["--version"], { encoding: "utf8" });
    if (probe.status === 0) return cmd;
  }
  return null;
}

function hasOpenpyxl(python) {
  const probe = spawnSync(python, ["-c", "import openpyxl"], {
    encoding: "utf8",
    stdio: "pipe",
  });
  return probe.status === 0;
}

function useCommittedMaster(reason) {
  if (!existsSync(masterJson)) return false;
  if (!process.env.VERCEL && !process.env.CI) {
    console.log(`skip: ${reason}, using ${path.relative(root, masterJson)}`);
  }
  return true;
}

if (process.env.VERCEL === "1") {
  if (existsSync(masterJson)) process.exit(0);
  console.error("sync:kicklines failed: master.json missing on Vercel");
  process.exit(1);
}

if (!existsSync(xlsxPath)) {
  if (useCommittedMaster(`${path.basename(xlsxPath)} not found`)) process.exit(0);
  console.error(`sync:kicklines failed: missing ${path.basename(xlsxPath)} and master.json`);
  process.exit(1);
}

const python = findPython();
if (!python) {
  if (useCommittedMaster("python not found")) process.exit(0);
  console.error("sync:kicklines failed: python not found and no committed master.json");
  process.exit(1);
}

if (!hasOpenpyxl(python)) {
  if (useCommittedMaster("openpyxl not installed")) process.exit(0);
  console.error("sync:kicklines failed: openpyxl not installed and no committed master.json");
  process.exit(1);
}

const result = spawnSync(python, [pyScript], { stdio: "inherit", cwd: root });
if (result.status === 0) process.exit(0);

if (useCommittedMaster(`kickline sync failed (exit ${result.status ?? 1})`)) {
  process.exit(0);
}

process.exit(result.status ?? 1);
