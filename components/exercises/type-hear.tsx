"use client";

import { useState, useRef } from "react";
import { Volume2, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TypeHearData } from "@/types/api";

type Props = {
  exerciseId: string;
  data: TypeHearData;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
};

export function TypeHear({ exerciseId, data, onAnswer, disabled }: Props) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 0.5>(1);
  const [userInput, setUserInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = async (rate: 1 | 0.5) => {
    if (playing) return;
    setPlaying(true);
    setSpeed(rate);

    try {
      // Use Web Speech API for TTS (online) or audio file if available
      if ("speechSynthesis" in window && navigator.onLine) {
        const utterance = new SpeechSynthesisUtterance(data.text);
        utterance.lang = "en-US";
        utterance.rate = rate;
        utterance.onend = () => setPlaying(false);
        utterance.onerror = () => setPlaying(false);
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback: try serving from backend audio file
        const audio = new Audio(`/api/exercises/${exerciseId}/audio`);
        audio.playbackRate = rate;
        audioRef.current = audio;
        audio.onended = () => setPlaying(false);
        audio.onerror = () => setPlaying(false);
        await audio.play();
      }
    } catch {
      setPlaying(false);
    }
  };

  const handleSubmit = () => {
    if (submitted || !userInput.trim()) return;
    setSubmitted(true);
    onAnswer(userInput.trim());
  };

  return (
    <div className="flex flex-col gap-y-4">


      {/* Audio playback controls */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => playAudio(1)}
          disabled={playing}
          className="flex items-center justify-center h-16 w-16 rounded-2xl border-2 border-slate-200 font-medium transition hover:border-sky-300 hover:bg-sky-50"
        >
          {playing && speed === 1 ? (
            <Loader className="h-8 w-8 animate-spin text-sky-500" />
          ) : (
            <Volume2 className="h-8 w-8 text-sky-500" />
          )}
        </button>
        <button
          onClick={() => playAudio(0.5)}
          disabled={playing}
          className="flex items-center justify-center h-16 w-16 rounded-2xl border-2 border-slate-200 font-medium transition hover:border-sky-300 hover:bg-sky-50"
        >
          {playing && speed === 0.5 ? (
            <Loader className="h-8 w-8 animate-spin text-sky-500" />
          ) : (
            <Volume2 className="h-5 w-5 text-sky-500" />
          )}
        </button>
      </div>

      <input
        type="text"
        value={userInput}
        disabled={disabled || submitted}
        onChange={(e) => setUserInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Type what you hear…"
        className="rounded-xl border-2 border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
      />

      <button
        onClick={handleSubmit}
        disabled={disabled || submitted || !userInput.trim()}
        className={cn(
          "w-full rounded-xl border-b-4 border-green-600 bg-green-500 py-3 font-bold text-white transition",
          "hover:bg-green-400 active:border-b-0",
          (submitted || !userInput.trim()) && "pointer-events-none opacity-60"
        )}
      >
        {submitted ? "Submitted" : "Check"}
      </button>
    </div>
  );
}
