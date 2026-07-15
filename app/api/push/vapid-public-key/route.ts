import { getVapidPublicKey } from "@/lib/push/webPush";
import { NextResponse } from "next/server";

/** GET /api/push/vapid-public-key */
export async function GET() {
  const key = getVapidPublicKey();
  if (!key) {
    return NextResponse.json(
      { configured: false, publicKey: null },
      { status: 200 }
    );
  }
  return NextResponse.json({ configured: true, publicKey: key });
}
