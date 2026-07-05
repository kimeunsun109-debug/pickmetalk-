"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { clearClientSessionData } from "@/lib/auth/clearClientSession";
import { FREE_DAILY_MESSAGE_LIMIT } from "@/lib/constants";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

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
  subscriptionStatus: string;
  sessionDates: string[];
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
  subscriptionStatus,
  sessionDates,
}: SettingsClientProps) {
  const searchParams = useSearchParams();
  const premiumSuccess = searchParams.get("premium") === "success";
  const streak = calcStreak(sessionDates);
  const remaining = isPremium
    ? null
    : Math.max(0, FREE_DAILY_MESSAGE_LIMIT - todayMsgCount);
  const mostChatted = characterStates[0];
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly" }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "결제 페이지를 열지 못했어요.");
      }
      window.location.href = data.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : "결제를 시작하지 못했어요.");
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  // 계정 삭제 상태
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "loading">(
    "idle"
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      sub: isPremium ? "Premium ⭐" : `잔여 ${remaining}회`,
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

      {premiumSuccess && (
        <div className="mb-4 rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-pink-accent">
          Premium 가입이 완료됐어요. 이제 무제한 대화를 즐길 수 있어요 ⭐
        </div>
      )}

      {!isPremium && (
        <section className="mb-6 rounded-2xl border border-pink-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">
            ⭐ Premium — 무제한 대화
          </p>
          <p className="mt-1 text-xs text-gray-500">
            오늘 {todayMsgCount}/{FREE_DAILY_MESSAGE_LIMIT}회 사용 · 상태:{" "}
            {subscriptionStatus}
          </p>
          <button
            type="button"
            disabled={checkoutLoading}
            onClick={() => void startCheckout()}
            className="mt-3 w-full rounded-xl bg-pink-accent py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {checkoutLoading ? "이동 중…" : "Premium 시작하기"}
          </button>
        </section>
      )}

      {isPremium && (
        <section className="mb-6 rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm text-gray-700">
          Premium 구독 중 ⭐ 무제한 대화
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
