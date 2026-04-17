"use client";

import { useState, useRef } from "react";
import { Mic, Square, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpeakSentenceData } from "@/types/api";

type Props = {
  data: SpeakSentenceData;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
};

type RecordState = "idle" | "recording" | "processing" | "done";

export function SpeakSentence({ data, onAnswer, disabled }: Props) {
  const [state, setState] = useState<RecordState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    if (disabled || state !== "idle") return;

    // Offline graceful degradation (Spec §6.3)
    if (!navigator.onLine) {
      onAnswer("__SKIPPED__");
      setState("done");
      return;
    }

    try {
      setState("recording");

      // Use Web Speech API if available
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new SpeechRecognition() as any;
        recognitionRef.current = recognition;
        recognition.lang = "en-US";
        recognition.interimResults = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const result = event.results[0][0].transcript;
          setTranscript(result);
          setState("done");
          onAnswer(result);
        };

        recognition.onerror = () => {
          setState("idle");
        };

        recognition.onend = () => {
          setState((prev) => (prev === "recording" ? "idle" : prev));
        };

        recognition.start();
      } else {
        // Fallback: MediaRecorder without STT
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRef.current = recorder;

        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          setState("processing");
          // Without STT API, skip and mark as answered
          setTimeout(() => {
            setState("done");
            onAnswer("__NO_STT__");
          }, 1000);
        };

        recorder.start();
      }
    } catch {
      setState("idle");
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    mediaRef.current?.stop();
    setState(state === "recording" ? "processing" : state);
  };

  return (
    <div className="flex flex-col items-center gap-y-6">
      <p className="text-sm text-muted-foreground">{data.instruction}</p>

      <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-8 py-4 text-center text-xl font-bold text-neutral-700">
        {data.sentence}
      </div>

      {/* Record button */}
      <button
        onClick={state === "recording" ? stopRecording : startRecording}
        disabled={disabled || state === "processing" || state === "done"}
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-full border-4 transition",
          state === "recording"
            ? "border-red-500 bg-red-50 text-red-500 animate-pulse"
            : state === "processing"
              ? "border-slate-300 bg-slate-50 text-slate-400"
              : state === "done"
                ? "border-green-500 bg-green-50 text-green-500"
                : "border-sky-400 bg-sky-50 text-sky-500 hover:bg-sky-100"
        )}
      >
        {state === "processing" ? (
          <LoaderCircle className="h-8 w-8 animate-spin" />
        ) : state === "recording" ? (
          <Square className="h-8 w-8" />
        ) : (
          <Mic className="h-8 w-8" />
        )}
      </button>

      {state === "recording" && (
        <p className="text-sm text-red-500 animate-pulse">Recording… tap to stop</p>
      )}

      {transcript && (
        <p className="text-sm text-neutral-500">
          You said: <span className="font-medium text-neutral-700">{transcript}</span>
        </p>
      )}

      {state === "idle" && !transcript && (
        <p className="text-xs text-muted-foreground">
          {navigator.onLine ? "Tap the mic to start" : "Offline — this exercise will be skipped"}
        </p>
      )}
    </div>
  );
}
