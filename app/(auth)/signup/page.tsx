import { redirect } from "next/navigation";

/** 회원가입 — 로그인 화면 회원가입 모드로 통합 */
export default function SignupPage() {
  redirect("/login?mode=signup");
}
