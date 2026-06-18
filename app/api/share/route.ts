import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { setPendingText } from "@/lib/redis";

const MAX_BODY_BYTES = 20_000;
const MAX_TEXT_CHARS = 10_000;

// Android Web Share Target sends multipart/form-data POST — intentionally unauthenticated
// (OS share fires before the app can authenticate). Token is 128-bit random, consumed on first use.
export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return Response.redirect(new URL("/", req.url), 303);
    }

    const formData = await req.formData();
    // Manifest params map: text → "description", title → "name", url → "link"
    const raw =
      (formData.get("description") as string) ||
      (formData.get("text") as string) ||
      (formData.get("name") as string) ||
      "";

    const text = raw.trim().slice(0, MAX_TEXT_CHARS);

    if (!text) {
      return Response.redirect(new URL("/", req.url), 303);
    }

    const token = randomBytes(16).toString("hex");
    await setPendingText(token, text);

    // Redirect to review page — kid selection happens there
    return Response.redirect(new URL(`/review?token=${token}`, req.url), 303);
  } catch {
    return Response.redirect(new URL("/", req.url), 303);
  }
}
