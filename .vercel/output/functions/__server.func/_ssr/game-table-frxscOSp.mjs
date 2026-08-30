import { o as __toESM } from "../_runtime.mjs";
import { R as require_jsx_runtime, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { g as triggerHaptic, i as cn, l as releaseWakeLock, t as Button, u as requestWakeLock } from "./mobile-native-Bdp_UzMx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/game-table-frxscOSp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SUITS = [
	"S",
	"H",
	"D",
	"C"
];
var RANKS = [
	"A",
	"K",
	"Q",
	"J",
	"10",
	"9",
	"8",
	"7",
	"6",
	"5",
	"4",
	"3",
	"2"
];
var RANK_VALUE = {
	A: 14,
	K: 13,
	Q: 12,
	J: 11,
	"10": 10,
	"9": 9,
	"8": 8,
	"7": 7,
	"6": 6,
	"5": 5,
	"4": 4,
	"3": 3,
	"2": 2
};
function rankValue(rank) {
	return RANK_VALUE[rank];
}
function cardId(suit, rank) {
	return `${rank}${suit}`;
}
function makeDeck() {
	const deck = [];
	for (const suit of SUITS) for (const rank of RANKS) deck.push({
		id: cardId(suit, rank),
		suit,
		rank
	});
	return deck;
}
/** Mulberry32 — deterministic, unbiased enough for a 52-card shuffle. */
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a += 1831565813;
		let t = a;
		t = Math.imul(t ^ t >>> 15, t | 1);
		t ^= t + Math.imul(t ^ t >>> 7, t | 61);
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function fisherYates(deck, rand) {
	const cards = deck.slice();
	for (let i = cards.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		const tmp = cards[i];
		cards[i] = cards[j];
		cards[j] = tmp;
	}
	return cards;
}
function isRed(suit) {
	return suit === "H" || suit === "D";
}
function isCourt(card) {
	return card.rank === "A" || card.rank === "K" || card.rank === "Q" || card.rank === "J";
}
function sortHand(cards, trump) {
	const suitOrder = trump ? [trump, ...SUITS.filter((s) => s !== trump)] : [
		"S",
		"H",
		"C",
		"D"
	];
	return cards.slice().sort((a, b) => {
		const si = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
		if (si !== 0) return si;
		return rankValue(b.rank) - rankValue(a.rank);
	});
}
var MAX_REDEALS = 2;
function teamOf(seat) {
	return seat % 2;
}
function nextSeat(seat) {
	return (seat + 1) % 4;
}
function emptyHands() {
	return [
		[],
		[],
		[],
		[]
	];
}
function dealBatch(deck, start, count, hands) {
	const rest = deck.slice();
	for (let n = 0; n < count; n++) for (let i = 0; i < 4; i++) {
		const seat = (start + i) % 4;
		const card = rest.shift();
		if (!card) throw new Error("Deck exhausted while dealing");
		hands[seat] = [...hands[seat], card];
	}
	return rest;
}
function dealFive(seed, dealer) {
	const rand = mulberry32(seed);
	const shuffled = fisherYates(makeDeck(), rand);
	const trumpCaller = nextSeat(dealer);
	const hands = emptyHands();
	return {
		deck: dealBatch(shuffled, trumpCaller, 5, hands),
		hands,
		trumpCaller
	};
}
function createMatch(seed, dealer = 0) {
	const dealt = dealFive(seed, dealer);
	return {
		seed,
		deck: dealt.deck,
		hands: dealt.hands,
		dealer,
		trumpCaller: dealt.trumpCaller,
		trump: null,
		phase: "choosingTrump",
		currentPlayer: dealt.trumpCaller,
		trickLeader: dealt.trumpCaller,
		currentTrick: [],
		seatTricks: [
			0,
			0,
			0,
			0
		],
		teamTricks: [0, 0],
		scores: [0, 0],
		winStreak: [0, 0],
		redeals: 0,
		target: 7,
		lastResult: null,
		handsPlayed: 0
	};
}
function hasCourtInHand(hand) {
	return hand.some(isCourt);
}
function legalCards(state, seat) {
	const hand = state.hands[seat];
	if (state.phase !== "playing") return [];
	if (state.currentPlayer !== seat) return [];
	if (state.currentTrick.length === 0) return hand.slice();
	const led = state.currentTrick[0].card.suit;
	const ofSuit = hand.filter((c) => c.suit === led);
	return ofSuit.length > 0 ? ofSuit : hand.slice();
}
function trickWinner(trick, trump) {
	const led = trick[0].card.suit;
	let best = trick[0];
	for (let i = 1; i < trick.length; i++) {
		const play = trick[i];
		const playTrump = play.card.suit === trump;
		const bestTrump = best.card.suit === trump;
		if (playTrump && !bestTrump) {
			best = play;
			continue;
		}
		if (!playTrump && bestTrump) continue;
		if (play.card.suit === best.card.suit && rankValue(play.card.rank) > rankValue(best.card.rank)) best = play;
		else if (!playTrump && !bestTrump && play.card.suit === led && best.card.suit !== led) best = play;
	}
	return best.seat;
}
function takeCard(hand, cardId) {
	const idx = hand.findIndex((c) => c.id === cardId);
	if (idx < 0) return null;
	return {
		card: hand[idx],
		next: [...hand.slice(0, idx), ...hand.slice(idx + 1)]
	};
}
function scoreHand(teamTricks, winStreak, winner) {
	const nsTricks = teamTricks[0];
	const ewTricks = teamTricks[1];
	const kot = (winner === 0 ? ewTricks : nsTricks) === 0;
	const nextStreak = [0, 0];
	nextStreak[winner] = kot ? 0 : winStreak[winner] + 1;
	const sevenStraight = !kot && nextStreak[winner] >= 7;
	let points = kot ? 2 : 1;
	if (sevenStraight) points += 2;
	return {
		winner,
		nsTricks,
		ewTricks,
		kot,
		sevenStraight,
		points
	};
}
function startNextHand(state, winner) {
	const dealer = winner === teamOf(state.trumpCaller) ? state.dealer : nextSeat(state.dealer);
	const seed = state.seed + 1 + state.handsPlayed * 9973 >>> 0;
	const dealt = dealFive(seed, dealer);
	return {
		...state,
		seed,
		deck: dealt.deck,
		hands: dealt.hands,
		dealer,
		trumpCaller: dealt.trumpCaller,
		trump: null,
		phase: "choosingTrump",
		currentPlayer: dealt.trumpCaller,
		trickLeader: dealt.trumpCaller,
		currentTrick: [],
		seatTricks: [
			0,
			0,
			0,
			0
		],
		teamTricks: [0, 0],
		redeals: 0,
		lastResult: state.lastResult
	};
}
function applyAction(state, action, actor) {
	switch (action.type) {
		case "chooseTrump": {
			if (state.phase !== "choosingTrump") throw new Error("Trump already chosen");
			if (actor !== state.trumpCaller) throw new Error("Only the trump caller may choose");
			const hands = emptyHands();
			for (let s = 0; s < 4; s++) hands[s] = state.hands[s].slice();
			const rest = dealBatch(state.deck, state.trumpCaller, 8, hands);
			return {
				...state,
				deck: rest,
				hands,
				trump: action.suit,
				phase: "playing",
				currentPlayer: state.trumpCaller,
				trickLeader: state.trumpCaller
			};
		}
		case "redeal": {
			if (state.phase !== "choosingTrump") throw new Error("Cannot redeal now");
			if (actor !== state.trumpCaller) throw new Error("Only the trump caller may redeal");
			if (hasCourtInHand(state.hands[actor])) throw new Error("Redeal only if you hold no court cards");
			if (state.redeals >= MAX_REDEALS) throw new Error("Redeal limit reached");
			const seed = state.seed + 17 + state.redeals * 31 >>> 0;
			const dealt = dealFive(seed, state.dealer);
			return {
				...state,
				seed,
				deck: dealt.deck,
				hands: dealt.hands,
				trumpCaller: dealt.trumpCaller,
				redeals: state.redeals + 1,
				currentPlayer: dealt.trumpCaller,
				trickLeader: dealt.trumpCaller
			};
		}
		case "playCard": {
			if (state.phase !== "playing") throw new Error("Not in play");
			if (actor !== state.currentPlayer) throw new Error("Not your turn");
			if (!legalCards(state, actor).some((c) => c.id === action.cardId)) throw new Error("Illegal card");
			const taken = takeCard(state.hands[actor], action.cardId);
			if (!taken) throw new Error("Card not in hand");
			const hands = emptyHands();
			for (let s = 0; s < 4; s++) hands[s] = s === actor ? taken.next : state.hands[s].slice();
			const currentTrick = [...state.currentTrick, {
				seat: actor,
				card: taken.card
			}];
			if (currentTrick.length < 4) return {
				...state,
				hands,
				currentTrick,
				currentPlayer: nextSeat(actor)
			};
			return {
				...state,
				hands,
				currentTrick,
				phase: "trickEnd",
				currentPlayer: actor
			};
		}
		case "collectTrick": {
			if (state.phase !== "trickEnd") throw new Error("No trick to collect");
			if (!state.trump) throw new Error("No trump");
			const winner = trickWinner(state.currentTrick, state.trump);
			const winnerTeam = teamOf(winner);
			const seatTricks = state.seatTricks.slice();
			seatTricks[winner] += 1;
			const teamTricks = state.teamTricks.slice();
			teamTricks[winnerTeam] += 1;
			if (!(teamTricks[0] >= 7 || teamTricks[1] >= 7)) return {
				...state,
				seatTricks,
				teamTricks,
				currentTrick: [],
				phase: "playing",
				trickLeader: winner,
				currentPlayer: winner
			};
			const result = scoreHand(teamTricks, state.winStreak, winnerTeam);
			const scores = state.scores.slice();
			scores[winnerTeam] += result.points;
			const winStreak = [0, 0];
			winStreak[winnerTeam] = result.kot ? 0 : state.winStreak[winnerTeam] + 1;
			winStreak[winnerTeam === 0 ? 1 : 0] = 0;
			const matchOver = scores[0] >= state.target || scores[1] >= state.target;
			return {
				...state,
				seatTricks,
				teamTricks,
				scores,
				winStreak,
				lastResult: result,
				handsPlayed: state.handsPlayed + 1,
				currentTrick: [],
				phase: matchOver ? "matchEnd" : "handEnd",
				currentPlayer: winner,
				trickLeader: winner
			};
		}
		case "nextHand":
			if (state.phase !== "handEnd" || !state.lastResult) throw new Error("Hand is not over");
			return startNextHand(state, state.lastResult.winner);
		default: throw new Error("Unknown action");
	}
}
function lowest(cards) {
	return cards.reduce((a, b) => rankValue(a.rank) <= rankValue(b.rank) ? a : b);
}
function highest(cards) {
	return cards.reduce((a, b) => rankValue(a.rank) >= rankValue(b.rank) ? a : b);
}
function suitStrength(hand, suit) {
	const of = hand.filter((c) => c.suit === suit);
	let score = of.length * 3;
	for (const c of of) if (c.rank === "A") score += 6;
	else if (c.rank === "K") score += 4;
	else if (c.rank === "Q") score += 3;
	else if (c.rank === "J") score += 2;
	else if (c.rank === "10") score += 1;
	if (of.some((c) => c.rank === "A") && of.some((c) => c.rank === "K")) score += 3;
	return score;
}
function chooseTrump(hand) {
	const suits = [
		"S",
		"H",
		"D",
		"C"
	];
	let best = "S";
	let bestScore = -1;
	for (const s of suits) {
		const n = suitStrength(hand, s);
		if (n > bestScore) {
			best = s;
			bestScore = n;
		}
	}
	return best;
}
function beats(card, current, trump, led) {
	const cT = card.suit === trump;
	const oT = current.suit === trump;
	if (cT && !oT) return true;
	if (!cT && oT) return false;
	if (card.suit === current.suit) return rankValue(card.rank) > rankValue(current.rank);
	if (card.suit === led && current.suit !== led && !oT) return true;
	return false;
}
function choosePlay(state, seat) {
	const legal = legalCards(state, seat);
	if (legal.length === 0) throw new Error("No legal cards");
	if (legal.length === 1) return legal[0];
	const trump = state.trump;
	const trick = state.currentTrick;
	if (trick.length === 0) {
		const nonTrump = legal.filter((c) => c.suit !== trump);
		const pool = nonTrump.length ? nonTrump : legal;
		const ace = pool.find((c) => c.rank === "A");
		if (ace) return ace;
		return highest(pool);
	}
	const led = trick[0].card.suit;
	const currentWinSeat = trickWinner(trick, trump);
	const partnerWinning = teamOf(currentWinSeat) === teamOf(seat) && currentWinSeat !== seat;
	const winningCard = trick.find((p) => p.seat === currentWinSeat).card;
	if (legal.every((c) => c.suit === led)) {
		if (partnerWinning) return lowest(legal);
		const winners = legal.filter((c) => beats(c, winningCard, trump, led));
		if (winners.length) return lowest(winners);
		return lowest(legal);
	}
	if (partnerWinning) {
		const junk = legal.filter((c) => c.suit !== trump);
		return lowest(junk.length ? junk : legal);
	}
	const winningTrumps = legal.filter((c) => c.suit === trump).filter((c) => beats(c, winningCard, trump, led));
	if (winningTrumps.length) return lowest(winningTrumps);
	const junk = legal.filter((c) => c.suit !== trump);
	return lowest(junk.length ? junk : legal);
}
function botAction(state, seat) {
	if (state.phase === "choosingTrump") {
		const hand = state.hands[seat];
		if (!hasCourtInHand(hand) && state.redeals < 2) return { type: "redeal" };
		return {
			type: "chooseTrump",
			suit: chooseTrump(hand)
		};
	}
	if (state.phase === "playing") return {
		type: "playCard",
		cardId: choosePlay(state, seat).id
	};
	if (state.phase === "trickEnd") return { type: "collectTrick" };
	if (state.phase === "handEnd") return { type: "nextHand" };
	throw new Error("No bot action");
}
function toClientView(state, mySeat) {
	const hand = sortHand(state.hands[mySeat], state.trump);
	const legal = legalCards(state, mySeat);
	const canRedeal = state.phase === "choosingTrump" && mySeat === state.trumpCaller && state.redeals < 2 && !hand.some((c) => c.rank === "A" || c.rank === "K" || c.rank === "Q" || c.rank === "J");
	return {
		phase: state.phase,
		mySeat,
		myHand: hand,
		legalIds: legal.map((c) => c.id),
		trump: state.trump,
		trumpCaller: state.trumpCaller,
		dealer: state.dealer,
		currentPlayer: state.currentPlayer,
		trickLeader: state.trickLeader,
		currentTrick: state.currentTrick,
		seats: [
			0,
			1,
			2,
			3
		].map((s) => ({
			seat: s,
			cardCount: state.hands[s].length,
			tricks: state.seatTricks[s],
			isTurn: state.currentPlayer === s && (state.phase === "playing" || state.phase === "choosingTrump")
		})),
		teamTricks: state.teamTricks,
		scores: state.scores,
		lastResult: state.lastResult,
		canRedeal,
		target: state.target,
		handsPlayed: state.handsPlayed,
		myTeam: teamOf(mySeat)
	};
}
var SUIT_NAMES = {
	S: "Spades",
	H: "Hearts",
	D: "Diamonds",
	C: "Clubs"
};
function SuitIcon({ suit, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 24 24",
		className: cn(suit === "H" || suit === "D" ? "text-heart" : "text-spade", className),
		fill: "currentColor",
		"aria-hidden": true,
		children: [
			suit === "S" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2C9.2 7.2 4 10.4 4 15.2 4 18.6 6.6 21 10 21c.9 0 1.7-.2 2.4-.6L11 22h2l-1.4-1.6c.7.4 1.5.6 2.4.6 3.4 0 6-2.4 6-5.8C20 10.4 14.8 7.2 12 2z" }),
			suit === "H" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 21S3 13.6 3 8.6C3 5.5 5.5 3 8.4 3c1.8 0 3.4.9 3.6 2.4C12.2 3.9 13.8 3 15.6 3 18.5 3 21 5.5 21 8.6 21 13.6 12 21 12 21z" }),
			suit === "D" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 2 21 12 12 22 3 12z" }),
			suit === "C" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 8.2c-1.7-2.6-5.6-2.2-5.6 1.6 0 2.2 1.8 3.6 4 3.6h.2L9.2 21h5.6l-1.4-7.6h.2c2.2 0 4-1.4 4-3.6 0-3.8-3.9-4.2-5.6-1.6z" })
		]
	});
}
var PIPS = {
	"2": [[50, 22], [50, 78]],
	"3": [
		[50, 20],
		[50, 50],
		[50, 80]
	],
	"4": [
		[32, 24],
		[68, 24],
		[32, 76],
		[68, 76]
	],
	"5": [
		[32, 24],
		[68, 24],
		[50, 50],
		[32, 76],
		[68, 76]
	],
	"6": [
		[32, 22],
		[68, 22],
		[32, 50],
		[68, 50],
		[32, 78],
		[68, 78]
	],
	"7": [
		[32, 20],
		[68, 20],
		[50, 36],
		[32, 50],
		[68, 50],
		[32, 80],
		[68, 80]
	],
	"8": [
		[32, 18],
		[68, 18],
		[32, 40],
		[68, 40],
		[32, 60],
		[68, 60],
		[32, 82],
		[68, 82]
	],
	"9": [
		[32, 18],
		[68, 18],
		[32, 38],
		[68, 38],
		[50, 50],
		[32, 62],
		[68, 62],
		[32, 82],
		[68, 82]
	],
	"10": [
		[32, 16],
		[68, 16],
		[50, 30],
		[32, 38],
		[68, 38],
		[32, 62],
		[68, 62],
		[50, 70],
		[32, 84],
		[68, 84]
	]
};
function Corner({ rank, suit, flip }) {
	const ten = rank === "10";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("absolute flex flex-col items-center leading-none", flip ? "right-0.5 bottom-0.5 rotate-180" : "top-0.5 left-0.5"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("font-display font-semibold", ten ? "text-[0.58em]" : "text-[0.72em]"),
			children: rank
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuitIcon, {
			suit,
			className: "h-[0.7em] w-[0.7em]"
		})]
	});
}
function PlayingCard({ card, className, selected, dimmed, faceDown, onClick, size = "md" }) {
	const sizes = {
		sm: "w-10 h-14 text-[10px]",
		md: "w-14 h-[4.9rem] text-[13px]",
		lg: "w-16 h-[5.6rem] text-[13px]"
	};
	if (faceDown || !card) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("card-back relative rounded-sm border border-cream/15", sizes[size], className),
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-[4px] rounded-[3px] border border-cream/20" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-4 rotate-45 rounded-[2px] border border-cream/35" })
		})]
	});
	const red = isRed(card.suit);
	const pips = PIPS[card.rank];
	const face = card.rank === "J" || card.rank === "Q" || card.rank === "K";
	const ace = card.rank === "A";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		disabled: !onClick,
		className: cn("card-face relative rounded-sm border border-ink/10 text-left", sizes[size], red ? "text-heart" : "text-spade", selected && "-translate-y-3 ring-2 ring-cream", dimmed && "opacity-40", onClick && "cursor-pointer", !onClick && "cursor-default", className),
		"aria-label": `${card.rank} of ${card.suit}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Corner, {
				rank: card.rank,
				suit: card.suit
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Corner, {
				rank: card.rank,
				suit: card.suit,
				flip: true
			}),
			pips && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0",
				children: pips.map(([x, y], i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2",
					style: {
						left: `${x}%`,
						top: `${y}%`
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuitIcon, {
						suit: card.suit,
						className: "h-full w-full"
					})
				}, i))
			}),
			(face || ace) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-0 flex flex-col items-center justify-center",
				children: [face && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-[1.45em] font-semibold leading-none",
					children: card.rank
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuitIcon, {
					suit: card.suit,
					className: ace ? "h-[38%] w-[38%]" : "mt-0.5 h-[1em] w-[1em]"
				})]
			})
		]
	});
}
var RELATIVE = {
	0: "bottom",
	1: "right",
	2: "top",
	3: "left"
};
function relativeOf(mySeat, seat) {
	return RELATIVE[(seat - mySeat + 4) % 4];
}
function Opponent({ name, tricks, isTurn, isBot, side }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex items-center gap-2", side === "top" && "flex-col", side === "left" && "flex-col items-start", side === "right" && "flex-col items-end"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("rounded-md border px-2.5 py-1 text-center", isTurn ? "border-cream bg-cream text-ink" : "border-line bg-ink/40 text-cream"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-w-28 truncate text-xs font-medium tracking-wide",
				children: name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "font-mono text-[10px] tabular-nums text-sage",
				children: [
					tricks,
					" trick",
					tricks === 1 ? "" : "s",
					isBot ? " · bot" : ""
				]
			})]
		})
	});
}
function TrumpBadge({ trump }) {
	if (!trump) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-full border border-line bg-ink/40 px-2.5 py-1 font-mono text-xs text-sage",
		children: "Turup: —"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-1.5 rounded-full border border-cream/30 bg-ink/60 px-3 py-1 font-mono text-xs font-medium text-cream",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sage",
				children: "Turup:"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuitIcon, {
				suit: trump,
				className: "h-3.5 w-3.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: SUIT_NAMES[trump] })
		]
	});
}
function GameTable({ view, seats, onAction, onLeave, status, canAct = true, hidden = false }) {
	(0, import_react.useEffect)(() => {
		requestWakeLock();
		return () => {
			releaseWakeLock();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (view.phase === "matchEnd" || view.phase === "handEnd") triggerHaptic("win");
	}, [view.phase]);
	const nameOf = (seat) => seats.find((s) => s.seat === seat)?.name ?? `Seat ${seat}`;
	const botOf = (seat) => Boolean(seats.find((s) => s.seat === seat)?.isBot);
	const byRel = {
		top: (view.mySeat + 2) % 4,
		left: (view.mySeat + 3) % 4,
		right: (view.mySeat + 1) % 4
	};
	const trickPos = {
		bottom: "bottom-1 left-1/2 -translate-x-1/2",
		top: "top-1 left-1/2 -translate-x-1/2",
		left: "left-1 top-1/2 -translate-y-1/2",
		right: "right-1 top-1/2 -translate-y-1/2"
	};
	const choosing = view.phase === "choosingTrump" && view.currentPlayer === view.mySeat && canAct;
	const playing = view.phase === "playing" && view.currentPlayer === view.mySeat && canAct;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "felt-bg relative flex min-h-dvh flex-col overflow-x-hidden select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "z-20 flex items-center justify-between gap-2 px-3 py-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							triggerHaptic("tap");
							onLeave();
						},
						className: "rounded-sm px-2 py-2 text-xs tracking-wide text-sage hover:text-cream",
						children: "Leave"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 font-mono text-xs tabular-nums",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: view.myTeam === 0 ? "text-cream" : "text-sage",
								children: ["NS ", view.scores[0]]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-line",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: view.myTeam === 1 ? "text-cream" : "text-sage",
								children: ["EW ", view.scores[1]]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-sage",
								children: ["/ ", view.target]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrumpBadge, { trump: view.trump })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex min-h-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-center pt-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opponent, {
						name: nameOf(byRel.top),
						tricks: view.seats[byRel.top].tricks,
						cards: view.seats[byRel.top].cardCount,
						isTurn: view.seats[byRel.top].isTurn,
						isBot: botOf(byRel.top),
						side: "top"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-0 flex-1 items-center justify-between px-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opponent, {
							name: nameOf(byRel.left),
							tricks: view.seats[byRel.left].tricks,
							cards: view.seats[byRel.left].cardCount,
							isTurn: view.seats[byRel.left].isTurn,
							isBot: botOf(byRel.left),
							side: "left"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative h-36 w-36 shrink-0 sm:h-44 sm:w-44",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 rounded-full border border-cream/10" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-4 rounded-full border border-cream/5" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute inset-0 flex items-center justify-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "font-mono text-lg tabular-nums text-cream",
											children: [
												view.teamTricks[0],
												"–",
												view.teamTricks[1]
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] uppercase tracking-[0.18em] text-sage",
											children: "this hand"
										})]
									})
								}),
								view.currentTrick.map((play) => {
									const rel = relativeOf(view.mySeat, play.seat);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("absolute", trickPos[rel]),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
											card: play.card,
											size: "sm"
										})
									}, play.card.id);
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Opponent, {
							name: nameOf(byRel.right),
							tricks: view.seats[byRel.right].tricks,
							cards: view.seats[byRel.right].cardCount,
							isTurn: view.seats[byRel.right].isTurn,
							isBot: botOf(byRel.right),
							side: "right"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "z-10 px-3 pb-1 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: cn("inline-flex rounded-md px-3 py-1 text-xs tracking-wide", view.seats[view.mySeat].isTurn && canAct ? "bg-cream text-ink font-medium" : "text-sage"),
					children: status ?? (view.phase === "choosingTrump" ? view.currentPlayer === view.mySeat ? "Choose turup from your five cards" : `${nameOf(view.currentPlayer)} is choosing turup` : view.phase === "playing" ? view.currentPlayer === view.mySeat ? "Your chal — play a card" : `${nameOf(view.currentPlayer)} to play` : view.phase === "trickEnd" ? "Trick complete" : "")
				})
			}),
			choosing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "z-20 mx-auto mb-2 flex flex-wrap items-center justify-center gap-2 px-3",
				children: [[
					"S",
					"H",
					"D",
					"C"
				].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					className: "min-w-20 gap-2",
					onClick: () => {
						triggerHaptic("trump");
						onAction({
							type: "chooseTrump",
							suit: s
						});
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SuitIcon, {
						suit: s,
						className: "h-4 w-4"
					}), SUIT_NAMES[s]]
				}, s)), view.canRedeal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					onClick: () => {
						triggerHaptic("tap");
						onAction({ type: "redeal" });
					},
					children: "Redeal"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10 pb-[max(0.5rem,env(safe-area-inset-bottom))]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "hand-fan flex h-36 items-end justify-center px-1 sm:h-40",
					children: (hidden ? [] : view.myHand).map((card, i, arr) => {
						const n = arr.length;
						const t = n <= 1 ? 0 : (i / (n - 1) - .5) * 2;
						const rot = t * Math.min(16, n * 1.15);
						const y = Math.abs(t) * 8;
						const legal = view.legalIds.includes(card.id);
						const dim = playing && !legal;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "origin-bottom shrink-0 transition-transform duration-150",
							style: {
								marginLeft: i === 0 ? 0 : n > 10 ? -36 : n > 7 ? -30 : n > 4 ? -22 : -12,
								transform: `rotate(${rot}deg) translateY(${y}px)`,
								zIndex: i
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
								card,
								size: "lg",
								dimmed: dim,
								onClick: playing && legal ? () => {
									triggerHaptic("card");
									onAction({
										type: "playCard",
										cardId: card.id
									});
								} : void 0
							})
						}, card.id);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-1 text-center text-[10px] uppercase tracking-[0.2em] text-sage",
					children: [
						nameOf(view.mySeat),
						seats.find((s) => s.seat === view.mySeat)?.isBot ? " · bot" : "",
						" · ",
						view.seats[view.mySeat].tricks,
						" tricks"
					]
				})]
			}),
			(view.phase === "handEnd" || view.phase === "matchEnd") && view.lastResult && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-30 flex items-center justify-center bg-ink/70 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-sm rounded-xl border border-line bg-felt p-6 text-center shadow-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] uppercase tracking-[0.22em] text-sage",
							children: view.phase === "matchEnd" ? "Match over" : "Hand over"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mt-2 font-display text-4xl font-semibold",
							children: view.lastResult.kot ? "Court" : "Won"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2 text-sm text-cream-dim",
							children: [
								view.lastResult.winner === 0 ? "North–South" : "East–West",
								" take it",
								" ",
								view.lastResult.nsTricks,
								"–",
								view.lastResult.ewTricks,
								view.lastResult.kot ? " without reply — a kot." : ".",
								view.lastResult.sevenStraight ? " Seven straight hands: extra court." : ""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 font-mono text-sm tabular-nums text-sage",
							children: [
								"NS ",
								view.scores[0],
								" · EW ",
								view.scores[1],
								" · first to ",
								view.target
							]
						}),
						view.phase === "matchEnd" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "mt-5 w-full",
							onClick: onLeave,
							children: "Back to lobby"
						})
					]
				})
			})
		]
	});
}
//#endregion
export { teamOf as a, createMatch as i, applyAction as n, toClientView as o, botAction as r, GameTable as t };
