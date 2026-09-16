import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  OAUTH_SCOPES,
  signInWithOAuthProvider,
} from "../lib/auth/oauth";
import { safeAuthNextPath } from "../lib/auth/redirect";

process.env.NEXT_PUBLIC_APP_URL = "https://pickmetalk.com";

type OAuthCall = {
  provider: string;
  options: {
    redirectTo: string;
    scopes: string;
    queryParams?: Record<string, string>;
  };
};

const calls: OAuthCall[] = [];
const supabase = {
  auth: {
    signInWithOAuth: async (call: OAuthCall) => {
      calls.push(call);
      return { data: { url: "https://provider.example/authorize" }, error: null };
    },
  },
} as unknown as SupabaseClient;

await signInWithOAuthProvider(supabase, "google", "/characters");
await signInWithOAuthProvider(supabase, "kakao", "/characters");

assert.equal(OAUTH_SCOPES.google, "openid email profile");
assert.equal(
  OAUTH_SCOPES.kakao,
  "account_email,profile_nickname,profile_image"
);
assert.deepEqual(calls, [
  {
    provider: "google",
    options: {
      redirectTo:
        "https://pickmetalk.com/api/auth/callback?next=%2Fcharacters",
      scopes: "openid email profile",
      queryParams: { access_type: "online", prompt: "select_account" },
    },
  },
  {
    provider: "kakao",
    options: {
      redirectTo:
        "https://pickmetalk.com/api/auth/callback?next=%2Fcharacters",
      scopes: "account_email,profile_nickname,profile_image",
      queryParams: undefined,
    },
  },
]);

assert.equal(safeAuthNextPath("/characters"), "/characters");
assert.equal(safeAuthNextPath("/chat?character=yuna"), "/chat?character=yuna");
for (const unsafe of [
  null,
  "",
  "https://evil.example",
  "//evil.example",
  "/\\evil.example",
  "/characters\nSet-Cookie: bad=1",
]) {
  assert.equal(safeAuthNextPath(unsafe), "/characters");
}

console.log("OAuth scopes, callback URL, and redirect safety checks passed.");
