import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 — 픽미픽미",
  description: "픽미픽미 개인정보처리방침",
};

/**
 * /privacy — 공개 개인정보처리방침 페이지
 * 인증 불필요 · 미들웨어 보호 대상 아님
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white px-5 pb-16 pt-10">
      {/* 상단 네비 */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="text-sm text-pink-accent underline-offset-2 hover:underline"
        >
          ← 홈으로
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        개인정보처리방침
      </h1>
      <p className="mb-8 text-sm text-gray-400">
        픽미픽미 · 시행일: 2026년 6월 9일
      </p>

      <div className="prose prose-sm max-w-none space-y-8 text-gray-700">

        {/* 운영자 정보 */}
        <Section title="운영자 정보">
          <Table
            rows={[
              ["서비스명", "픽미픽미"],
              ["운영사(상호)", "______________________"],
              ["대표자", "______________________"],
              ["사업자등록번호", "______________________ (해당 시)"],
              ["이메일", "______________________"],
            ]}
          />
        </Section>

        {/* 개인정보보호책임자 */}
        <Section title="개인정보보호책임자 (CPO)">
          <Table
            rows={[
              ["성명", "______________________"],
              ["직책", "______________________"],
              ["이메일", "______________________"],
            ]}
          />
        </Section>

        {/* 제1조 */}
        <Section title="제1조 (개인정보의 처리 목적)">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>회원 가입 및 관리 — 본인 확인, 서비스 부정 이용 방지</li>
            <li>AI 채팅 서비스 제공 — 대화 생성 및 저장, 기억 시스템</li>
            <li>서비스 개선 및 분석 — 사용 패턴 분석, 베타 테스트 데이터 수집</li>
            <li>고객 지원 — 문의 처리 및 불만 해결</li>
          </ol>
        </Section>

        {/* 제2조 */}
        <Section title="제2조 (수집하는 개인정보의 항목)">
          <p className="mb-2 text-sm font-medium text-gray-800">필수 항목</p>
          <Table
            rows={[
              ["이메일 주소", "회원 가입, 본인 확인, 로그인"],
              ["비밀번호 (해시 암호화 저장)", "계정 보안"],
            ]}
            headers={["항목", "수집 목적"]}
          />
          <p className="mb-2 mt-4 text-sm font-medium text-gray-800">자동 수집 항목</p>
          <Table
            rows={[
              ["대화 내용", "AI 응답 생성, 맥락 유지, 기억 시스템"],
              ["캐릭터 관계 데이터 (호감도·레벨)", "서비스 기능 제공"],
              ["접속 기록", "서비스 분석, 재방문 기능"],
              ["기기 정보 (OS 종류)", "호환성 유지"],
            ]}
            headers={["항목", "수집 목적"]}
          />
          <p className="mt-3 text-sm text-gray-500">
            실명·전화번호·주소·위치 정보·결제 정보는 수집하지 않습니다.
          </p>
        </Section>

        {/* 제3조 */}
        <Section title="제3조 (개인정보의 보유 기간)">
          <Table
            rows={[
              ["회원 계정 정보", "회원 탈퇴 시까지"],
              ["대화 내용", "회원 탈퇴 시까지 (탈퇴 후 30일 이내 삭제)"],
              ["접속 기록", "수집일로부터 1년"],
            ]}
            headers={["항목", "보유 기간"]}
          />
        </Section>

        {/* 제4조 */}
        <Section title="제4조 (개인정보의 제3자 제공)">
          <p className="text-sm">
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
            단, 이용자가 사전에 동의한 경우 또는 법령의 규정에 의거한 경우에는 예외로 합니다.
          </p>
        </Section>

        {/* 제5조 */}
        <Section title="제5조 (개인정보 처리 위탁)">
          <Table
            rows={[
              ["Supabase Inc. (미국)", "데이터베이스 저장 및 인증", "이메일, 대화 내용, 접속 기록"],
              ["DeepSeek (중국)", "AI 언어 모델 API", "대화 메시지 (API 요청 시 전송)"],
            ]}
            headers={["수탁업체", "위탁 업무", "위탁 항목"]}
          />
          <div className="mt-3 rounded-xl bg-yellow-50 px-4 py-3 text-xs text-yellow-800">
            <strong>⚠️ DeepSeek 이용 안내</strong><br />
            DeepSeek은 중국 법인이 운영하는 AI 서비스입니다. API를 통해 전송된 대화 메시지는 DeepSeek의 서버를 경유합니다. 민감한 개인 정보(실명, 주민등록번호 등)는 대화에 입력하지 않도록 안내합니다.
          </div>
        </Section>

        {/* 제6조 */}
        <Section title="제6조 (개인정보의 파기)">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>전자적 파일: 복원이 불가능한 방법으로 영구 삭제</li>
            <li>회원 탈퇴: 앱 내 &apos;계정 삭제&apos; 또는 이메일 요청 후 30일 이내 삭제</li>
          </ul>
        </Section>

        {/* 제7조 */}
        <Section title="제7조 (이용자의 권리)">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>개인정보 열람 요청 — 이메일 문의</li>
            <li>개인정보 정정 요청 — 이메일 문의</li>
            <li>
              개인정보 삭제 요청 (계정 탈퇴) —{" "}
              <Link href="/settings" className="text-pink-accent underline">
                앱 내 설정 → 계정 삭제
              </Link>{" "}
              또는 이메일 요청
            </li>
            <li>처리 정지 요청 — 이메일 문의</li>
          </ol>
        </Section>

        {/* 제8조 */}
        <Section title="제8조 (개인정보의 안전성 확보 조치)">
          <Table
            rows={[
              ["비밀번호 해시 처리", "Supabase Auth bcrypt 해시 저장"],
              ["전송 구간 암호화", "HTTPS/TLS 1.2 이상 적용"],
              ["데이터 접근 제어", "Row Level Security(RLS) — 본인 데이터만 접근"],
              ["서버 인프라 암호화", "Supabase(PostgreSQL) 인프라 수준 저장 암호화"],
            ]}
            headers={["조치", "내용"]}
          />
          <p className="mt-2 text-xs text-gray-400">
            ※ 대화 내용에 대한 애플리케이션 수준의 별도 암호화는 현재 적용되어 있지 않습니다.
          </p>
        </Section>

        {/* 제9조 */}
        <Section title="제9조 (개인정보처리방침의 변경)">
          <p className="text-sm">
            본 방침은 시행일로부터 적용됩니다. 변경 시 시행 7일 전부터 앱 공지사항을 통해 고지합니다.
          </p>
        </Section>

      </div>

      {/* 하단 */}
      <div className="mt-10 border-t pt-6 text-center text-xs text-gray-400">
        <p>픽미픽미 · 시행일 2026년 6월 9일</p>
        <Link href="/" className="mt-2 block text-pink-accent">
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

/* ── 재사용 컴포넌트 ─────────────────────────────────── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 border-b pb-1 text-base font-bold text-gray-900">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Table({
  rows,
  headers,
}: {
  rows: string[][];
  headers?: string[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border text-sm">
      {headers && (
        <div
          className="grid bg-gray-50 px-4 py-2 font-medium text-gray-600"
          style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}
        >
          {headers.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
      )}
      {rows.map((row, i) => (
        <div
          key={i}
          className={`grid px-4 py-2.5 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
          style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}
        >
          {row.map((cell, j) => (
            <span
              key={j}
              className={j === 0 ? "font-medium text-gray-800" : "text-gray-600"}
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
