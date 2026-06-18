import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { setPendingText } from "@/lib/redis";

// Android Web Share Target sends multipart/form-data POST
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    // Manifest params map: text → "description", title → "name", url → "link"
    const text =
      (formData.get("description") as string) ||
      (formData.get("text") as string) ||
      (formData.get("name") as string) ||
      "";

    if (!text.trim()) {
      return Response.redirect(new URL("/", req.url), 303);
    }

    const token = randomBytes(16).toString("hex");
    await setPendingText(token, text.trim());

    // Redirect to review page — kid selection happens there
    return Response.redirect(new URL(`/review?token=${token}`, req.url), 303);
  } catch {
    return Response.redirect(new URL("/", req.url), 303);
  }
}
