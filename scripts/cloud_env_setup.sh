#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Cursor Cloud 전용 개발 환경 부트스트랩 — 로컬 PC에서는 실행할 필요 없음.
#
# 하는 일 (모두 아이덤포턴트):
#  1. .env.local 생성 — 로컬 Supabase 기본 키 + DEEPSEEK_API_KEY 주입
#     (대시보드 시크릿이 '딥시크 api' 같은 한글 이름이어도 자동 매핑)
#  2. Docker 설치·기동 (vfs 스토리지 드라이버 — 중첩 VM에서 overlayfs 불가)
#  3. iptables-legacy FORWARD ACCEPT — 컨테이너 간 통신 차단 해제
#  4. 로컬 Supabase 기동 — schema.sql을 000 마이그레이션으로 선적용,
#     realtime/studio/storage 등 무거운 서비스는 로컬 한정 비활성
#     (config.toml 변경은 start 후 원복 — 커밋 오염 방지)
#  5. anon/authenticated 역할 테이블 GRANT (schema.sql은 대시보드 실행 기준이라 없음)
#  6. 테스트 계정 생성: tester@pickme.local / test1234!
# ─────────────────────────────────────────────────────────────
set -u

cd "$(dirname "$0")/.."

log() { echo "[cloud-env] $*"; }

# Cursor Cloud 환경에서만 동작
if [ -z "${CURSOR_AGENT:-}" ] && [ -z "${CLOUD_AGENT_INJECTED_SECRET_NAMES:-}" ]; then
  log "Cursor Cloud 환경이 아니므로 아무것도 하지 않습니다."
  exit 0
fi

# supabase local 기본 데모 키 (공개된 로컬 개발용 고정값 — 시크릿 아님)
LOCAL_SUPABASE_URL="http://127.0.0.1:54321"
LOCAL_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
LOCAL_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# ── 1. .env.local ────────────────────────────────────────────
ensure_env_local() {
  if [ -f .env.local ]; then
    log ".env.local 이미 존재 — 건너뜀"
    return 0
  fi
  # 한글 이름 시크릿 폴백 매핑 (대시보드에서 표준 이름으로 바꾸면 자동으로 그쪽 우선)
  local deepseek_key tavily_key
  deepseek_key="${DEEPSEEK_API_KEY:-$(printenv '딥시크 api' 2>/dev/null || true)}"
  tavily_key="${TAVILY_API_KEY:-$(printenv '타빌리 API 플랫폼' 2>/dev/null || true)}"

  {
    echo "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-$LOCAL_SUPABASE_URL}"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-$LOCAL_ANON_KEY}"
    echo "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-$LOCAL_SERVICE_KEY}"
    echo "NEXT_PUBLIC_APP_URL=http://localhost:3000"
    [ -n "$deepseek_key" ] && echo "DEEPSEEK_API_KEY=$deepseek_key"
    [ -n "$tavily_key" ] && echo "TAVILY_API_KEY=$tavily_key"
  } > .env.local
  log ".env.local 생성 완료 (DEEPSEEK_API_KEY: $([ -n "$deepseek_key" ] && echo 있음 || echo 없음))"
}

# ── 2·3. Docker ──────────────────────────────────────────────
ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    log "docker 설치 중..."
    sudo apt-get update -qq && sudo apt-get install -y -qq docker.io || {
      log "docker 설치 실패"; return 1; }
  fi
  if [ ! -f /etc/docker/daemon.json ]; then
    echo '{"storage-driver":"vfs"}' | sudo tee /etc/docker/daemon.json >/dev/null
  fi
  if ! sudo docker info >/dev/null 2>&1; then
    sudo systemctl start docker 2>/dev/null \
      || sudo service docker start 2>/dev/null \
      || sudo sh -c 'nohup dockerd >/var/log/dockerd.log 2>&1 &'
  fi
  local i
  for i in $(seq 1 30); do
    sudo docker info >/dev/null 2>&1 && break
    sleep 2
  done
  sudo docker info >/dev/null 2>&1 || { log "docker 데몬 기동 실패"; return 1; }
  # 컨테이너 간 통신(레거시 FORWARD DROP) 해제 + CLI가 sudo 없이 쓰도록
  command -v iptables-legacy >/dev/null 2>&1 && sudo iptables-legacy -P FORWARD ACCEPT || true
  [ -S /var/run/docker.sock ] && sudo chmod 666 /var/run/docker.sock || true
  log "docker 준비 완료"
}

# ── 4. 로컬 Supabase ─────────────────────────────────────────
CONFIG_MARKER="cloud-local-overrides"

append_local_config() {
  grep -q "$CONFIG_MARKER" supabase/config.toml && return 0
  cat >> supabase/config.toml << 'EOF'

# ── cloud-local-overrides: Cursor Cloud 테스트 전용 — 커밋 금지 (start 후 자동 원복) ──
[realtime]
enabled = false

[studio]
enabled = false

[storage]
enabled = false

[analytics]
enabled = false

[edge_runtime]
enabled = false
EOF
}

restore_local_files() {
  git checkout -- supabase/config.toml 2>/dev/null || true
  rm -f supabase/migrations/000_schema.sql
}

supabase_running() {
  curl -s -o /dev/null --max-time 3 "$LOCAL_SUPABASE_URL/rest/v1/" 2>/dev/null
}

start_supabase() {
  if supabase_running; then
    log "로컬 Supabase 이미 실행 중 — 건너뜀"
    return 0
  fi
  # 기본 테이블(profiles 등)은 schema.sql에 있고 마이그레이션은 003부터 시작하므로
  # 로컬 한정으로 000 마이그레이션으로 선적용한다 (커밋 금지 — 원격 마이그레이션 싱크 깨짐)
  cp supabase/schema.sql supabase/migrations/000_schema.sql
  append_local_config
  log "npx supabase start 실행 (첫 실행은 이미지 풀 때문에 5~10분 소요)..."
  yes 2>/dev/null | npx -y supabase start
  local rc=$?
  restore_local_files
  if [ $rc -ne 0 ] || ! supabase_running; then
    log "supabase start 실패 (exit $rc)"
    return 1
  fi
  log "로컬 Supabase 기동 완료"
}

# ── 5. 테이블 GRANT ──────────────────────────────────────────
db_container() {
  sudo docker ps --filter "name=supabase_db_" --format '{{.Names}}' | head -1
}

apply_grants() {
  local db
  db="$(db_container)"
  [ -z "$db" ] && { log "db 컨테이너 없음 — GRANT 건너뜀"; return 1; }
  sudo docker exec "$db" psql -U postgres -d postgres -q -c "
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  " && log "테이블 GRANT 적용 완료"
}

# ── 6. 테스트 계정 ───────────────────────────────────────────
ensure_test_user() {
  local email="tester@pickme.local"
  curl -s -X POST "$LOCAL_SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $LOCAL_SERVICE_KEY" -H "Authorization: Bearer $LOCAL_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"test1234!\",\"email_confirm\":true,\"user_metadata\":{\"display_name\":\"테스터\",\"gender\":\"male\",\"birth_date\":\"1990-05-10\"}}" \
    >/dev/null 2>&1 || true
  local db
  db="$(db_container)"
  [ -n "$db" ] && sudo docker exec "$db" psql -U postgres -d postgres -q -c "
    update public.profiles p
       set display_name = coalesce(nullif(p.display_name, ''), '테스터'),
           gender       = coalesce(p.gender, 'male'),
           birth_date   = coalesce(p.birth_date, '1990-05-10')
      from auth.users u
     where u.id = p.id and u.email = '$email';
  " >/dev/null 2>&1
  log "테스트 계정 준비: $email / test1234!"
}

# ── 실행 ─────────────────────────────────────────────────────
ensure_env_local
if ensure_docker; then
  if start_supabase; then
    apply_grants
    ensure_test_user
  fi
fi

log "완료. dev 서버: npm run dev → http://localhost:3000 (로그인: tester@pickme.local / test1234!)"
exit 0
