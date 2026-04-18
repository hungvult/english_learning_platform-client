"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArrangeWordsData } from "@/types/api";

type Props = {
  data: ArrangeWordsData;
  onAnswer: (answer: string[]) => void;
  disabled?: boolean;
};

export function ArrangeWords({ data, onAnswer, disabled }: Props) {
  const [available, setAvailable] = useState<string[]>([...data.tokens].sort(() => Math.random() - 0.5));
  const [arranged, setArranged] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const addToken = (token: string, idx: number) => {
    if (disabled || submitted) return;
    const newAvailable = available.filter((_, i) => i !== idx);
    const newArranged = [...arranged, token];
    setAvailable(newAvailable);
    setArranged(newArranged);
  };

  const removeToken = (token: string, idx: number) => {
    if (disabled || submitted) return;
    const newArranged = arranged.filter((_, i) => i !== idx);
    setArranged(newArranged);
    setAvailable([...available, token]);
  };

  const handleSubmit = () => {
    if (submitted || arranged.length === 0) return;
    setSubmitted(true);
    onAnswer(arranged);
  };

  return (
    <div className="flex flex-col gap-y-4">


      {/* Drop zone */}
      <div className="min-h-[56px] rounded-xl border-2 border-dashed border-slate-300 p-2 flex flex-wrap gap-2">
        {arranged.map((token, i) => (
          <button
            key={`${token}-${i}`}
            onClick={() => removeToken(token, i)}
            className="flex items-center gap-1 rounded-lg border-2 border-b-4 border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            {token}
            <X className="h-3 w-3 text-slate-400" />
          </button>
        ))}
      </div>

      {/* Available tokens */}
      <div className="flex flex-wrap gap-2">
        {available.map((token, i) => (
          <button
            key={`${token}-${i}`}
            onClick={() => addToken(token, i)}
            disabled={disabled}
            className="rounded-lg border-2 border-b-4 border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 active:border-b-2 transition"
          >
            {token}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || arranged.length === 0 || submitted}
        className={cn(
          "mt-2 w-full rounded-xl border-b-4 border-green-600 bg-green-500 py-3 font-bold text-white transition",
          "hover:bg-green-400 active:border-b-0",
          (arranged.length === 0 || submitted) && "pointer-events-none opacity-60"
        )}
      >
        {submitted ? "Submitted" : "Check"}
      </button>
    </div>
  );
}
