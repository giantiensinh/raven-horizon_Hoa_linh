export const EMOTIONS = ["neutral", "happy", "sad", "angry", "surprised"] as const;
export const GESTURES = ["none", "nod", "shake", "tilt", "lean_in"] as const;
export const GAZES = ["camera", "chat", "away"] as const;

export type Emotion = (typeof EMOTIONS)[number];
export type Gesture = (typeof GESTURES)[number];
export type Gaze = (typeof GAZES)[number];
export type Phase = "idle" | "thinking" | "speaking";

export type Reply = {
  text: string;
  emotion: Emotion;
  gesture: Gesture;
  gaze: Gaze;
  source: "grok" | "fallback";
  warning?: string;
};
