import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { insertEvents } from "@/lib/google-calendar";
import { getKids } from "@/lib/redis";
import type { ExtractedEvent } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.error === "RefreshTokenError") {
    return NextResponse.json({ error: "Session expired, please sign in again" }, { status: 401 });
  }

  const { events }: { events: ExtractedEvent[] } = await req.json();
  if (!events?.length) {
    return NextResponse.json({ error: "No events provided" }, { status: 400 });
  }

  const userId = session.user.email;
  const kids = await getKids(userId);
  const kidMap = new Map(kids.map((k) => [k.id, k]));

  const eventsWithCalendar = events.map(({ kidId, ...event }) => {
    const kid = kidMap.get(kidId);
    if (!kid) throw new Error(`Unknown kid: ${kidId}`);
    return { ...event, calendarId: kid.calendarId };
  });

  const results = await insertEvents(session.accessToken, eventsWithCalendar);
  return NextResponse.json({ results });
}
