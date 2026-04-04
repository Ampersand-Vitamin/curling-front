"use client";

import { useState } from "react";

export default function ViewToggle() {
  const [view, setView] = useState<"list" | "map">("map");

  return (
    <div className="flex bg-white rounded-full shadow-md p-1 gap-1">
      <button
        onClick={() => setView("list")}
        className={`px-4 py-2 rounded-full text-body2 transition ${
          view === "list"
            ? "bg-surface-100 text-surface-900"
            : "text-surface-500"
        }`}
      >
        ☰
      </button>
      <button
        onClick={() => setView("map")}
        className={`flex items-center gap-1 px-4 py-2 rounded-full text-body2 transition ${
          view === "map"
            ? "bg-primary-50 text-primary-600"
            : "text-surface-500"
        }`}
      >
        📍 Map
      </button>
    </div>
  );
}
