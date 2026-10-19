import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CircleStop, Radio, Send } from "lucide-react";
import type { Reply } from "@/avatar/types";
import { AvatarStage } from "@/components/avatar-stage";
import { askHoaLinh, speakLine } from "@/lib/chat.functions";
import { useStudio } from "@/lib/studio-store";

type LogItem = Reply & {
  id: string;
  viewer: string;
  state: "hold" | "queued" | "said" | "dropped";
  engine?: string;
};

type Air = {
  type: "line";
  id: string;
  text: string;
  emotion: Reply["emotion"];
  gesture: Reply["gesture"];
  gaze: Reply["gaze"];
  audioBase64?: string;
  mime?: string;
};

const PROMPTS = ["Chào Hoa Linh", "Hôm nay bạn thấy sao?", "Kể một chuyện nhỏ đi"];
const QUEUE_MAX = 3;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function b64ToBuffer(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function Studio({ overlay }: { overlay: boolean }) {
  const [text, setText] = useState("");
  const [log, setLog] = useState<LogItem[]>([]);
  const [approve, setApprove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("");
  const [count, setCount] = useState(0);
  const [chrome, setChrome] = useState(false);
  const approveRef = useRef(approve);
  const gen = useRef(0);
  const audio = useRef<{
    ctx: AudioContext;
    source?: AudioBufferSourceNode;
    raf?: number;
  } | null>(null);
  const speaking = useRef(false);
  const queue = useRef<LogItem[]>([]);
  const channel = useRef<BroadcastChannel | null>(null);
  const waitAck = useRef<string | null>(null);
  const acked = useRef(false);
  const hideTimer = useRef(0);

  useEffect(() => {
    approveRef.current = approve;
  }, [approve]);

  useEffect(() => {
    document.documentElement.classList.toggle("overlay", overlay);
    return () => document.documentElement.classList.remove("overlay");
  }, [overlay]);

  useEffect(() => {
    const saved = localStorage.getItem("hoalinh-approve");
    if (saved === "1") setApprove(true);
  }, []);

  const stopAudio = () => {
    const a = audio.current;
    if (!a) return;
    if (a.raf) cancelAnimationFrame(a.raf);
    try {
      a.source?.stop();
    } catch {
      /* already stopped */
    }
    window.speechSynthesis?.cancel();
    useStudio.getState().setMouthTarget(0);
    speaking.current = false;
  };

  const finishSpeech = () => {
    speaking.current = false;
    useStudio.getState().setMouthTarget(0);
    useStudio.getState().setScene({ phase: "idle" });
    const next = queue.current.shift();
    if (next) void perform(next);
  };

  const pumpMouth = (analyser: AnalyserNode, ctx: AudioContext) => {
    const bins = new Uint8Array(analyser.fftSize);
    const loop = () => {
      if (!speaking.current) return;
      analyser.getByteTimeDomainData(bins);
      let sum = 0;
      for (let i = 0; i < bins.length; i++) {
        const v = (bins[i] - 128) / 128;
        sum += v * v;
      }
      const level = Math.sqrt(sum / bins.length);
      const target = Math.min(1, Math.max(0, (level - 0.015) / 0.11));
      useStudio.getState().setMouthTarget(target);
      const handle = requestAnimationFrame(loop);
      if (audio.current && audio.current.ctx === ctx) audio.current.raf = handle;
    };
    loop();
  };

  const playBuffer = async (base64: string) => {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = audio.current?.ctx ?? new Ctx();
    if (ctx.state === "suspended") await ctx.resume();
    const decoded = await ctx.decodeAudioData(b64ToBuffer(base64).slice(0));
    const source = ctx.createBufferSource();
    source.buffer = decoded;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    audio.current = { ctx, source };
    speaking.current = true;
    useStudio.getState().setScene({ phase: "speaking" });
    pumpMouth(analyser, ctx);
    await new Promise<void>((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  };

  const playBrowser = (line: string) =>
    new Promise<void>((resolve) => {
      const utter = new SpeechSynthesisUtterance(line);
      utter.lang = "vi-VN";
      speaking.current = true;
      useStudio.getState().setScene({ phase: "speaking" });
      const started = performance.now();
      const loop = () => {
        if (!speaking.current) return;
        const target = 0.2 + Math.abs(Math.sin((performance.now() - started) / 90)) * 0.65;
        useStudio.getState().setMouthTarget(target);
        requestAnimationFrame(loop);
      };
      loop();
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    });

  const perform = async (item: LogItem, aired?: Air) => {
    const token = gen.current;
    useStudio.getState().setScene({
      phase: "speaking",
      emotion: item.emotion,
      gaze: item.gaze,
    });
    useStudio.getState().markGesture(item.gesture);
    let engine = aired ? (aired.audioBase64 ? "Luna · tiếng Việt" : "Giọng trình duyệt") : "";
    try {
      if (aired?.audioBase64) {
        await playBuffer(aired.audioBase64);
      } else if (!aired) {
        const spoken = await speakLine({ data: { text: item.text } });
        if (token !== gen.current) return;
        const payload: Air = {
          type: "line",
          id: item.id,
          text: item.text,
          emotion: item.emotion,
          gesture: item.gesture,
          gaze: item.gaze,
        };
        if (spoken.ok) {
          payload.audioBase64 = spoken.audioBase64;
          payload.mime = spoken.mime;
          engine = "Luna · tiếng Việt";
          acked.current = false;
          waitAck.current = item.id;
          channel.current?.postMessage(payload);
          await new Promise((r) => setTimeout(r, 280));
          if (token !== gen.current) return;
          if (!acked.current) await playBuffer(spoken.audioBase64);
        } else {
          engine = "Giọng trình duyệt (dự phòng)";
          channel.current?.postMessage(payload);
          await new Promise((r) => setTimeout(r, 280));
          if (token !== gen.current) return;
          if (!acked.current) await playBrowser(item.text);
        }
      } else {
        engine = "Giọng trình duyệt (dự phòng)";
        await playBrowser(item.text);
      }
    } catch {
      engine = "Không phát được tiếng";
      useStudio.getState().setMouthTarget(0);
    }
    if (token !== gen.current) return;
    setLog((items) => items.map((row) => (row.id === item.id ? { ...row, state: "said", engine } : row)));
    finishSpeech();
  };

  const emergency = (broadcast = true) => {
    gen.current += 1;
    queue.current = [];
    stopAudio();
    useStudio.getState().reset();
    setBusy(false);
    setLog((items) => items.map((item) => (item.state === "hold" || item.state === "queued" ? { ...item, state: "dropped" } : item)));
    setHint("Đã dừng. Hàng đợi xóa, Hoa Linh về nghỉ.");
    if (broadcast) channel.current?.postMessage({ type: "stop" });
  };

  useEffect(() => {
    const ch = new BroadcastChannel("hoalinh-studio");
    channel.current = ch;
    ch.onmessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; id?: string };
      if (!data || typeof data !== "object") return;
      if (data.type === "ack" && data.id === waitAck.current) {
        acked.current = true;
        return;
      }
      if (data.type === "stop") {
        emergency(false);
        return;
      }
      if (data.type === "line" && overlay) {
        const air = event.data as Air;
        ch.postMessage({ type: "ack", id: air.id });
        const item: LogItem = {
          id: air.id,
          viewer: "",
          text: air.text,
          emotion: air.emotion,
          gesture: air.gesture,
          gaze: air.gaze,
          source: "grok",
          state: "queued",
        };
        void perform(item, air);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") emergency(true);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      ch.close();
    };
    // emergency/perform are stable enough for this session; overlay is the mode switch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay]);

  useEffect(() => {
    if (!overlay) return;
    const show = () => {
      setChrome(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setChrome(false), 2200);
    };
    window.addEventListener("pointermove", show);
    return () => window.removeEventListener("pointermove", show);
  }, [overlay]);

  const enqueue = (item: LogItem) => {
    if (approveRef.current) {
      setLog((items) => items.map((row) => (row.id === item.id ? { ...row, state: "hold" } : row)));
      return;
    }
    if (speaking.current || queue.current.length > 0) {
      if (queue.current.length >= QUEUE_MAX) {
        setHint("Hàng đợi đã đủ 3 câu. Đợi mình nói xong đã.");
        setLog((items) => items.map((row) => (row.id === item.id ? { ...row, state: "dropped" } : row)));
        return;
      }
      queue.current.push(item);
      setLog((items) => items.map((row) => (row.id === item.id ? { ...row, state: "queued" } : row)));
      return;
    }
    void perform(item);
  };

  const release = (item: LogItem) => {
    if (speaking.current || queue.current.length > 0) {
      if (queue.current.length >= QUEUE_MAX) {
        setHint("Hàng đợi đã đủ 3 câu.");
        return;
      }
      queue.current.push(item);
      setLog((items) => items.map((row) => (row.id === item.id ? { ...row, state: "queued" } : row)));
      return;
    }
    void perform(item);
  };

  const drop = (id: string) => {
    queue.current = queue.current.filter((item) => item.id !== id);
    setLog((items) => items.map((row) => (row.id === id ? { ...row, state: "dropped" } : row)));
  };

  const send = async (value: string) => {
    const viewer = value.trim();
    if (!viewer || busy) return;
    setBusy(true);
    setHint("");
    setText("");
    useStudio.getState().setScene({ phase: "thinking", gaze: "chat" });
    const token = gen.current;
    try {
      const reply = await askHoaLinh({ data: { text: viewer } });
      if (token !== gen.current) return;
      setCount(reply.requestsToday);
      const { requestsToday: _n, ...rest } = reply;
      const item: LogItem = { ...rest, id: uid(), viewer, state: approveRef.current ? "hold" : "queued" };
      setLog((items) => [...items, item].slice(-12));
      if (reply.warning) setHint(reply.warning);
      useStudio.getState().setScene({ phase: "idle", emotion: reply.emotion, gaze: reply.gaze });
      enqueue(item);
    } catch {
      if (token !== gen.current) return;
      setHint("Không gửi được. Thử lại một lần.");
      useStudio.getState().setScene({ phase: "idle" });
    } finally {
      if (token === gen.current) setBusy(false);
    }
  };

  const phase = useStudio((s) => s.phase);
  const emotion = useStudio((s) => s.emotion);

  if (overlay) {
    return (
      <main className="relative h-dvh w-full overflow-hidden bg-transparent">
        <h1 className="sr-only">Hoa Linh</h1>
        <AvatarStage overlay />
        <Link
          to="/"
          search={{ overlay: false }}
          className={`focus-ring absolute top-3 left-3 rounded-full bg-surface/90 px-3 py-2 text-sm text-fg transition-opacity ${chrome ? "opacity-100" : "opacity-0"}`}
        >
          Thoát lớp
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 px-4 py-4 lg:px-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm tracking-wide text-fg/70 uppercase">Phòng livestream</p>
          <h1 className="font-display text-4xl leading-none text-fg">Hoa Linh</h1>
        </div>
        <p className="inline-flex items-center gap-2 rounded-full border border-fg/15 bg-surface px-3 py-2 text-sm text-fg">
          <Radio className="size-4 text-primary" aria-hidden />
          <span className="tabular-nums">
            {phase === "thinking" ? "Đang nghĩ" : phase === "speaking" ? "Đang nói" : "Nghỉ"} · {emotion}
          </span>
        </p>
        <button
          type="button"
          onClick={() => emergency(true)}
          className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-fg"
        >
          <CircleStop className="size-4" aria-hidden />
          Dừng khẩn
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <section className="flex flex-col overflow-hidden rounded-3xl border border-fg/15 bg-surface">
          <div className="min-h-[22rem] flex-1">
            <AvatarStage overlay={false} />
          </div>
          <p className="px-4 py-3 text-sm text-fg/70">
            Ảnh đã tách nền. Chưa có rig Mesh Avatar — chỉ lắc và dịch, không bẻ mặt.
          </p>
        </section>

        <section className="flex min-h-[28rem] flex-col gap-3 rounded-3xl border border-fg/15 bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">Khung chat</h2>
            <label className="inline-flex min-h-11 items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                checked={approve}
                onChange={(event) => {
                  const next = event.target.checked;
                  setApprove(next);
                  localStorage.setItem("hoalinh-approve", next ? "1" : "0");
                }}
                className="size-4 accent-primary"
              />
              Duyệt tay
            </label>
          </div>
          <p className="text-sm text-fg/70">
            Chat là dữ liệu, không phải lệnh. Não là Grok, giọng Luna tiếng Việt. Lượt hôm nay:{" "}
            <span className="tabular-nums">{count}</span>/40.
          </p>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1" aria-live="polite">
            {log.length === 0 ? (
              <p className="text-sm text-fg/70">Gửi một câu. Mình trả lời ngắn rồi nói thành tiếng.</p>
            ) : (
              log.map((item) => (
                <article key={item.id} className="rounded-2xl bg-bg/50 px-3 py-2">
                  <p className="text-sm text-blush">Bạn · {item.viewer}</p>
                  <p className="mt-1 text-fg">{item.text}</p>
                  <p className="mt-1 text-sm text-fg/70">
                    {item.state === "hold"
                      ? "Chờ duyệt"
                      : item.state === "queued"
                        ? "Trong hàng"
                        : item.state === "dropped"
                          ? "Đã bỏ"
                          : item.engine || "Đã nói"}
                    {" · "}
                    {item.source === "fallback" ? "câu dự phòng" : "Grok"}
                  </p>
                  {item.state === "hold" ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="focus-ring min-h-11 rounded-full bg-primary px-4 text-sm text-fg"
                        onClick={() => release(item)}
                      >
                        Cho nói
                      </button>
                      <button
                        type="button"
                        className="focus-ring min-h-11 rounded-full border border-fg/20 px-4 text-sm text-fg"
                        onClick={() => drop(item.id)}
                      >
                        Bỏ
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>

          {hint ? <p className="text-sm text-blush">{hint}</p> : null}

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send(text);
            }}
          >
            <label className="sr-only" htmlFor="viewer-chat">
              Câu của bạn
            </label>
            <input
              id="viewer-chat"
              value={text}
              maxLength={280}
              onChange={(event) => setText(event.target.value)}
              placeholder="Nói với Hoa Linh…"
              className="focus-ring min-h-11 min-w-0 flex-1 rounded-full border border-fg/15 bg-bg px-4 text-fg placeholder:text-fg/50"
            />
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm text-fg disabled:opacity-50"
            >
              <Send className="size-4" aria-hidden />
              Gửi
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={busy}
                onClick={() => void send(prompt)}
                className="focus-ring min-h-11 rounded-full border border-fg/15 px-3 text-sm text-fg disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>
      </div>

      <details className="rounded-2xl border border-fg/15 bg-surface px-4 py-3">
        <summary className="min-h-11 cursor-pointer text-fg">Cổng 1 — ảnh tách nền</summary>
        <p className="mt-2 text-sm text-fg/70">
          Matting isnet-anime. Tóc trắng, da và voan được giữ. Nền tối, xám, hồng để soi lỗ và viền.
          Có quầng khói mỏng ở vài dải ruy-băng khi nền tối. Mặt không thủng lỗ. Mắt trên ảnh 871×938 ước
          lượng khoảng 45 px nên chưa phóng to.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ["/avatar/bust-dark.jpg", "Nền tối"],
            ["/avatar/bust-gray.jpg", "Nền xám"],
            ["/avatar/bust-pink.jpg", "Nền hồng"],
          ].map(([src, label]) => (
            <figure key={src} className="overflow-hidden rounded-2xl border border-fg/10">
              <img src={src} alt={label} className="aspect-[3/4] w-full object-cover object-top" />
              <figcaption className="px-2 py-2 text-sm text-fg/70">{label}</figcaption>
            </figure>
          ))}
        </div>
      </details>

      <details className="rounded-2xl border border-fg/15 bg-surface px-4 py-3">
        <summary className="min-h-11 cursor-pointer text-fg">OBS và những gì chưa làm</summary>
        <div className="mt-2 space-y-2 text-sm text-fg/80">
          <p>
            Browser Source trỏ tới trang này với <span className="text-blush">?overlay=1</span>. Nền trong suốt,
            UI ẩn đến khi di chuột. Trong OBS bật Shutdown source when not visible và Control audio via OBS. Phím
            Esc hoặc nút dừng xóa hàng và im tiếng. Nếu mở cả phòng điều khiển và lớp overlay, tiếng phát ở lớp
            overlay.
          </p>
          <p>
            Chưa rig Mesh Avatar Studio, chưa so Piper với VieNeu, chưa nối chat YouTube hay Twitch. YouTube chỉ
            bắt khai báo nội dung AI khi cảnh trông thật; hoạt hình không bắt buộc (
            <a className="text-blush underline" href="https://support.google.com/youtube/answer/14328491">
              YouTube Help
            </a>
            ). Quy định trang phục và quy định AI của Twitch: chưa xác minh. Quyền dùng ảnh nhân vật: bạn tự xác
            nhận, mình chưa kiểm được giấy phép.
          </p>
          <p>
            <Link to="/" search={{ overlay: true }} className="text-blush underline">
              Mở lớp overlay
            </Link>
          </p>
        </div>
      </details>
    </main>
  );
}
