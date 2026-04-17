import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  listeningIgnoredUntil: number | null;
  speakingIgnoredUntil: number | null;
  ignoreListeningFor15Min: () => void;
  ignoreSpeakingFor15Min: () => void;
  isListeningIgnored: () => boolean;
  isSpeakingIgnored: () => boolean;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set, get) => ({
      listeningIgnoredUntil: null,
      speakingIgnoredUntil: null,

      ignoreListeningFor15Min: () => {
        const fifteenMinutes = 15 * 60 * 1000;
        set({ listeningIgnoredUntil: Date.now() + fifteenMinutes });
      },

      ignoreSpeakingFor15Min: () => {
        const fifteenMinutes = 15 * 60 * 1000;
        set({ speakingIgnoredUntil: Date.now() + fifteenMinutes });
      },

      isListeningIgnored: () => {
        const { listeningIgnoredUntil } = get();
        if (!listeningIgnoredUntil) return false;
        return Date.now() < listeningIgnoredUntil;
      },

      isSpeakingIgnored: () => {
        const { speakingIgnoredUntil } = get();
        if (!speakingIgnoredUntil) return false;
        return Date.now() < speakingIgnoredUntil;
      },
    }),
    {
      name: "elp-preferences", // unique name for localStorage key
    }
  )
);
