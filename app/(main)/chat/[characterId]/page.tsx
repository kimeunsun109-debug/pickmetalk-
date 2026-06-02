import { redirect } from "next/navigation";

/** 예전 URL 호환 — /chat 으로 통합 */
export default async function LegacyChatRedirect({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  await params;
  redirect("/chat");
}
