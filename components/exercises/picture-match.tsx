"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PictureMatchData } from "@/types/api";

type Props = {
  data: PictureMatchData;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
};

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
              <Image
                src={opt.image_url}
                alt={opt.text}
                fill
                className="rounded-lg object-cover"
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
