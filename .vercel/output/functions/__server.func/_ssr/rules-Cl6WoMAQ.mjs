import { R as require_jsx_runtime, _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rules-Cl6WoMAQ.js
var import_jsx_runtime = require_jsx_runtime();
function RulesContent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "felt-bg min-h-dvh px-5 py-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-2xl pb-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "text-xs tracking-wide text-sage hover:text-cream",
					children: "Back"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 text-[11px] uppercase tracking-[0.28em] text-sage",
					children: "The real game"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 font-display text-5xl font-semibold",
					children: "Trup Chal"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm leading-relaxed text-cream-dim",
					children: "Also called Court Piece, Turup Chaal, Rang, or Hokm. A four-player partnership trick-taker from the Indian subcontinent — the same game families play on Sunday mornings. This table follows the common 5–4–4 deal and first-to-seven scoring."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "The table",
					children: "Four players sit in a square. Partners sit opposite: North with South, East with West. You may not talk about the cards. Play and deal run anti-clockwise."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "The pack",
					children: "A standard 52-card deck. Rank, high to low: A K Q J 10 9 8 7 6 5 4 3 2. Suits are equal until a turup (trump) is named."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "The deal — 5, then 4, then 4",
					children: "The player to the dealer’s left (next, anti-clockwise) is the trump caller. Everyone is dealt five cards first. The caller looks at those five and names the turup — spades, hearts, diamonds, or clubs. The rest of the pack is then dealt, four and four, so each player holds thirteen. The caller leads the first chal (trick)."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Redeal",
					children: "If the caller’s first five contain no court card (A, K, Q, or J), they may throw the hand in and ask for a fresh deal. At most two redeals in a row."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Play",
					children: "The leader may play any card. Each player in turn must follow suit if they can. If they are void, they may kaat (cut) with turup, or throw any other card. The trick is won by the highest turup in it; if nobody cut, by the highest card of the suit led. The winner leads the next chal."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Winning the hand",
					children: [
						"First team to seven tricks wins the hand. The remaining cards are not played.",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-3 list-disc space-y-1 pl-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Ordinary win (7–6 down to 7–1): 1 point." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Court / kot — you take the first seven and the other side has none: 2 points." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Seven straight hands without a court: another court is added (the old “saat haath” rule)." })
							]
						}),
						"First team to 7 points wins the match."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Who deals next",
					children: "If the caller’s team made their seven, the same dealer deals again. If they failed, the deal passes anti-clockwise."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "How to sit with friends",
					children: "Create a table to get a six-character code. Send it to three friends. They open the app, tap Join with code, and sit. Empty chairs can be filled with bots so you can start with two or three people. On a phone, Chrome’s Install app puts Trup Chal on the home screen like any other Android app."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "House notes",
					children: "No signalling. No looking into another hand. A card once played stays played. Bots on this table play a sound, conservative game — they follow, they cut when the trick is slipping, and they dump junk when partner is already winning."
				})
			]
		})
	});
}
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-2xl font-semibold",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 text-sm leading-relaxed text-cream-dim",
			children
		})]
	});
}
function Rules() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RulesContent, {});
}
//#endregion
export { Rules as component };
