"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Kid } from "@/lib/redis";

export default function KidsClient({ initialKids }: { initialKids: Kid[] }) {
  const router = useRouter();
  const [kids, setKids] = useState(initialKids);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(kidId: string) {
    if (!confirm("Remove this child? Their Google Calendar will remain but won't receive new events.")) return;
    setRemoving(kidId);
    try {
      const res = await fetch("/api/kids", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: kidId }),
      });
      if (res.ok) setKids((prev) => prev.filter((k) => k.id !== kidId));
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Your Kids</h1>
        <button
          onClick={() => router.push("/setup")}
          className="text-sm text-indigo-600 font-medium hover:underline"
        >
          + Add Child
        </button>
      </div>

      {kids.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">👶</div>
          <p className="text-sm">No children added yet.</p>
          <button
            onClick={() => router.push("/setup")}
            className="mt-4 text-indigo-600 text-sm font-medium hover:underline"
          >
            Add your first child
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {kids.map((kid) => (
            <div
              key={kid.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: kid.colorHex }}
              >
                {kid.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{kid.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {kid.name}&apos;s School Calendar
                </p>
              </div>
              <button
                onClick={() => handleRemove(kid.id)}
                disabled={removing === kid.id}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 disabled:opacity-50"
              >
                {removing === kid.id ? "Removing…" : "Remove"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
