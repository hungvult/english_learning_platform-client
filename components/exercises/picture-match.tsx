"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PictureMatchData } from "@/types/api";

type Props = {
  data: PictureMatchData;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function resolveOptionImageUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("images/")) {
    return `${API_BASE}/static/${value}`;
  }

  if (value.startsWith("/static/")) {
    return `${API_BASE}${value}`;
  }

  return value;
}

export function PictureMatch({ data, onAnswer, disabled }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (disabled || selected) return;
    setSelected(id);
    onAnswer(id);
  };

  return (
    <div className="flex flex-col gap-y-4">

      <div className="text-center text-2xl font-bold text-neutral-700">{data.word}</div>
      <div className="grid grid-cols-2 gap-4">
        {data.options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center rounded-xl border-2 p-3 transition",
              selected === opt.id
                ? "border-sky-400 bg-sky-50"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            <div className="relative mb-2 h-24 w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveOptionImageUrl(opt.image_url)}
                alt={opt.text}
                className="h-full w-full rounded-lg object-fill"
                onError={(e) => {
                  // fallback if image missing
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <span className="text-sm font-medium text-neutral-600">{opt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
