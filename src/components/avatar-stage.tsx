import { useEffect, useRef } from "react";
import { emotionBias, gazeShift, gestureBias } from "@/avatar/emotions";
import { LANDMARKS } from "@/avatar/landmarks";
import { easeChannel, easeMouth } from "@/avatar/limits";
import { useStudio } from "@/lib/studio-store";

type Pose = { sway: number; bob: number; shift: number; mouth: number };

export function AvatarStage({ overlay }: { overlay: boolean }) {
  const spriteRef = useRef<HTMLImageElement>(null);
  const mouthRef = useRef<HTMLSpanElement>(null);
  const pose = useRef<Pose>({ sway: 0, bob: 0, shift: 0, mouth: 0 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = useStudio.getState();
      const t = now / 1000;
      const idleAmp = reduced ? 0 : s.phase === "speaking" ? 0.45 : 1;
      const age = s.gestureAt ? (now - s.gestureAt) / 1000 : 99;
      const g = gestureBias(s.gesture, age);
      const e = emotionBias[s.emotion];
      const targetSway = idleAmp * Math.sin(t * 0.65) * 1.05 + e.swayDeg + g.swayDeg;
      const targetBob =
        idleAmp * (Math.sin(t * 1.1) * 2 + Math.sin(t * 0.85) * 1) + e.bobPx + g.bobPx;
      const targetShift = gazeShift[s.gaze] + e.shiftXPx + g.shiftXPx;
      const p = pose.current;
      p.sway = easeChannel("swayDeg", p.sway, targetSway, dt);
      p.bob = easeChannel("bobPx", p.bob, targetBob, dt);
      p.shift = easeChannel("shiftXPx", p.shift, targetShift, dt);
      p.mouth = easeMouth(p.mouth, s.mouthTarget, dt);

      const sprite = spriteRef.current;
      if (sprite) {
        sprite.style.transform = `translate3d(${p.shift.toFixed(2)}px, ${p.bob.toFixed(2)}px, 0) rotate(${p.sway.toFixed(3)}deg)`;
      }
      const mouth = mouthRef.current;
      if (mouth) {
        const open = 0.35 + p.mouth * 1.7;
        mouth.style.opacity = String(0.08 + p.mouth * 0.42);
        mouth.style.transform = `translate(-50%, -50%) scaleY(${open.toFixed(3)})`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const frame = overlay
    ? "min(100vw, calc(100dvh * 871 / 938))"
    : "min(92%, calc(58dvh * 871 / 938))";

  return (
    <div className={overlay ? "grid h-dvh w-full place-items-center" : "grid w-full place-items-center py-3"}>
      <div className="relative" style={{ aspectRatio: "871 / 938", width: frame }}>
        <img
          ref={spriteRef}
          src="/avatar/avatar_source.png"
          alt="Hoa Linh, tóc trắng, áo đỏ voan"
          className="h-full w-full object-contain will-change-transform"
          style={{ transformOrigin: "50% 78%" }}
          draggable={false}
        />
        <span
          ref={mouthRef}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-primary"
          style={{
            left: `${LANDMARKS.mouth.x * 100}%`,
            top: `${LANDMARKS.mouth.y * 100}%`,
            width: `${LANDMARKS.mouthWidth * 100}%`,
            height: "1.2%",
            opacity: 0,
            transform: "translate(-50%, -50%)",
            mixBlendMode: "multiply",
          }}
        />
      </div>
    </div>
  );
}
