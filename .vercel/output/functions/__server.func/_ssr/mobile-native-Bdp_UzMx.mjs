import { o as __toESM } from "../_runtime.mjs";
import { R as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/mobile-native-Bdp_UzMx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Tiny Web Audio SFX. Unlock from the first pointer/key gesture. */
var ctx = null;
var master = null;
var unlocked = false;
function getCtx() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
		master = ctx.createGain();
		master.gain.value = .22;
		master.connect(ctx.destination);
	}
	return ctx;
}
function unlockAudio() {
	const c = getCtx();
	if (!c) return;
	if (c.state === "suspended") c.resume();
	unlocked = true;
}
function bindAudioUnlock() {
	const on = () => unlockAudio();
	window.addEventListener("pointerdown", on);
	window.addEventListener("keydown", on);
	const vis = () => {
		if (document.visibilityState === "visible") unlockAudio();
	};
	document.addEventListener("visibilitychange", vis);
	return () => {
		window.removeEventListener("pointerdown", on);
		window.removeEventListener("keydown", on);
		document.removeEventListener("visibilitychange", vis);
	};
}
function beep(freq, dur, type, gain = .12, slide = 0) {
	if (!unlocked) return;
	const c = getCtx();
	if (!c || !master) return;
	const osc = c.createOscillator();
	const g = c.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, c.currentTime);
	if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), c.currentTime + dur);
	g.gain.setValueAtTime(1e-4, c.currentTime);
	g.gain.exponentialRampToValueAtTime(gain, c.currentTime + .012);
	g.gain.exponentialRampToValueAtTime(1e-4, c.currentTime + dur);
	osc.connect(g);
	g.connect(master);
	osc.start();
	osc.stop(c.currentTime + dur + .02);
	osc.onended = () => {
		osc.disconnect();
		g.disconnect();
	};
}
var sfx = {
	deal: () => beep(420 + Math.random() * 40, .06, "triangle", .06),
	play: () => beep(220 + Math.random() * 30, .09, "sine", .1, -80),
	trick: () => beep(380, .16, "triangle", .1, 120),
	win: () => {
		beep(523, .18, "sine", .1);
		setTimeout(() => beep(659, .22, "sine", .1), 90);
		setTimeout(() => beep(784, .28, "sine", .12), 180);
	},
	kot: () => {
		beep(392, .2, "triangle", .12);
		setTimeout(() => beep(523, .22, "triangle", .12), 110);
		setTimeout(() => beep(659, .28, "sine", .14), 220);
		setTimeout(() => beep(784, .4, "sine", .14), 340);
	},
	illegal: () => beep(140, .12, "square", .05, -40),
	tap: () => beep(640, .04, "sine", .04)
};
var BOT_NAMES = [
	"Ravi",
	"Meera",
	"Kabir",
	"Anika",
	"Dev",
	"Sana",
	"Arjun",
	"Leela",
	"Nikhil",
	"Priya",
	"Imran",
	"Zara"
];
function botName(seat, seed = 1) {
	return BOT_NAMES[(seat * 3 + seed) % BOT_NAMES.length];
}
var NAME_KEY = "trupchal-name";
function loadName() {
	if (typeof window === "undefined") return "";
	return window.localStorage.getItem("trupchal-name") ?? "";
}
function saveName(name) {
	window.localStorage.setItem(NAME_KEY, name.trim().slice(0, 18));
}
function roomCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let out = "";
	const bytes = /* @__PURE__ */ new Uint8Array(6);
	crypto.getRandomValues(bytes);
	for (const b of bytes) out += alphabet[b % 32];
	return out;
}
function normalizeCode(raw) {
	return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var variants = {
	primary: "bg-cream text-ink hover:bg-cream-dim disabled:bg-line disabled:text-sage",
	secondary: "bg-wash text-cream border border-line hover:border-sage disabled:opacity-50",
	ghost: "bg-transparent text-cream hover:bg-wash disabled:opacity-40",
	cream: "bg-cream/10 text-cream border border-cream/20 hover:bg-cream/16"
};
var Button = (0, import_react.forwardRef)(function Button({ className, variant = "primary", type = "button", ...props }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		ref,
		type,
		className: cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium tracking-wide", "transition-colors duration-150 ease-out-soft select-none", "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream", "active:scale-[0.98] disabled:pointer-events-none disabled:active:scale-100", variants[variant], className),
		...props
	});
});
/**
* Android Native App & PWA Utilities for Trup Chal
*/
var HAPTIC_PATTERNS = {
	tap: [12],
	card: [20],
	trump: [
		30,
		40,
		30
	],
	win: [
		40,
		60,
		40,
		60,
		80
	],
	error: [
		50,
		30,
		50
	]
};
var hapticsEnabled = true;
function setHapticsEnabled(enabled) {
	hapticsEnabled = enabled;
	if (typeof window !== "undefined") localStorage.setItem("trup_haptics_enabled", enabled ? "1" : "0");
}
function getHapticsEnabled() {
	if (typeof window === "undefined") return true;
	const val = localStorage.getItem("trup_haptics_enabled");
	return val === null ? true : val === "1";
}
/**
* Triggers vibration haptics on Android devices
*/
function triggerHaptic(type = "tap") {
	if (!hapticsEnabled || typeof window === "undefined" || !("vibrate" in navigator)) return;
	try {
		const pattern = HAPTIC_PATTERNS[type] || HAPTIC_PATTERNS.tap;
		navigator.vibrate(pattern);
	} catch {}
}
var wakeLockSentinel = null;
/**
* Keeps the Android screen active during gameplay so it doesn't dim
*/
async function requestWakeLock() {
	if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
	try {
		if (!wakeLockSentinel) wakeLockSentinel = await navigator.wakeLock.request("screen");
	} catch {}
}
async function releaseWakeLock() {
	if (wakeLockSentinel) {
		try {
			await wakeLockSentinel.release();
		} catch {}
		wakeLockSentinel = null;
	}
}
/**
* Native Android Share API for inviting players
*/
async function shareGame(roomCode, playerName) {
	const shareData = {
		title: "Play Trup Chal with me!",
		text: `${playerName} invited you to play Trup Chal (Court Piece)! Room Code: ${roomCode}`,
		url: typeof window !== "undefined" ? `${window.location.origin}/play/${roomCode}` : ""
	};
	if (typeof window !== "undefined" && navigator.share && navigator.canShare?.(shareData)) try {
		await navigator.share(shareData);
		return true;
	} catch (err) {
		if (err.name !== "AbortError") console.error("Share failed:", err);
	}
	if (typeof window !== "undefined" && navigator.clipboard) try {
		await navigator.clipboard.writeText(shareData.url);
		return true;
	} catch {
		return false;
	}
	return false;
}
/**
* Check if app is running in Standalone PWA / Android Native WebView mode
*/
function isStandalone() {
	if (typeof window === "undefined") return false;
	const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
	const isIOSStandalone = window.navigator.standalone === true;
	return isStandaloneMedia || isIOSStandalone;
}
//#endregion
export { unlockAudio as _, getHapticsEnabled as a, normalizeCode as c, roomCode as d, saveName as f, triggerHaptic as g, shareGame as h, cn as i, releaseWakeLock as l, sfx as m, bindAudioUnlock as n, isStandalone as o, setHapticsEnabled as p, botName as r, loadName as s, Button as t, requestWakeLock as u };
