"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Kid } from "@/lib/redis";
import type { ExtractedEvent } from "@/lib/gemini";
import KidSelector from "@/components/KidSelector";
import EventCard from "@/components/EventCard";

interface Props {
  kids: Kid[];
  pendingText: string;
  pendingToken?: string;
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function expandRecurring(event: ExtractedEvent, until: string): ExtractedEvent[] {
  if (!event.recurring || !event.frequency) return [event];
  const results: ExtractedEvent[] = [];
  const current = new Date(event.date + "T00:00:00");
  const end = new Date(until + "T00:00:00");
  const { recurring: _r, frequency: _f, ...base } = event;
  while (current <= end) {
    results.push({ ...base, date: current.toISOString().split("T")[0] });
    if (event.frequency === "weekly") current.setDate(current.getDate() + 7);
    else if (event.frequency === "daily") current.setDate(current.getDate() + 1);
    else current.setMonth(current.getMonth() + 1);
  }
  return results;
}

function countOccurrences(event: ExtractedEvent, until: string): number {
  return expandRecurring(event, until).length;
}

export default function ReviewClient({ kids, pendingText, pendingToken }: Props) {
  const router = useRouter();
  const [events, setEvents] = useState<ExtractedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  // Maps event index → until date for recurring events
  const [recurringUntil, setRecurringUntil] = useState<Record<number, string>>({});

  // Desktop path: read events from sessionStorage
  useEffect(() => {
    if (pendingText) return;
    const stored = sessionStorage.getItem("review_events");
    if (stored) {
      try {
        setEvents(JSON.parse(stored));
        sessionStorage.removeItem("review_events");
      } catch {
        // ignore parse errors
      }
    }
  }, [pendingText]);

  function getUntil(event: ExtractedEvent, index: number): string {
    return recurringUntil[index] ?? addMonths(event.date, 3);
  }

  // Total events that will be created after expanding recurring ones
  const totalCount = events.reduce((sum, event, i) => {
    if (!event.recurring || !event.frequency) return sum + 1;
    return sum + countOccurrences(event, getUntil(event, i));
  }, 0);

  async function extractForKid(kidId: string) {
    setLoading(true);
    setError("");
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: pendingToken, text: pendingText, timezone: tz }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      const extracted: ExtractedEvent[] = (data.events ?? []).map(
        (e: Omit<ExtractedEvent, "kidId">) => ({ ...e, kidId })
      );
      setEvents(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!events.length) return;
    setSaving(true);
    setError("");
    try {
      // For recurring events, attach the until date — the API creates one
      // Google Calendar recurring series (RRULE) so the user can delete/edit
      // the whole series at once, and no rate-limit issues from bulk inserts.
      const toSave = events.map((event, i) =>
        event.recurring && event.frequency
          ? { ...event, until: getUntil(event, i) }
          : event
      );
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: toSave }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save events");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  // Success state
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Added to Calendar!</h2>
        <p className="text-sm text-gray-500 mb-6">
          {totalCount} event{totalCount !== 1 ? "s" : ""} added to Google Calendar.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-indigo-600 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  // Android path — kid not yet selected
  if (pendingText && events.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Who is this for?</h2>
          <p className="text-sm text-gray-500">
            Tap a name to extract the events from the shared message.
          </p>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <KidSelector kids={kids} selected={null} onSelect={extractForKid} size="lg" />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="inline-block w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Analysing with Gemini…</p>
      </div>
    );
  }

  // No events found
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-5xl mb-4">🤔</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No events found</h2>
        <p className="text-sm text-gray-500 mb-6">
          The message didn&apos;t seem to contain any upcoming events.
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-indigo-600 text-sm font-medium hover:underline"
        >
          Try another message
        </button>
      </div>
    );
  }

  // Events review screen
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          {events.length} event{events.length !== 1 ? "s" : ""} found
        </h2>
        <p className="text-xs text-gray-400">Tap any field to edit</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-3">
        {events.map((event, i) => (
          <div key={i}>
            <EventCard
              event={event}
              kids={kids}
              onUpdate={(updated) =>
                setEvents((prev) => prev.map((e, j) => (j === i ? updated : e)))
              }
              onDelete={() => setEvents((prev) => prev.filter((_, j) => j !== i))}
            />

            {/* Recurring expansion panel */}
            {event.recurring && event.frequency && (
              <div className="rounded-b-xl border border-t-0 border-violet-200 bg-violet-50 px-4 py-3 -mt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-violet-700 font-medium">
                    Repeats every {event.frequency === "daily" ? "day" : event.frequency === "monthly" ? "month" : "week"} — until
                  </span>
                  <input
                    type="date"
                    value={getUntil(event, i)}
                    min={event.date}
                    onChange={(e) =>
                      setRecurringUntil((prev) => ({ ...prev, [i]: e.target.value }))
                    }
                    className="text-sm border border-violet-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-violet-400"
                  />
                  <span className="text-sm text-violet-500 font-medium">
                    → {countOccurrences(event, getUntil(event, i))} events
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || events.length === 0}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
      >
        {saving ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Adding to Calendar…
          </>
        ) : (
          `Add ${totalCount} event${totalCount !== 1 ? "s" : ""} to Calendar`
        )}
      </button>
    </div>
  );
}
