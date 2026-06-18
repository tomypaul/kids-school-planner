import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ExtractedEvent {
  subject: string;
  title: string;
  description: string;
  date: string;
  type: "Test" | "Activity" | "Homework" | "Event";
  kidId: string;
}

type RawEvent = Omit<ExtractedEvent, "kidId">;

export async function extractEvents(
  text: string,
  today: string,
  timezone: string = "Asia/Kolkata"
): Promise<RawEvent[]> {
  const prompt = `You are a school calendar assistant.
Today is ${today}. Timezone: ${timezone}.
The message may be in English, Malayalam, or Hindi — translate ALL output field values to English.

Resolve ALL relative dates to absolute YYYY-MM-DD format:
- "tomorrow" → today + 1 day
- "day after tomorrow" → today + 2 days
- "this Friday" or "coming Friday" → the nearest upcoming Friday
- "next Monday" → Monday of NEXT week (never the current week)
- "this Monday" → Monday of the current week
- "today" → ${today}
- Explicit dates like "19 June", "23 June", "18th June" → resolve using current year

Extract every UPCOMING test, activity, or event that has a specific date.
Skip items that are already completed or have no date.
If nothing upcoming is found, return an empty array [].

Return ONLY a valid JSON array. Each element must have exactly these keys:
- subject: string (e.g. "Maths", "English", "EVS", "Malayalam", "Hindi", "General")
- title: string (short calendar event title in English)
- description: string (notes, items to bring, etc. — empty string if none)
- date: string (YYYY-MM-DD)
- type: one of "Test", "Activity", "Homework", "Event"

Message:
${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    const text = response.text;
    if (!text) return [];
    const raw = JSON.parse(text) as RawEvent[];
    return raw.filter(
      (e) => e.title && e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)
    );
  } catch {
    return [];
  }
}
