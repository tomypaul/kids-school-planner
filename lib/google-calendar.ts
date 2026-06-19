import { google } from "googleapis";
import type { ExtractedEvent } from "./gemini";

function getOAuthClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

export async function createKidCalendar(
  accessToken: string,
  name: string,
  colorId: string
): Promise<string> {
  const auth = getOAuthClient(accessToken);
  const calendar = google.calendar({ version: "v3", auth });

  const { data: cal } = await calendar.calendars.insert({
    requestBody: {
      summary: `${name}'s School`,
      description: `School events for ${name}`,
      timeZone: "Asia/Kolkata",
    },
  });

  const calendarId = cal.id!;

  // Set color on the calendar list entry
  await calendar.calendarList.update({
    calendarId,
    requestBody: { colorId },
  });

  return calendarId;
}

export async function insertEvent(
  accessToken: string,
  calendarId: string,
  event: Omit<ExtractedEvent, "kidId">
): Promise<string> {
  const auth = getOAuthClient(accessToken);
  const calendar = google.calendar({ version: "v3", auth });

  const endDate = new Date(event.date);
  endDate.setDate(endDate.getDate() + 1);
  const endDateStr = endDate.toISOString().split("T")[0];

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `[${event.type}] ${event.title}`,
      description: `Subject: ${event.subject}\n\n${event.description}`,
      start: { date: event.date },
      end: { date: endDateStr },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 900 }, // 9 AM the day before
          { method: "popup", minutes: 300 }, // 7 PM the night before
        ],
      },
    },
  });

  return data.id!;
}

export async function insertEvents(
  accessToken: string,
  events: Array<Omit<ExtractedEvent, "kidId"> & { calendarId: string }>
): Promise<{ success: boolean; eventId?: string; error?: string }[]> {
  return Promise.all(
    events.map(async ({ calendarId, ...event }) => {
      try {
        const eventId = await insertEvent(accessToken, calendarId, event);
        return { success: true, eventId };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    })
  );
}
