import { create } from "zustand";
import type { Emotion, Gaze, Gesture, Phase } from "@/avatar/types";

type StudioState = {
  phase: Phase;
  emotion: Emotion;
  gesture: Gesture;
  gaze: Gaze;
  gestureAt: number;
  mouthTarget: number;
  setScene: (patch: Partial<Pick<StudioState, "phase" | "emotion" | "gesture" | "gaze">>) => void;
  setMouthTarget: (n: number) => void;
  markGesture: (gesture: Gesture) => void;
  reset: () => void;
};

const idle = {
  phase: "idle" as const,
  emotion: "neutral" as const,
  gesture: "none" as const,
  gaze: "camera" as const,
  gestureAt: 0,
  mouthTarget: 0,
};

export const useStudio = create<StudioState>((set) => ({
  ...idle,
  setScene: (patch) => set(patch),
  setMouthTarget: (mouthTarget) => set({ mouthTarget }),
  markGesture: (gesture) => set({ gesture, gestureAt: performance.now() }),
  reset: () => set({ ...idle }),
}));
