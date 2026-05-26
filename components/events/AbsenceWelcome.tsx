/**
 * 3일+ 미접속 환영 이벤트 UI
 * - 포옹 버튼, 진동, 눈물 표정 (framer-motion)
 */
export function AbsenceWelcome({ characterName }: { characterName: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="rounded-2xl bg-white p-6 text-center">
        <p className="text-lg font-semibold">{characterName}</p>
        <p className="mt-2 text-sm text-gray-600">왜 이제 왔어… 보고 싶었단 말이야</p>
        <button
          type="button"
          className="mt-4 rounded-full bg-pink-accent px-6 py-2 text-white"
        >
          안아주기 🤗
        </button>
      </div>
    </div>
  );
}
