import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ExtractedEvent {
  subject: string;
  title: string;
  description: string;
  date: string;
  type: "Test" | "Activity" | "Homework" | "Event";
  kidId: string;
  recurring?: boolean;
  frequency?: "daily" | "weekly" | "monthly";
}

type RawEvent = Omit<ExtractedEvent, "kidId">;

// Models tried in order when quota is hit. Check AI Studio → Rate Limits for current quotas.
// To add a model: { id: "gemini-x.y-flash", thinkingBudget: 0 }
// thinkingBudget: 0 disables thinking for speed (only applies to models that support it)
const MODELS = [
  { id: "gemini-2.5-flash",      thinkingBudget: 0 as number | undefined }, // 20 RPD
  { id: "gemini-2.5-flash-lite", thinkingBudget: undefined               }, // 20 RPD
  { id: "gemini-3.1-flash-lite", thinkingBudget: undefined               }, // 500 RPD
];

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function buildWeekMap(today: string): string {
  const base = new Date(today + "T00:00:00");
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today + "T00:00:00");
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    return `${DAY_NAMES[d.getDay()]} ${iso}`;
  }).join(", ");
}

export async function extractEvents(
  text: string,
  today: string,
  timezone: string = "Asia/Kolkata"
): Promise<RawEvent[]> {
  const todayObj = new Date(today + "T00:00:00");
  const dayName = DAY_NAMES[todayObj.getDay()];
  const weekMap = buildWeekMap(today);

  const prompt = `You are a school calendar assistant.
Today is ${today} (${dayName}). Timezone: ${timezone}.

IMPORTANT — use this date reference to look up day names. Never calculate day-of-week yourself:
${weekMap}

The message may be in English, Malayalam, or Hindi — translate ALL output field values to English.

Resolve ALL relative dates to absolute YYYY-MM-DD format using the reference above:
- "tomorrow" → ${today} + 1 day
- "day after tomorrow" → ${today} + 2 days
- "this Friday" or "coming Friday" → find Friday in the reference
- "next Monday" → find the SECOND Monday in the reference (skip the first one if it is within this week)
- "this Monday" → find the FIRST Monday in the reference that is within the current week
- "today" → ${today}
- Explicit dates like "19 June", "23 June", "18th June" → resolve using current year
- "every Monday" → the first Monday entry in the reference (${weekMap.split(", ").find(d => d.startsWith("Monday")) ?? ""})

Extract every UPCOMING test, activity, or event that has a specific date.
Skip items that are already completed or have no date.
If nothing upcoming is found, return an empty array [].

RECURRING EVENTS: If an event repeats on a regular schedule (e.g. "every Friday", "daily", "every week", "every Monday and Wednesday"):
- Return ONLY ONE event object for the FIRST upcoming occurrence — look up the weekday in the reference above to get the correct date.
- Set recurring: true and frequency: "weekly", "daily", or "monthly".
- For "every Monday and Wednesday", return TWO objects (one per day), each with recurring: true and frequency: "weekly".

Return ONLY a valid JSON array. Each element must have exactly these keys:
- subject: string (e.g. "Maths", "English", "EVS", "Malayalam", "Hindi", "General")
- title: string (short calendar event title in English)
- description: string (notes, items to bring, etc. — empty string if none)
- date: string (YYYY-MM-DD, first occurrence only for recurring events)
- type: one of "Test", "Activity", "Homework", "Event"
- recurring: boolean (true if event repeats on a schedule, false or omit otherwise)
- frequency: "daily" | "weekly" | "monthly" (only set when recurring is true)

Message:
${text}`;

  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const config: Record<string, unknown> = { responseMimeType: "application/json" };
      if (model.thinkingBudget !== undefined) {
        config.thinkingConfig = { thinkingBudget: model.thinkingBudget };
      }

      const response = await ai.models.generateContent({
        model: model.id,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config,
      });

      try {
        const responseText = response.text;
        if (!responseText) return [];
        const raw = JSON.parse(responseText) as RawEvent[];
        return raw.filter(
          (e) => e.title && e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)
        ).map((e) => ({
          ...e,
          recurring: e.recurring === true ? true : undefined,
          frequency: e.recurring === true ? e.frequency : undefined,
        }));
      } catch {
        return [];
      }
    } catch (err) {
      if (isQuotaError(err)) {
        lastError = err;
        console.warn(`[gemini] ${model.id} quota exceeded, trying next model…`);
        continue;
      }
      throw err; // auth error, bad request, etc — don't rotate, just fail
    }
  }

  throw lastError ?? new Error("All Gemini models hit quota");
}
