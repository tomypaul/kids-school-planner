"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KID_COLORS } from "@/lib/colors";
import Header from "@/components/Header";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [colorId, setColorId] = useState(KID_COLORS[0].colorId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [addedKids, setAddedKids] = useState<string[]>([]);

  const selectedColor = KID_COLORS.find((c) => c.colorId === colorId)!;

  async function handleCreate() {
    if (!name.trim()) { setError("Please enter a name."); return; }
    setError("");
    setLoading(true);
    try {
      const id = name.trim().toLowerCase().replace(/\s+/g, "-");
      const res = await fetch("/api/calendar/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: name.trim(), colorId, colorHex: selectedColor.hex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create calendar");
      setAddedKids((prev) => [...prev, name.trim()]);
      setSuccess(true);
      setName("");
      setColorId(KID_COLORS[1].colorId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (success && addedKids.length > 0) {
    return (
      <>
        <Header />
        <main className="max-w-lg mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-gray-900">
              Calendar created for {addedKids.join(", ")}!
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              You can add more kids or start using the app.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setSuccess(false)}
              className="w-full border border-indigo-300 text-indigo-600 rounded-xl py-3 text-sm font-semibold hover:bg-indigo-50 active:scale-95 transition-all"
            >
              + Add Another Child
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Start Using the App
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Set up Kids Planner</h1>
          <p className="text-sm text-gray-500">
            Add each of your children. A dedicated Google Calendar will be created for each one.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Child&apos;s name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annabel"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calendar color
            </label>
            <div className="flex gap-3 flex-wrap">
              {KID_COLORS.map((c) => (
                <button
                  key={c.colorId}
                  onClick={() => setColorId(c.colorId)}
                  title={c.name}
                  className={`w-9 h-9 rounded-full border-2 transition-transform active:scale-90 ${
                    colorId === c.colorId ? "border-gray-900 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">{selectedColor.name}</p>
          </div>

          {/* Preview */}
          {name && (
            <div
              className="rounded-xl px-4 py-3 text-white text-sm font-medium"
              style={{ backgroundColor: selectedColor.hex }}
            >
              {name}&apos;s School Calendar
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating calendar…
              </>
            ) : (
              "Create Calendar"
            )}
          </button>
        </div>
      </main>
    </>
  );
}
