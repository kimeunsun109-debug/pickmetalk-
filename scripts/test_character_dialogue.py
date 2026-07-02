"""캐릭터별 대화 샘플 생성·품질 체크 (DeepSeek API)"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding="utf-8")

CHARACTERS = ["yuna", "narin", "yoonseo", "eunha", "jiyu"]
TEST_MESSAGES = [
    "오늘 야근했어 너무 짜증나",
    "나 너 좋아하는 거 같아",
    "ㅇㅇ",
    "오늘 점심 뭐 먹었어?",
    "잘 자",
]

PAREN_RE = re.compile(r"[\(（][^()（）\n]+[\)）]")
QUESTION_BOT_RE = re.compile(r"(괜찮아\?|무슨 일|왜 그랬|어떻게 됐)")
TOO_LONG_RE = lambda t: len(t) > 280 or t.count("\n") > 4


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def load_character_names() -> dict[str, str]:
    data = json.loads((ROOT / "data" / "characters.json").read_text(encoding="utf-8"))
    return {c["id"]: c["name"] for c in data}


def build_minimal_system(char_id: str, name: str) -> str:
    return (
        f"너는 '{name}'({char_id})이다. 카카오톡 말풍선 대사만. 1~4문장.\n"
        "절대 금지: (웃으며), (사실 …) 등 괄호 속마음·지문. 반각·전각 괄호 모두 금지.\n"
        "고객센터·AI 언급 금지. 다른 캐릭터 언급 금지."
    )


def call_deepseek(api_key: str, base_url: str, system: str, user: str) -> str:
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.85,
        "max_tokens": 256,
    }
    req = urllib.request.Request(
        f"{base_url.rstrip('/')}/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    return body["choices"][0]["message"]["content"].strip()


def analyze(char_id: str, user: str, reply: str) -> list[str]:
    issues: list[str] = []
    if PAREN_RE.search(reply):
        issues.append("괄호 속마음/지문")
    if QUESTION_BOT_RE.search(reply):
        issues.append("취조형·습관적 질문")
    if TOO_LONG_RE(reply):
        issues.append("장문")
    if char_id == "yoonseo" and re.search(r"[!！❤️💕]", reply):
        issues.append("윤서: 감정 과잉 부호")
    if char_id == "narin" and re.search(r"(참나|네 탓|싸가지|친절할 법)", reply):
        issues.append("나린: 공격적 츤데레")
    if char_id == "eunha" and reply.count("!") >= 2:
        issues.append("은하: 느낌표 과다")
    if char_id == "jiyu" and len(reply) < 8 and user != "ㅇㅇ":
        issues.append("지유: 응답 너무 짧음")
    if user == "잘 자" and "?" in reply:
        issues.append("잘 자에 질문으로 끝")
    return issues


def main() -> None:
    env = load_env()
    api_key = env.get("DEEPSEEK_API_KEY", "")
    base_url = env.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    if not api_key:
        print("DEEPSEEK_API_KEY missing")
        sys.exit(1)

    names = load_character_names()
    all_issues: dict[str, list[str]] = {}

    for char_id in CHARACTERS:
        name = names[char_id]
        system = build_minimal_system(char_id, name)
        print(f"\n{'='*60}\n{name} ({char_id})\n{'='*60}")
        char_issues: list[str] = []

        for msg in TEST_MESSAGES:
            try:
                reply = call_deepseek(api_key, base_url, system, msg)
            except Exception as e:
                print(f"  ERR [{msg}]: {e}")
                char_issues.append(f"API 오류: {msg}")
                continue

            issues = analyze(char_id, msg, reply)
            flag = f" ⚠ {', '.join(issues)}" if issues else ""
            print(f"\n  사용자: {msg}")
            print(f"  {name}: {reply}{flag}")
            for issue in issues:
                char_issues.append(f"[{msg}] {issue}")

        all_issues[char_id] = char_issues

    print("\n\n### 요약 ###")
    for char_id in CHARACTERS:
        issues = all_issues[char_id]
        name = names[char_id]
        if not issues:
            print(f"  {name}: 특이 문제 없음 (샘플 5턴)")
        else:
            print(f"  {name}: {len(issues)}건")
            for i in issues:
                print(f"    - {i}")


if __name__ == "__main__":
    main()
