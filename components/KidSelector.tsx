"use client";

import type { Kid } from "@/lib/redis";

interface Props {
  kids: Kid[];
  selected: string | null;
  onSelect: (kidId: string) => void;
  size?: "sm" | "lg";
}

export default function KidSelector({ kids, selected, onSelect, size = "sm" }: Props) {
  if (size === "lg") {
    return (
      <div className="flex flex-col gap-3 w-full">
        {kids.map((kid) => (
          <button
            key={kid.id}
            onClick={() => onSelect(kid.id)}
            className="w-full py-5 rounded-2xl text-white text-xl font-bold shadow-md active:scale-95 transition-transform"
            style={{ backgroundColor: kid.colorHex }}
          >
            {kid.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {kids.map((kid) => (
        <button
          key={kid.id}
          onClick={() => onSelect(kid.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
            selected === kid.id
              ? "text-white border-transparent"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
          }`}
          style={
            selected === kid.id
              ? { backgroundColor: kid.colorHex, borderColor: kid.colorHex }
              : {}
          }
        >
          {kid.name}
        </button>
      ))}
    </div>
  );
}
