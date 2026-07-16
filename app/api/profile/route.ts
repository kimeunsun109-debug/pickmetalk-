import { ageFromBirthDate } from "@/lib/userAge";
import { mapUserProfile } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface ProfileUpdateBody {
  displayName?: string;
  gender?: string;
  birthDate?: string;
  mbti?: string;
  idealType?: string;
  interests?: string;
  hobbies?: string;
  privacyConsent?: boolean;
  termsConsent?: boolean;
  onboardingCompleted?: boolean;
}

/** GET — 본인 프로필 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profile: data ? mapUserProfile(data) : null,
  });
}

/** PATCH — 프로필·가입 정보 업데이트 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: ProfileUpdateBody;
  try {
    body = (await request.json()) as ProfileUpdateBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("profiles")
    .select("user_context")
    .eq("id", user.id)
    .maybeSingle();

  const prevCtx = (existing?.user_context as Record<string, string>) ?? {};
  const userContext: Record<string, string> = { ...prevCtx };

  if (body.displayName) {
    userContext.nickname = body.displayName;
    userContext.name = body.displayName;
  }
  if (body.gender) userContext.gender = body.gender;
  if (body.birthDate) {
    userContext.birthDate = body.birthDate;
    const age = ageFromBirthDate(body.birthDate);
    if (age != null) userContext.age = String(age);
  }
  if (body.mbti) userContext.mbti = body.mbti;
  if (body.idealType) userContext.idealType = body.idealType;
  if (body.interests) userContext.interests = body.interests;
  if (body.hobbies) userContext.hobbies = body.hobbies;

  const patch: Record<string, unknown> = { user_context: userContext };

  if (body.displayName) patch.display_name = body.displayName;
  if (body.gender) patch.gender = body.gender;
  if (body.birthDate) patch.birth_date = body.birthDate;
  if (body.mbti) patch.mbti = body.mbti;
  if (body.idealType) patch.ideal_type = body.idealType;
  if (body.privacyConsent) patch.privacy_consent_at = now;
  if (body.termsConsent) patch.terms_consent_at = now;
  if (body.onboardingCompleted) patch.onboarding_completed_at = now;

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: mapUserProfile(data) });
}
