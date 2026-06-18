"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Kid } from "@/lib/redis";
import KidSelector from "@/components/KidSelector";
import type { ExtractedEvent } from "@/lib/gemini";

export default function HomeClient({ kids }: { kids: Kid[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [selectedKid, setSelectedKid] = useState<string | null>(kids[0]?.id ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExtract() {
    if (!text.trim()) { setError("Please paste a message first."); return; }
    if (!selectedKid) { setError("Please select a child."); return; }
    setError("");
    setLoading(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, timezone: tz }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");

      const events: ExtractedEvent[] = (data.events ?? []).map(
        (e: Omit<ExtractedEvent, "kidId">) => ({ ...e, kidId: selectedKid })
      );
      sessionStorage.setItem("review_events", JSON.stringify(events));
      router.push("/review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          New school message
        </h2>
        <p className="text-sm text-gray-500">
          Paste a message from the class WhatsApp group. On Android, you can
          share directly from WhatsApp instead.
        </p>
      </div>

      {/* Kid selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Whose class is this for?
        </label>
        <KidSelector kids={kids} selected={selectedKid} onSelect={setSelectedKid} />
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste the message
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Tomorrow there is an EVS test. Please send the project on Friday..."
          rows={6}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleExtract}
        disabled={loading}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Extracting events…
          </>
        ) : (
          "Extract & Schedule Events"
        )}
      </button>
    </div>
  );
}
