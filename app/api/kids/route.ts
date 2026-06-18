import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getKids, saveKids } from "@/lib/redis";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const kids = await getKids(session.user.email);
  return NextResponse.json({ kids });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await req.json();
  const kids = await getKids(session.user.email);
  const updated = kids.filter((k) => k.id !== id);
  await saveKids(session.user.email, updated);
  return NextResponse.json({ ok: true });
}
