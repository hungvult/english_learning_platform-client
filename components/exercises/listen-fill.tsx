"use client";

import { useState } from "react";
import { Volume2, X, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListenFillData } from "@/types/api";

type Props = {
  exerciseId: string;
  data: ListenFillData;
  onAnswer: (answer: string[]) => void;
  disabled?: boolean;
};

export function ListenFill({ exerciseId, data, onAnswer, disabled }: Props) {
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<Array<{ id: string; text: string }>>([]);
  const [submitted, setSubmitted] = useState(false);

  const playAudio = async () => {
    if (playing) return;
    setPlaying(true);
    try {
      const audio = new Audio(`/api/exercises/${exerciseId}/audio`);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setPlaying(false);
        // Graceful degradation: if no audio file, show toast-like hint
        console.warn("Audio unavailable for this exercise");
      };
      await audio.play();
    } catch {
      setPlaying(false);
    }
  };

  const available = data.word_bank.filter(
    (item) => !selected.some((s) => s.id === item.id)
  );

  const addWord = (item: { id: string; text: string }) => {
    if (disabled || submitted) return;
    setSelected([...selected, item]);
  };

  const removeWord = (idx: number) => {
    if (disabled || submitted) return;
    setSelected(selected.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (submitted || selected.length === 0) return;
    setSubmitted(true);
    onAnswer(selected.map((s) => s.id));
  };

  return (
    <div className="flex flex-col gap-y-4">
      <p className="text-sm text-muted-foreground">{data.instruction}</p>

      {/* Audio play button */}
      <div className="flex justify-center">
        <button
          onClick={playAudio}
          disabled={playing}
          className="flex items-center gap-2 rounded-xl border-2 border-slate-200 px-8 py-4 font-medium transition hover:border-sky-300 hover:bg-sky-50"
        >
          {playing ? (
            <Loader className="h-6 w-6 animate-spin text-sky-500" />
          ) : (
            <Volume2 className="h-6 w-6 text-sky-500" />
          )}
          Play
        </button>
      </div>

      {/* Answer zone */}
      <div className="min-h-[56px] rounded-xl border-2 border-dashed border-slate-300 p-2 flex flex-wrap gap-2">
        {selected.map((item, i) => (
          <button
            key={`${item.id}-${i}`}
            onClick={() => removeWord(i)}
            className="flex items-center gap-1 rounded-lg border-2 border-b-4 border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            {item.text}
            <X className="h-3 w-3 text-slate-400" />
          </button>
        ))}
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-2">
        {available.map((item) => (
          <button
            key={item.id}
            onClick={() => addWord(item)}
            disabled={disabled}
            className="rounded-lg border-2 border-b-4 border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 active:border-b-2 transition"
          >
            {item.text}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled || submitted || selected.length === 0}
        className={cn(
          "w-full rounded-xl border-b-4 border-green-600 bg-green-500 py-3 font-bold text-white transition",
          "hover:bg-green-400 active:border-b-0",
          (submitted || selected.length === 0) && "pointer-events-none opacity-60"
        )}
      >
        {submitted ? "Submitted" : "Check"}
      </button>
    </div>
  );
}
