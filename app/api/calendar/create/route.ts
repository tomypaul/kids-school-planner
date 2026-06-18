import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createKidCalendar } from "@/lib/google-calendar";
import { getKids, saveKids } from "@/lib/redis";
import type { Kid } from "@/lib/redis";
import { KID_COLORS } from "@/lib/colors";

const VALID_COLOR_IDS = new Set(KID_COLORS.map((c) => c.colorId));
const VALID_COLOR_HEXES = new Set(KID_COLORS.map((c) => c.hex));
const SAFE_ID_RE = /^[a-z0-9-]{1,50}$/;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.error === "RefreshTokenError") {
    return NextResponse.json({ error: "Session expired, please sign in again" }, { status: 401 });
  }

  const { id, name, colorId, colorHex } = await req.json();
  if (!id || !name || !colorId || !colorHex) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!SAFE_ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid kid id" }, { status: 400 });
  }
  if (typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (!VALID_COLOR_IDS.has(colorId) || !VALID_COLOR_HEXES.has(colorHex)) {
    return NextResponse.json({ error: "Invalid color" }, { status: 400 });
  }

  const calendarId = await createKidCalendar(session.accessToken, name, colorId);

  const userId = session.user.email;
  const kids = await getKids(userId);

  const existingIndex = kids.findIndex((k) => k.id === id);
  const kid: Kid = { id, name, calendarId, colorId, colorHex };

  if (existingIndex >= 0) {
    kids[existingIndex] = kid;
  } else {
    kids.push(kid);
  }

  await saveKids(userId, kids);
  return NextResponse.json({ kid });
}
