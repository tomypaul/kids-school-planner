import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createKidCalendar } from "@/lib/google-calendar";
import { getKids, saveKids } from "@/lib/redis";
import type { Kid } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, colorId, colorHex } = await req.json();
  if (!id || !name || !colorId || !colorHex) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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
