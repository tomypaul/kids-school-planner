import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractEvents } from "@/lib/gemini";
import { getPendingText, deletePendingText } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text: rawText, token, timezone } = await req.json();

  let text = rawText?.trim() ?? "";

  if (!text && token) {
    text = (await getPendingText(token)) ?? "";
    if (text) await deletePendingText(token);
  }

  if (!text) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const tz = timezone ?? "Asia/Kolkata";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const events = await extractEvents(text, today, tz);

  return NextResponse.json({ events });
}
