/**
 * Compare local supabase/migrations/*.sql with remote schema_migrations.
 * Uses Supabase Management API (SUPABASE_ACCESS_TOKEN in .env.local).
 *
 * Usage: npx tsx scripts/verify_supabase_migrations.mts
 */
import { readdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");

interface RemoteMigration {
  version: string;
  name: string;
}

function parseEnvLocal(key: string): string | null {
  try {
    const raw = readFileSync(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const k = trimmed.slice(0, eq).trim();
      if (k === key) return trimmed.slice(eq + 1).trim();
    }
  } catch {
    return null;
  }
  return null;
}

function projectRefFromUrl(url: string): string | null {
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return m?.[1] ?? null;
}

async function listLocalMigrations(): Promise<
  { version: string; name: string; file: string }[]
> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql"));
  return files
    .map((file) => {
      const m = file.match(/^(\d+)_(.+)\.sql$/);
      if (!m) return null;
      return { version: m[1], name: m[2], file };
    })
    .filter((x): x is { version: string; name: string; file: string } => x !== null)
    .sort((a, b) => a.version.localeCompare(b.version));
}

async function fetchRemoteMigrations(
  token: string,
  ref: string
): Promise<RemoteMigration[]> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/database/migrations`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as RemoteMigration[];
}

async function main() {
  const token = parseEnvLocal("SUPABASE_ACCESS_TOKEN");
  const url = parseEnvLocal("NEXT_PUBLIC_SUPABASE_URL");
  if (!token || !url) {
    console.error("❌ .env.local에 SUPABASE_ACCESS_TOKEN, NEXT_PUBLIC_SUPABASE_URL 필요");
    process.exit(1);
  }

  const ref = projectRefFromUrl(url);
  if (!ref) {
    console.error("❌ Supabase project ref를 URL에서 찾지 못했습니다.");
    process.exit(1);
  }

  const local = await listLocalMigrations();
  const remote = await fetchRemoteMigrations(token, ref);

  const remoteByVersion = new Map(remote.map((r) => [r.version, r]));
  let ok = true;

  console.log(`Project: ${ref}`);
  console.log(`Local migrations: ${local.length}, Remote: ${remote.length}\n`);

  for (const loc of local) {
    const rem = remoteByVersion.get(loc.version);
    if (!rem) {
      console.log(`❌ ${loc.file} — remote에 version ${loc.version} 없음`);
      ok = false;
      continue;
    }
    if (rem.name !== loc.name) {
      console.log(
        `❌ ${loc.file} — name 불일치 (local=${loc.name}, remote=${rem.name})`
      );
      ok = false;
      continue;
    }
    console.log(`✅ ${loc.version} ${loc.name}`);
  }

  for (const rem of remote) {
    if (!local.some((l) => l.version === rem.version)) {
      console.log(`⚠️  remote only: ${rem.version} ${rem.name}`);
      ok = false;
    }
  }

  if (!ok) {
    console.log("\n❌ 로컬/원격 마이그레이션 히스토리 불일치");
    process.exit(1);
  }

  console.log("\n✅ 로컬 파일명(003–008)과 원격 schema_migrations가 일치합니다.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
