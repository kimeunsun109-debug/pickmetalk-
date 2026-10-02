"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { WebPushEnableButton } from "@/components/settings/WebPushEnableButton";
import { clearClientSessionData } from "@/lib/auth/clearClientSession";
import { FREE_DAILY_MESSAGE_LIMIT } from "@/lib/constants";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { useState } from "react";

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const IDEAL_TYPE_OPTIONS = [
  { value: "", label: "선택 안 함" },
  { value: "warm", label: "다정하고 따뜻한 타입" },
  { value: "funny", label: "유머 있고 재미있는 타입" },
  { value: "calm", label: "차분하고 든든한 타입" },
  { value: "passionate", label: "열정적이고 에너지 넘치는 타입" },
  { value: "intellectual", label: "섬세하고 깊이 있는 타입" },
];

interface CharacterState {
  character_id: string;
  affection: number;
  relationship_level: number;
  last_chat_at: string | null;
}

interface SettingsClientProps {
  email: string;
  joinedDaysAgo: number;
  characterStates: CharacterState[];
  todayMsgCount: number;
  isPremium: boolean;
  sessionDates: string[];
  initialMbti: string | null;
  initialIdealType: string | null;
}

const CHAR_NAMES: Record<string, string> = {
  yuna: "유나",
  narin: "나린",
  yoonseo: "윤서",
  eunha: "은하",
  jiyu: "지유",
};

function calcStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const days = [
    ...new Set(dates.map((d) => new Date(d).toDateString())),
  ].sort().reverse();

  let streak = 0;
  for (let i = 0; i < days.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (days[i] === expected.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function SettingsClient({
  email,
  joinedDaysAgo,
  characterStates,
  todayMsgCount,
  isPremium,
  sessionDates,
  initialMbti,
  initialIdealType,
}: SettingsClientProps) {
  const streak = calcStreak(sessionDates);
  const remaining = isPremium
    ? null
    : Math.max(0, FREE_DAILY_MESSAGE_LIMIT - todayMsgCount);
  const mostChatted = characterStates[0];

  // 계정 삭제 상태
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "loading">(
    "idle"
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 내 정보 편집 상태
  const [mbti, setMbti] = useState(initialMbti ?? "");
  const [idealType, setIdealType] = useState(initialIdealType ?? "");
  const [infoSaveState, setInfoSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [infoError, setInfoError] = useState<string | null>(null);

  const statCards = [
    {
      label: "가입 후 경과",
      value: `${joinedDaysAgo}일`,
      sub: "베타 테스터 🎉",
      color: "bg-pink-50",
    },
    {
      label: "연속 접속",
      value: `${streak}일`,
      sub: streak >= 3 ? "꾸준한 방문 👏" : "내일도 들러줘!",
      color: "bg-orange-50",
    },
    {
      label: "오늘 메시지",
      value: isPremium ? "무제한" : `${todayMsgCount}회`,
      sub: isPremium
        ? "Premium ⭐"
        : t("usage.remaining", "ko", { count: remaining ?? 0 }),
      color: "bg-blue-50",
    },
    {
      label: "주력 캐릭터",
      value: mostChatted
        ? (CHAR_NAMES[mostChatted.character_id] ?? mostChatted.character_id)
        : "없음",
      sub: mostChatted
        ? `호감도 ${mostChatted.affection}`
        : "캐릭터를 선택해봐요",
      color: "bg-purple-50",
    },
  ];

  async function handleSaveMyInfo() {
    const trimmedMbti = mbti.trim().toUpperCase();
    if (trimmedMbti && !MBTI_TYPES.includes(trimmedMbti)) {
      setInfoError("유효한 MBTI 유형을 입력해주세요 (예: ENFP)");
      return;
    }
    setInfoSaveState("saving");
    setInfoError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mbti: trimmedMbti || undefined,
          idealType: idealType || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "저장 실패");
      }
      setMbti(trimmedMbti);
      setInfoSaveState("saved");
      setTimeout(() => setInfoSaveState("idle"), 2000);
    } catch (e) {
      setInfoError(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
      setInfoSaveState("error");
    }
  }

  async function handleDeleteAccount() {
    setDeleteStep("loading");
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "삭제 실패");
      clearClientSessionData();
      window.location.href = "/login";
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "계정 삭제 중 오류가 발생했습니다."
      );
      setDeleteStep("idle");
    }
  }

  return (
    <main className="min-h-screen bg-ivory px-4 pb-24 pt-10">
      <h1 className="mb-1 text-xl font-bold text-gray-900">설정</h1>
      <p className="mb-6 text-sm text-gray-400">{email}</p>

      {!isPremium && (
        <section className="mb-6 rounded-2xl border border-pink-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">
            ⭐ Premium — {t("premium.primaryBenefit")}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            오늘 {todayMsgCount}/{FREE_DAILY_MESSAGE_LIMIT}회 사용
          </p>
          <p className="mt-2 text-xs text-gray-400">
            {t("premium.paymentPreparing")}
          </p>
        </section>
      )}

      {/* 통계 그리드 */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          베타 통계
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((c) => (
            <div key={c.label} className={`rounded-2xl ${c.color} px-4 py-4`}>
              <p className="text-[11px] text-gray-500">{c.label}</p>
              <p className="mt-0.5 text-2xl font-bold text-gray-800">
                {c.value}
              </p>
              <p className="mt-1 text-[11px] text-gray-500">{c.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 캐릭터 관계 목록 */}
      {characterStates.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            캐릭터 관계
          </h2>
          <div className="flex flex-col gap-2">
            {characterStates.map((cs) => (
              <div
                key={cs.character_id}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {CHAR_NAMES[cs.character_id] ?? cs.character_id}
                  </p>
                  <p className="text-xs text-gray-400">
                    Lv.{cs.relationship_level} &middot; 호감도 {cs.affection}
                  </p>
                </div>
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-pink-accent transition-all"
                    style={{ width: `${cs.affection}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 내 정보 */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          내 정보
        </h2>
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400 leading-relaxed">
            캐릭터가 나를 더 잘 이해할 수 있도록 정보를 알려주세요.
          </p>

          {/* MBTI */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              MBTI
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {MBTI_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMbti(mbti === type ? "" : type)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    mbti === type
                      ? "bg-pink-accent text-white"
                      : "bg-gray-100 text-gray-600 active:bg-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {mbti && !MBTI_TYPES.includes(mbti.toUpperCase()) && (
              <p className="text-xs text-red-500 mt-1">유효한 MBTI 유형을 선택해주세요</p>
            )}
          </div>

          {/* 이상형 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              선호하는 이상형
            </label>
            <select
              value={idealType}
              onChange={(e) => setIdealType(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:border-pink-300 focus:outline-none focus:ring-1 focus:ring-pink-200"
            >
              {IDEAL_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {infoError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              ⚠️ {infoError}
            </p>
          )}

          <button
            onClick={handleSaveMyInfo}
            disabled={infoSaveState === "saving"}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              infoSaveState === "saved"
                ? "bg-green-500 text-white"
                : infoSaveState === "saving"
                  ? "bg-gray-200 text-gray-400"
                  : "bg-pink-accent text-white active:bg-pink-500"
            }`}
          >
            {infoSaveState === "saving"
              ? "저장 중…"
              : infoSaveState === "saved"
                ? "✓ 저장됐어요!"
                : "저장하기"}
          </button>
        </div>
      </section>

      {/* 알림·앨범 */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          사진 &amp; 알림
        </h2>
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <WebPushEnableButton />
          <Link
            href="/album"
            className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5 text-sm text-gray-700 active:bg-gray-50"
          >
            추억 앨범 보기
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      </section>

      {/* 베타 안내 */}
      <section className="mb-6 rounded-2xl bg-yellow-50 px-4 py-4 text-sm text-yellow-800">
        <p className="font-semibold">🧪 베타 테스트 중</p>
        <p className="mt-1 text-xs leading-relaxed text-yellow-700">
          여러분의 사용 패턴이 서비스를 개선하는 데 활용됩니다. 버그나
          불편한 점은 언제든 피드백 주세요!
        </p>
      </section>

      {/* 로그아웃 */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          계정
        </h2>
        <LogoutButton variant="settings" />
      </section>

      {/* 법적 링크 */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          약관 및 정책
        </h2>
        <div className="flex flex-col divide-y divide-gray-100 rounded-2xl bg-white shadow-sm">
          <Link
            href="/privacy"
            className="flex items-center justify-between px-4 py-3.5 text-sm text-gray-700 active:bg-gray-50"
          >
            개인정보처리방침
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      </section>

      {/* 계정 삭제 */}
      <section className="rounded-2xl border border-red-100 bg-red-50/50 px-4 py-4">
        <h2 className="mb-1 text-sm font-semibold text-red-700">계정 삭제</h2>
        <p className="mb-3 text-xs leading-relaxed text-red-600">
          계정을 삭제하면 모든 대화 기록, 캐릭터 관계 데이터가 영구 삭제됩니다.
          이 작업은 되돌릴 수 없습니다.
        </p>

        {deleteError && (
          <p className="mb-2 rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700">
            ⚠️ {deleteError}
          </p>
        )}

        {deleteStep === "idle" && (
          <button
            onClick={() => setDeleteStep("confirm")}
            className="w-full rounded-xl border border-red-300 py-2.5 text-sm font-medium text-red-600 transition-colors active:bg-red-100"
          >
            계정 삭제
          </button>
        )}

        {deleteStep === "confirm" && (
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteStep("idle")}
              className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm text-gray-600 active:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={handleDeleteAccount}
              className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white active:bg-red-600"
            >
              정말 삭제할게요
            </button>
          </div>
        )}

        {deleteStep === "loading" && (
          <div className="flex items-center justify-center py-2.5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
            <span className="ml-2 text-sm text-red-600">삭제 중...</span>
          </div>
        )}
      </section>
    </main>
  );
}
