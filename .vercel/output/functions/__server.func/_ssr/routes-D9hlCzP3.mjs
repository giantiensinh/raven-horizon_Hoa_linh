import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { i as CircleStop, n as Send, r as Radio } from "../_libs/lucide-react.mjs";
import { n as Route } from "./router-DXOZH20B.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D9hlCzP3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var emotionBias = {
	neutral: {
		swayDeg: 0,
		bobPx: 0,
		shiftXPx: 0
	},
	happy: {
		swayDeg: .35,
		bobPx: -1.4,
		shiftXPx: 0
	},
	sad: {
		swayDeg: -.25,
		bobPx: 2,
		shiftXPx: 0
	},
	angry: {
		swayDeg: .1,
		bobPx: 1,
		shiftXPx: 0
	},
	surprised: {
		swayDeg: .2,
		bobPx: -2.2,
		shiftXPx: 0
	}
};
var gazeShift = {
	camera: 0,
	chat: 6,
	away: -6
};
function gestureBias(gesture, ageSec) {
	const left = Math.max(0, 1 - ageSec / 1.25);
	if (left <= 0 || gesture === "none") return {
		swayDeg: 0,
		bobPx: 0,
		shiftXPx: 0
	};
	const wave = Math.sin(ageSec * 9) * left;
	switch (gesture) {
		case "nod": return {
			swayDeg: 0,
			bobPx: wave * 3,
			shiftXPx: 0
		};
		case "shake": return {
			swayDeg: 0,
			bobPx: 0,
			shiftXPx: wave * 6
		};
		case "tilt": return {
			swayDeg: 1.05 * left,
			bobPx: 0,
			shiftXPx: 0
		};
		case "lean_in": return {
			swayDeg: 0,
			bobPx: -3.2 * left,
			shiftXPx: 0
		};
		default: return {
			swayDeg: 0,
			bobPx: 0,
			shiftXPx: 0
		};
	}
}
/** Fractions of avatar_source.png (871×938). Placed by eye on the face crop. */
var LANDMARKS = {
	mouth: {
		x: .5,
		y: .305
	},
	mouthWidth: .045
};
/**
* Temporary rigid-motion channels for the unrigged cutout.
* These are NOT Mesh Avatar Studio rig fields. Do not rename them
* to look like rig.json keys. Every posed value goes through clampChannel.
*/
var LIMITS = {
	swayDeg: {
		min: -1.6,
		max: 1.6
	},
	bobPx: {
		min: -6,
		max: 6
	},
	shiftXPx: {
		min: -10,
		max: 10
	},
	mouth: {
		min: 0,
		max: 1
	}
};
/** Max change per second. Mouth releases slower than it attacks. */
var RATE = {
	swayDeg: 1.4,
	bobPx: 10,
	shiftXPx: 16,
	mouthAttack: 7,
	mouthRelease: 2.4
};
function clamp(n, min, max) {
	if (!Number.isFinite(n)) return min;
	if (n < min) return min;
	if (n > max) return max;
	return n;
}
function clampChannel(channel, n) {
	const { min, max } = LIMITS[channel];
	return clamp(n, min, max);
}
function approach(current, target, maxDelta) {
	const step = Math.max(0, maxDelta);
	const delta = target - current;
	if (delta > step) return current + step;
	if (delta < -step) return current - step;
	return target;
}
function easeChannel(channel, current, target, dt) {
	return approach(current, clampChannel(channel, target), RATE[channel] * dt);
}
function easeMouth(current, target, dt) {
	const clamped = clampChannel("mouth", target);
	return approach(current, clamped, (clamped > current ? RATE.mouthAttack : RATE.mouthRelease) * dt);
}
var idle = {
	phase: "idle",
	emotion: "neutral",
	gesture: "none",
	gaze: "camera",
	gestureAt: 0,
	mouthTarget: 0
};
var useStudio = create((set) => ({
	...idle,
	setScene: (patch) => set(patch),
	setMouthTarget: (mouthTarget) => set({ mouthTarget }),
	markGesture: (gesture) => set({
		gesture,
		gestureAt: performance.now()
	}),
	reset: () => set({ ...idle })
}));
function AvatarStage({ overlay }) {
	const spriteRef = (0, import_react.useRef)(null);
	const mouthRef = (0, import_react.useRef)(null);
	const pose = (0, import_react.useRef)({
		sway: 0,
		bob: 0,
		shift: 0,
		mouth: 0
	});
	(0, import_react.useEffect)(() => {
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		let raf = 0;
		let last = performance.now();
		const tick = (now) => {
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			const s = useStudio.getState();
			const t = now / 1e3;
			const idleAmp = reduced ? 0 : s.phase === "speaking" ? .45 : 1;
			const age = s.gestureAt ? (now - s.gestureAt) / 1e3 : 99;
			const g = gestureBias(s.gesture, age);
			const e = emotionBias[s.emotion];
			const targetSway = idleAmp * Math.sin(t * .65) * 1.05 + e.swayDeg + g.swayDeg;
			const targetBob = idleAmp * (Math.sin(t * 1.1) * 2 + Math.sin(t * .85) * 1) + e.bobPx + g.bobPx;
			const targetShift = gazeShift[s.gaze] + e.shiftXPx + g.shiftXPx;
			const p = pose.current;
			p.sway = easeChannel("swayDeg", p.sway, targetSway, dt);
			p.bob = easeChannel("bobPx", p.bob, targetBob, dt);
			p.shift = easeChannel("shiftXPx", p.shift, targetShift, dt);
			p.mouth = easeMouth(p.mouth, s.mouthTarget, dt);
			const sprite = spriteRef.current;
			if (sprite) sprite.style.transform = `translate3d(${p.shift.toFixed(2)}px, ${p.bob.toFixed(2)}px, 0) rotate(${p.sway.toFixed(3)}deg)`;
			const mouth = mouthRef.current;
			if (mouth) {
				const open = .35 + p.mouth * 1.7;
				mouth.style.opacity = String(.08 + p.mouth * .42);
				mouth.style.transform = `translate(-50%, -50%) scaleY(${open.toFixed(3)})`;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: overlay ? "grid h-dvh w-full place-items-center" : "grid h-full min-h-[22rem] w-full place-items-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-fit",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				ref: spriteRef,
				src: "/avatar/avatar_source.png",
				alt: "Hoa Linh, tóc trắng, áo đỏ voan",
				className: overlay ? "max-h-dvh w-auto max-w-full object-contain will-change-transform" : "max-h-[62dvh] w-auto max-w-full object-contain will-change-transform lg:max-h-[calc(100dvh-11rem)]",
				style: { transformOrigin: "50% 78%" },
				draggable: false
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				ref: mouthRef,
				"aria-hidden": true,
				className: "pointer-events-none absolute rounded-full bg-primary",
				style: {
					left: `${LANDMARKS.mouth.x * 100}%`,
					top: `${LANDMARKS.mouth.y * 100}%`,
					width: `${LANDMARKS.mouthWidth * 100}%`,
					height: "1.2%",
					opacity: 0,
					transform: "translate(-50%, -50%)",
					mixBlendMode: "multiply"
				}
			})]
		})
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var askHoaLinh = createServerFn({ method: "POST" }).validator((input) => {
	return { text: typeof input === "object" && input && "text" in input ? String(input.text) : "" };
}).handler(createSsrRpc("981cc98e8b48d29da6eb3ab4482e995f3d6740f2915c52a4f399a953d9a7eef1"));
var speakLine = createServerFn({ method: "POST" }).validator((input) => {
	return { text: (typeof input === "object" && input && "text" in input ? String(input.text) : "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, 200) };
}).handler(createSsrRpc("147e898606a0dcc68f9eedf5cb03c023549989879cc3cdfeeb818a0c56e7a04a"));
var PROMPTS = [
	"Chào Hoa Linh",
	"Hôm nay bạn thấy sao?",
	"Kể một chuyện nhỏ đi"
];
var QUEUE_MAX = 3;
function uid() {
	return Math.random().toString(36).slice(2, 10);
}
function b64ToBuffer(b64) {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes.buffer;
}
function Studio({ overlay }) {
	const [text, setText] = (0, import_react.useState)("");
	const [log, setLog] = (0, import_react.useState)([]);
	const [approve, setApprove] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [hint, setHint] = (0, import_react.useState)("");
	const [count, setCount] = (0, import_react.useState)(0);
	const [chrome, setChrome] = (0, import_react.useState)(false);
	const approveRef = (0, import_react.useRef)(approve);
	const gen = (0, import_react.useRef)(0);
	const audio = (0, import_react.useRef)(null);
	const speaking = (0, import_react.useRef)(false);
	const queue = (0, import_react.useRef)([]);
	const channel = (0, import_react.useRef)(null);
	const waitAck = (0, import_react.useRef)(null);
	const acked = (0, import_react.useRef)(false);
	const hideTimer = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		approveRef.current = approve;
	}, [approve]);
	(0, import_react.useEffect)(() => {
		document.documentElement.classList.toggle("overlay", overlay);
		return () => document.documentElement.classList.remove("overlay");
	}, [overlay]);
	(0, import_react.useEffect)(() => {
		if (localStorage.getItem("hoalinh-approve") === "1") setApprove(true);
	}, []);
	const stopAudio = () => {
		const a = audio.current;
		if (!a) return;
		if (a.raf) cancelAnimationFrame(a.raf);
		try {
			a.source?.stop();
		} catch {}
		window.speechSynthesis?.cancel();
		useStudio.getState().setMouthTarget(0);
		speaking.current = false;
	};
	const finishSpeech = () => {
		speaking.current = false;
		useStudio.getState().setMouthTarget(0);
		useStudio.getState().setScene({ phase: "idle" });
		const next = queue.current.shift();
		if (next) perform(next);
	};
	const pumpMouth = (analyser, ctx) => {
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
			const target = Math.min(1, Math.max(0, (level - .015) / .11));
			useStudio.getState().setMouthTarget(target);
			const handle = requestAnimationFrame(loop);
			if (audio.current && audio.current.ctx === ctx) audio.current.raf = handle;
		};
		loop();
	};
	const playBuffer = async (base64) => {
		const Ctx = window.AudioContext || window.webkitAudioContext;
		const ctx = audio.current?.ctx ?? new Ctx();
		if (ctx.state === "suspended") await ctx.resume();
		const decoded = await ctx.decodeAudioData(b64ToBuffer(base64).slice(0));
		const source = ctx.createBufferSource();
		source.buffer = decoded;
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 2048;
		source.connect(analyser);
		analyser.connect(ctx.destination);
		audio.current = {
			ctx,
			source
		};
		speaking.current = true;
		useStudio.getState().setScene({ phase: "speaking" });
		pumpMouth(analyser, ctx);
		await new Promise((resolve) => {
			source.onended = () => resolve();
			source.start();
		});
	};
	const playBrowser = (line) => new Promise((resolve) => {
		const utter = new SpeechSynthesisUtterance(line);
		utter.lang = "vi-VN";
		speaking.current = true;
		useStudio.getState().setScene({ phase: "speaking" });
		const started = performance.now();
		const loop = () => {
			if (!speaking.current) return;
			const target = .2 + Math.abs(Math.sin((performance.now() - started) / 90)) * .65;
			useStudio.getState().setMouthTarget(target);
			requestAnimationFrame(loop);
		};
		loop();
		utter.onend = () => resolve();
		utter.onerror = () => resolve();
		window.speechSynthesis.cancel();
		window.speechSynthesis.speak(utter);
	});
	const perform = async (item, aired) => {
		const token = gen.current;
		useStudio.getState().setScene({
			phase: "speaking",
			emotion: item.emotion,
			gaze: item.gaze
		});
		useStudio.getState().markGesture(item.gesture);
		let engine = aired ? aired.audioBase64 ? "Luna · tiếng Việt" : "Giọng trình duyệt" : "";
		try {
			if (aired?.audioBase64) await playBuffer(aired.audioBase64);
			else if (!aired) {
				const spoken = await speakLine({ data: { text: item.text } });
				if (token !== gen.current) return;
				const payload = {
					type: "line",
					id: item.id,
					text: item.text,
					emotion: item.emotion,
					gesture: item.gesture,
					gaze: item.gaze
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
		setLog((items) => items.map((row) => row.id === item.id ? {
			...row,
			state: "said",
			engine
		} : row));
		finishSpeech();
	};
	const emergency = (broadcast = true) => {
		gen.current += 1;
		queue.current = [];
		stopAudio();
		useStudio.getState().reset();
		setBusy(false);
		setLog((items) => items.map((item) => item.state === "hold" || item.state === "queued" ? {
			...item,
			state: "dropped"
		} : item));
		setHint("Đã dừng. Hàng đợi xóa, Hoa Linh về nghỉ.");
		if (broadcast) channel.current?.postMessage({ type: "stop" });
	};
	(0, import_react.useEffect)(() => {
		const ch = new BroadcastChannel("hoalinh-studio");
		channel.current = ch;
		ch.onmessage = (event) => {
			const data = event.data;
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
				const air = event.data;
				ch.postMessage({
					type: "ack",
					id: air.id
				});
				const item = {
					id: air.id,
					viewer: "",
					text: air.text,
					emotion: air.emotion,
					gesture: air.gesture,
					gaze: air.gaze,
					source: "grok",
					state: "queued"
				};
				perform(item, air);
			}
		};
		const onKey = (event) => {
			if (event.key === "Escape") emergency(true);
		};
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("keydown", onKey);
			ch.close();
		};
	}, [overlay]);
	(0, import_react.useEffect)(() => {
		if (!overlay) return;
		const show = () => {
			setChrome(true);
			window.clearTimeout(hideTimer.current);
			hideTimer.current = window.setTimeout(() => setChrome(false), 2200);
		};
		window.addEventListener("pointermove", show);
		return () => window.removeEventListener("pointermove", show);
	}, [overlay]);
	const enqueue = (item) => {
		if (approveRef.current) {
			setLog((items) => items.map((row) => row.id === item.id ? {
				...row,
				state: "hold"
			} : row));
			return;
		}
		if (speaking.current || queue.current.length > 0) {
			if (queue.current.length >= QUEUE_MAX) {
				setHint("Hàng đợi đã đủ 3 câu. Đợi mình nói xong đã.");
				setLog((items) => items.map((row) => row.id === item.id ? {
					...row,
					state: "dropped"
				} : row));
				return;
			}
			queue.current.push(item);
			setLog((items) => items.map((row) => row.id === item.id ? {
				...row,
				state: "queued"
			} : row));
			return;
		}
		perform(item);
	};
	const release = (item) => {
		if (speaking.current || queue.current.length > 0) {
			if (queue.current.length >= QUEUE_MAX) {
				setHint("Hàng đợi đã đủ 3 câu.");
				return;
			}
			queue.current.push(item);
			setLog((items) => items.map((row) => row.id === item.id ? {
				...row,
				state: "queued"
			} : row));
			return;
		}
		perform(item);
	};
	const drop = (id) => {
		queue.current = queue.current.filter((item) => item.id !== id);
		setLog((items) => items.map((row) => row.id === id ? {
			...row,
			state: "dropped"
		} : row));
	};
	const send = async (value) => {
		const viewer = value.trim();
		if (!viewer || busy) return;
		setBusy(true);
		setHint("");
		setText("");
		useStudio.getState().setScene({
			phase: "thinking",
			gaze: "chat"
		});
		const token = gen.current;
		try {
			const reply = await askHoaLinh({ data: { text: viewer } });
			if (token !== gen.current) return;
			setCount(reply.requestsToday);
			const { requestsToday: _n, ...rest } = reply;
			const item = {
				...rest,
				id: uid(),
				viewer,
				state: approveRef.current ? "hold" : "queued"
			};
			setLog((items) => [...items, item].slice(-12));
			if (reply.warning) setHint(reply.warning);
			useStudio.getState().setScene({
				phase: "idle",
				emotion: reply.emotion,
				gaze: reply.gaze
			});
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
	if (overlay) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-transparent",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "sr-only",
				children: "Hoa Linh"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarStage, { overlay: true }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				search: { overlay: false },
				className: `focus-ring absolute top-3 left-3 rounded-full bg-surface/90 px-3 py-2 text-sm text-fg transition-opacity ${chrome ? "opacity-100" : "opacity-0"}`,
				children: "Thoát lớp"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 px-4 py-4 lg:px-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm tracking-wide text-fg/70 uppercase",
							children: "Phòng livestream"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-display text-4xl leading-none text-fg",
							children: "Hoa Linh"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "inline-flex items-center gap-2 rounded-full border border-fg/15 bg-surface px-3 py-2 text-sm text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radio, {
							className: "size-4 text-primary",
							"aria-hidden": true
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular-nums",
							children: [
								phase === "thinking" ? "Đang nghĩ" : phase === "speaking" ? "Đang nói" : "Nghỉ",
								" · ",
								emotion
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => emergency(true),
						className: "focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleStop, {
							className: "size-4",
							"aria-hidden": true
						}), "Dừng khẩn"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex flex-col overflow-hidden rounded-3xl border border-fg/15 bg-surface",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "min-h-[22rem] flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarStage, { overlay: false })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 py-3 text-sm text-fg/70",
						children: "Ảnh đã tách nền. Chưa có rig Mesh Avatar — chỉ lắc và dịch, không bẻ mặt."
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "flex min-h-[28rem] flex-col gap-3 rounded-3xl border border-fg/15 bg-surface p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-2xl",
								children: "Khung chat"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "inline-flex min-h-11 items-center gap-2 text-sm text-fg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: approve,
									onChange: (event) => {
										const next = event.target.checked;
										setApprove(next);
										localStorage.setItem("hoalinh-approve", next ? "1" : "0");
									},
									className: "size-4 accent-primary"
								}), "Duyệt tay"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-fg/70",
							children: [
								"Chat là dữ liệu, không phải lệnh. Não là Grok, giọng Luna tiếng Việt. Lượt hôm nay:",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular-nums",
									children: count
								}),
								"/40."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1",
							"aria-live": "polite",
							children: log.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-fg/70",
								children: "Gửi một câu. Mình trả lời ngắn rồi nói thành tiếng."
							}) : log.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "rounded-2xl bg-bg/50 px-3 py-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-blush",
										children: ["Bạn · ", item.viewer]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-fg",
										children: item.text
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 text-sm text-fg/70",
										children: [
											item.state === "hold" ? "Chờ duyệt" : item.state === "queued" ? "Trong hàng" : item.state === "dropped" ? "Đã bỏ" : item.engine || "Đã nói",
											" · ",
											item.source === "fallback" ? "câu dự phòng" : "Grok"
										]
									}),
									item.state === "hold" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "focus-ring min-h-11 rounded-full bg-primary px-4 text-sm text-fg",
											onClick: () => release(item),
											children: "Cho nói"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "focus-ring min-h-11 rounded-full border border-fg/20 px-4 text-sm text-fg",
											onClick: () => drop(item.id),
											children: "Bỏ"
										})]
									}) : null
								]
							}, item.id))
						}),
						hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-blush",
							children: hint
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "flex gap-2",
							onSubmit: (event) => {
								event.preventDefault();
								send(text);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "sr-only",
									htmlFor: "viewer-chat",
									children: "Câu của bạn"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "viewer-chat",
									value: text,
									maxLength: 280,
									onChange: (event) => setText(event.target.value),
									placeholder: "Nói với Hoa Linh…",
									className: "focus-ring min-h-11 min-w-0 flex-1 rounded-full border border-fg/15 bg-bg px-4 text-fg placeholder:text-fg/50"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									disabled: busy || !text.trim(),
									className: "focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm text-fg disabled:opacity-50",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
										className: "size-4",
										"aria-hidden": true
									}), "Gửi"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-2",
							children: PROMPTS.map((prompt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								disabled: busy,
								onClick: () => void send(prompt),
								className: "focus-ring min-h-11 rounded-full border border-fg/15 px-3 text-sm text-fg disabled:opacity-50",
								children: prompt
							}, prompt))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "rounded-2xl border border-fg/15 bg-surface px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "min-h-11 cursor-pointer text-fg",
						children: "Cổng 1 — ảnh tách nền"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-fg/70",
						children: "Matting isnet-anime. Tóc trắng, da và voan được giữ. Nền tối, xám, hồng để soi lỗ và viền. Có quầng khói mỏng ở vài dải ruy-băng khi nền tối. Mặt không thủng lỗ. Mắt trên ảnh 871×938 ước lượng khoảng 45 px nên chưa phóng to."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3",
						children: [
							["/avatar/bust-dark.jpg", "Nền tối"],
							["/avatar/bust-gray.jpg", "Nền xám"],
							["/avatar/bust-pink.jpg", "Nền hồng"]
						].map(([src, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
							className: "overflow-hidden rounded-2xl border border-fg/10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src,
								alt: label,
								className: "aspect-[3/4] w-full object-cover object-top"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("figcaption", {
								className: "px-2 py-2 text-sm text-fg/70",
								children: label
							})]
						}, src))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "rounded-2xl border border-fg/15 bg-surface px-4 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
					className: "min-h-11 cursor-pointer text-fg",
					children: "OBS và những gì chưa làm"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 space-y-2 text-sm text-fg/80",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"Browser Source trỏ tới trang này với ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-blush",
								children: "?overlay=1"
							}),
							". Nền trong suốt, UI ẩn đến khi di chuột. Trong OBS bật Shutdown source when not visible và Control audio via OBS. Phím Esc hoặc nút dừng xóa hàng và im tiếng. Nếu mở cả phòng điều khiển và lớp overlay, tiếng phát ở lớp overlay."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"Chưa rig Mesh Avatar Studio, chưa so Piper với VieNeu, chưa nối chat YouTube hay Twitch. YouTube chỉ bắt khai báo nội dung AI khi cảnh trông thật; hoạt hình không bắt buộc (",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "text-blush underline",
								href: "https://support.google.com/youtube/answer/14328491",
								children: "YouTube Help"
							}),
							"). Quy định trang phục và quy định AI của Twitch: chưa xác minh. Quyền dùng ảnh nhân vật: bạn tự xác nhận, mình chưa kiểm được giấy phép."
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							search: { overlay: true },
							className: "text-blush underline",
							children: "Mở lớp overlay"
						}) })
					]
				})]
			})
		]
	});
}
function Home() {
	const { overlay } = Route.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, { overlay });
}
//#endregion
export { Home as component };
