import { Footer } from "@/components/layout/Footer";
import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `이용약관 — ${BRAND.name}`,
  description: `${BRAND.name} 서비스 이용약관`,
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-10 pb-16">
      <Link href="/" className="text-sm text-gray-400 hover:text-pink-accent">
        ← 홈
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-gray-900">이용약관</h1>
      <p className="mt-2 text-sm text-gray-500">시행일: 2026년 7월 2일</p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
        <div>
          <h2 className="font-semibold text-gray-900">제1조 (목적)</h2>
          <p className="mt-2">
            본 약관은 {BRAND.name}(이하 &quot;서비스&quot;)의 이용 조건 및
            회사와 이용자 간 권리·의무를 규정합니다.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">제2조 (서비스 내용)</h2>
          <p className="mt-2">
            서비스는 AI 캐릭터와의 대화, 맞춤형 대화 제공, 관계·호감도 등
            부가 기능을 제공합니다. AI 응답은 참고용이며 전문 상담·의료·법률
            자문을 대체하지 않습니다.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            제3조 (이용자의 책임 — 대화 공유)
          </h2>
          <p className="mt-2">
            이용자가 대화 내용을 캡처·복사·공유·게시하는 경우, 그에 따른
            책임은 <strong>이용자 본인</strong>에게 있습니다. 서비스는 이용자가
            외부에 공유한 대화 내용으로 인해 발생하는 분쟁·피해에 대해 고의 또는
            중대한 과실이 없는 한 책임을 지지 않습니다.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">제4조 (금지 행위)</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>타인의 권리를 침해하는 대화·콘텐츠 생성</li>
            <li>서비스의 기술적 보호 조치 우회·역공학</li>
            <li>불법·음란·혐오 표현의 반복적 유도</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">제5조 (면책)</h2>
          <p className="mt-2">
            AI 캐릭터의 발화는 자동 생성되며, 회사는 그 정확성·적합성을
            보증하지 않습니다. 이용자는 자신의 판단과 책임 하에 서비스를
            이용합니다.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">제6조 (약관 변경)</h2>
          <p className="mt-2">
            약관 변경 시 서비스 내 공지 또는 이메일로 안내할 수 있습니다.
          </p>
        </div>
      </section>

      <Footer className="mt-10" />
    </main>
  );
}
