"use client";

import type { ExtractedEvent } from "@/lib/gemini";
import type { Kid } from "@/lib/redis";

interface Props {
  event: ExtractedEvent;
  kids: Kid[];
  onUpdate: (updated: ExtractedEvent) => void;
  onDelete: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  Test:     "bg-red-100 text-red-700",
  Activity: "bg-blue-100 text-blue-700",
  Homework: "bg-yellow-100 text-yellow-700",
  Event:    "bg-green-100 text-green-700",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function EventCard({ event, kids, onUpdate, onDelete }: Props) {
  const kid = kids.find((k) => k.id === event.kidId);

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: kid?.colorHex ?? "#6366f1" }}
    >
      <div className="p-4">
        {/* Title */}
        <input
          type="text"
          value={event.title}
          onChange={(e) => onUpdate({ ...event, title: e.target.value })}
          className="w-full text-base font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-300 focus:outline-none pb-1 mb-2"
        />

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[event.type] ?? TYPE_COLORS.Event}`}>
            {event.type}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {event.subject}
          </span>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-500">📅</span>
          <input
            type="date"
            value={event.date}
            onChange={(e) => onUpdate({ ...event, date: e.target.value })}
            className="text-sm text-gray-700 bg-transparent border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-300"
          />
          <span className="text-sm text-gray-400">{formatDate(event.date)}</span>
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.description}</p>
        )}

        {/* Kid assignment + delete */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {kids.map((k) => (
              <button
                key={k.id}
                onClick={() => onUpdate({ ...event, kidId: k.id })}
                className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-all ${
                  event.kidId === k.id
                    ? "text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-200"
                }`}
                style={
                  event.kidId === k.id
                    ? { backgroundColor: k.colorHex, borderColor: k.colorHex }
                    : {}
                }
              >
                {k.name}
              </button>
            ))}
          </div>
          <button
            onClick={onDelete}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
