"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CompleteTranslationData } from "@/types/api";

type Props = {
  data: CompleteTranslationData;
  onAnswer: (answer: string[]) => void;
  disabled?: boolean;
};

/** Parse template like "Tên của tôi là {0}." into segments. */
function parseTemplate(template: string): Array<{ type: "text" | "input"; index?: number; value: string }> {
  const regex = /\{(\d+)\}/g;
  const segments: Array<{ type: "text" | "input"; index?: number; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: template.slice(lastIndex, match.index) });
    }
    segments.push({ type: "input", index: parseInt(match[1]), value: "" });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < template.length) {
    segments.push({ type: "text", value: template.slice(lastIndex) });
  }
  return segments;
}

export function CompleteTranslation({ data, onAnswer, disabled }: Props) {
  const segments = parseTemplate(data.text_template);
  const inputCount = segments.filter((s) => s.type === "input").length;
  const [values, setValues] = useState<string[]>(Array(inputCount).fill(""));
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (idx: number, val: string) => {
    const next = [...values];
    next[idx] = val;
    setValues(next);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    onAnswer(values);
  };

  return (
    <div className="flex flex-col gap-y-4">

      <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center text-neutral-600 italic">
        {data.source_sentence}
      </div>

      {/* Template with inline inputs */}
      <div className="flex flex-wrap items-center gap-x-1 text-lg font-medium text-neutral-700">
        {segments.map((seg, i) =>
          seg.type === "text" ? (
            <span key={i}>{seg.value}</span>
          ) : (
            <input
              key={i}
              type="text"
              disabled={disabled || submitted}
              value={values[seg.index!]}
              onChange={(e) => handleChange(seg.index!, e.target.value)}
              className="w-28 rounded-lg border-b-2 border-sky-400 bg-transparent px-1 text-center text-sky-700 outline-none placeholder:text-slate-300"
              placeholder="..."
            />
          )
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || submitted || values.some((v) => !v.trim())}
        className={cn(
          "mt-2 w-full rounded-xl border-b-4 border-green-600 bg-green-500 py-3 font-bold text-white transition",
          "hover:bg-green-400 active:border-b-0",
          (submitted || values.some((v) => !v.trim())) && "pointer-events-none opacity-60"
        )}
      >
        {submitted ? "Submitted" : "Check"}
      </button>
    </div>
  );
}
