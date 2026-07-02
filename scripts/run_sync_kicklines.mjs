/**
 * Kickline sync runner — works on Vercel (Node-only) and local dev (Python + openpyxl).
 * If python is unavailable, keeps the committed data/kickLines/master.json.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const masterJson = path.join(root, "data", "kickLines", "master.json");
const pyScript = path.join(root, "scripts", "sync_kicklines_from_xlsx.py");

function findPython() {
  for (const cmd of ["python3", "python"]) {
    const probe = spawnSync(cmd, ["--version"], { encoding: "utf8" });
    if (probe.status === 0) return cmd;
  }
  return null;
}

const python = findPython();
if (!python) {
  if (existsSync(masterJson)) {
    console.log(
      `skip: python not found, using existing ${path.relative(root, masterJson)}`
    );
    process.exit(0);
  }
  console.error(
    "sync:kicklines failed: python not found and no committed master.json"
  );
  process.exit(1);
}

const result = spawnSync(python, [pyScript], { stdio: "inherit", cwd: root });
process.exit(result.status ?? 1);
