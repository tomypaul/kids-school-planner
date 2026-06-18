import { GoogleGenAI, Type } from "@google/genai";

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

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING, description: "Subject name, e.g. Maths, English, EVS. Use 'General' if unclear." },
      title: { type: Type.STRING, description: "Short, clear calendar event title in English." },
      description: { type: Type.STRING, description: "Additional notes, items to bring, or requirements." },
      date: { type: Type.STRING, description: "Event date in YYYY-MM-DD format." },
      type: {
        type: Type.STRING,
        enum: ["Test", "Activity", "Homework", "Event"],
        description: "Category of the event.",
      },
    },
    required: ["subject", "title", "description", "date", "type"],
  },
};

export async function extractEvents(
  text: string,
  today: string,
  timezone: string = "Asia/Kolkata"
): Promise<RawEvent[]> {
  const prompt = `You are a school calendar assistant.
Today is ${today}. Timezone: ${timezone}.
The message may be in English, Malayalam, or Hindi — translate all output field values to English.

Resolve ALL relative dates to absolute YYYY-MM-DD format:
- "tomorrow" → today + 1 day
- "day after tomorrow" → today + 2 days
- "this Friday" or "coming Friday" → the nearest upcoming Friday
- "next Monday" → Monday of NEXT week (never the current week)
- "this Monday" → Monday of the current week
- "today" → ${today}
- "after school" or time-of-day references → use that same date, no time component

Extract every upcoming task, test, activity, or event from this school message.
If no events are found, return an empty array.

Message:
${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  try {
    const raw = JSON.parse(response.text ?? "[]") as RawEvent[];
    return raw.filter(
      (e) => e.title && e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)
    );
  } catch {
    return [];
  }
}
