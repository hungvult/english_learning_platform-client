"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CompleteConversationData } from "@/types/api";

type Props = {
  data: CompleteConversationData;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
};

export function CompleteConversation({ data, onAnswer, disabled }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    if (disabled || selected) return;
    setSelected(id);
    onAnswer(id);
  };

  return (
    <div className="flex flex-col gap-y-4">
      <p className="text-sm text-muted-foreground">{data.instruction}</p>
      <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center font-medium text-neutral-700">
        {data.text}
      </div>
      <div className="flex flex-col gap-y-2">
        {data.options.map((opt) => (
          <button
            key={opt.id}
            disabled={disabled}
            onClick={() => handleSelect(opt.id)}
            className={cn(
              "w-full rounded-xl border-2 px-4 py-3 text-left font-medium transition",
              selected === opt.id
                ? "border-sky-400 bg-sky-50 text-sky-700"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
