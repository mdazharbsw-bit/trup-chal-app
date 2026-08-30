import { o as __toESM } from "../_runtime.mjs";
import { R as require_jsx_runtime, v as useNavigate, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as unlockAudio, m as sfx, n as bindAudioUnlock, r as botName, s as loadName, t as Button } from "./mobile-native-Bdp_UzMx.mjs";
import { a as teamOf, i as createMatch, n as applyAction, o as toClientView, r as botAction, t as GameTable } from "./game-table-frxscOSp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/local-game-DEjhwmRv.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function randomSeed() {
	return (Math.floor(Math.random() * 4294967295) || 1) >>> 0;
}
function isHuman(mode, seat, mySeat) {
	if (mode === "practice") return seat === mySeat;
	return true;
}
function LocalGame({ mode }) {
	const navigate = useNavigate();
	const mySeat = 0;
	const [state, setState] = (0, import_react.useState)(() => createMatch(randomSeed(), 3));
	const [passGate, setPassGate] = (0, import_react.useState)(mode === "hotseat");
	const [hotSeat, setHotSeat] = (0, import_react.useState)(0);
	const [names] = (0, import_react.useState)(() => {
		const you = loadName() || "You";
		if (mode === "practice") return [
			you,
			botName(1),
			botName(2),
			botName(3)
		];
		return [
			you,
			"East",
			"North",
			"West"
		];
	});
	const acting = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => bindAudioUnlock(), []);
	const seats = (0, import_react.useMemo)(() => [
		0,
		1,
		2,
		3
	].map((seat) => ({
		seat,
		name: names[seat],
		isBot: mode === "practice" && seat !== mySeat
	})), [
		mode,
		names,
		mySeat
	]);
	const view = toClientView(state, mode === "hotseat" ? hotSeat : mySeat);
	const dispatch = (0, import_react.useCallback)((action, actor) => {
		setState((prev) => {
			try {
				const next = applyAction(prev, action, actor);
				if (action.type === "playCard") sfx.play();
				if (action.type === "chooseTrump") sfx.deal();
				if (action.type === "collectTrick") sfx.trick();
				if (next.phase === "handEnd" || next.phase === "matchEnd") {
					if (next.lastResult?.kot) sfx.kot();
					else sfx.win();
				}
				return next;
			} catch {
				sfx.illegal();
				return prev;
			}
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (state.phase === "matchEnd") return;
		if (state.phase === "trickEnd") {
			const t = window.setTimeout(() => dispatch({ type: "collectTrick" }, state.currentPlayer), 1100);
			return () => window.clearTimeout(t);
		}
		if (state.phase === "handEnd") {
			const t = window.setTimeout(() => dispatch({ type: "nextHand" }, 0), 2e3);
			return () => window.clearTimeout(t);
		}
		const actor = state.currentPlayer;
		if (isHuman(mode, actor, mySeat)) {
			if (mode === "hotseat" && hotSeat !== actor) {
				setPassGate(true);
				setHotSeat(actor);
			}
			return;
		}
		if (acting.current) return;
		acting.current = true;
		const delay = 520 + Math.random() * 640;
		const t = window.setTimeout(() => {
			try {
				const action = botAction(state, actor);
				dispatch(action, actor);
			} finally {
				acting.current = false;
			}
		}, delay);
		return () => {
			window.clearTimeout(t);
			acting.current = false;
		};
	}, [
		state,
		mode,
		mySeat,
		hotSeat,
		dispatch
	]);
	function onAction(action) {
		unlockAudio();
		dispatch(action, mode === "hotseat" ? hotSeat : mySeat);
	}
	if (mode === "hotseat" && passGate) {
		const partner = teamOf(hotSeat) === 0 ? "North–South" : "East–West";
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "felt-bg flex min-h-dvh flex-col items-center justify-center px-6 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-[0.24em] text-sage",
					children: partner
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-5xl font-semibold",
					children: names[hotSeat]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xs text-sm text-cream-dim",
					children: "Pass the phone. Everyone else look away — then open your hand."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					className: "mt-8 min-w-48",
					onClick: () => {
						unlockAudio();
						setPassGate(false);
					},
					children: "Show my cards"
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameTable, {
		view,
		seats,
		canAct: mode === "practice" ? state.currentPlayer === mySeat : state.currentPlayer === hotSeat && !passGate,
		hidden: mode === "hotseat" && passGate,
		onAction,
		onLeave: () => void navigate({ to: "/" })
	});
}
//#endregion
export { LocalGame as t };
