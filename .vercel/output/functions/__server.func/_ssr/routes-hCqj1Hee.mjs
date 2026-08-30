import { o as __toESM } from "../_runtime.mjs";
import { R as require_jsx_runtime, _ as Link, v as useNavigate, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as unlockAudio, a as getHapticsEnabled, c as normalizeCode, d as roomCode, f as saveName, g as triggerHaptic, m as sfx, n as bindAudioUnlock, o as isStandalone, p as setHapticsEnabled, s as loadName, t as Button } from "./mobile-native-Bdp_UzMx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-hCqj1Hee.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AndroidAppModal({ isOpen, onClose }) {
	const [deferredPrompt, setDeferredPrompt] = (0, import_react.useState)(null);
	const [installed, setInstalled] = (0, import_react.useState)(false);
	const [activeTab, setActiveTab] = (0, import_react.useState)("install");
	const [hapticsOn, setHapticsOn] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		setHapticsOn(getHapticsEnabled());
		setInstalled(isStandalone());
		const handleBeforeInstall = (e) => {
			e.preventDefault();
			setDeferredPrompt(e);
		};
		window.addEventListener("beforeinstallprompt", handleBeforeInstall);
		return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
	}, []);
	if (!isOpen) return null;
	async function handleInstallPwa() {
		triggerHaptic("tap");
		sfx.tap();
		if (deferredPrompt) {
			deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;
			if (outcome === "accepted") setInstalled(true);
			setDeferredPrompt(null);
		} else alert("To install on Android:\n1. Tap the 3 dots (⋮) in Chrome menu.\n2. Tap 'Add to Home screen' or 'Install app'.");
	}
	function toggleHaptics() {
		const next = !hapticsOn;
		setHapticsOn(next);
		setHapticsEnabled(next);
		if (next) triggerHaptic("trump");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative w-full max-w-lg rounded-2xl border border-line bg-ink p-6 shadow-2xl text-cream",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						triggerHaptic("tap");
						onClose();
					},
					className: "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-cream/10 text-cream/70 hover:bg-cream/20 hover:text-cream",
					children: "✕"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-12 w-12 items-center justify-center rounded-xl bg-sage/20 border border-sage/40",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							viewBox: "0 0 24 24",
							className: "h-7 w-7 fill-sage",
							xmlns: "http://www.w3.org/2000/svg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.552 0 .9997.4482.9997.9993s-.4477.9997-.9997.9997zm-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.552 0 .9997.4482.9997.9993s-.4477.9997-.9997.9997zm11.4045-6.02l1.9973-3.4592c.1197-.207.0483-.4721-.1587-.5918-.207-.1197-.4721-.0483-.5918.1587l-2.0284 3.513c-1.4682-.672-3.1118-1.0487-4.8989-1.0487s-3.4307.3767-4.8989 1.0487l-2.0284-3.513c-.1197-.207-.3848-.2784-.5918-.1587-.207.1197-.2784.3848-.1587.5918l1.9973 3.4592c-3.1557 1.7042-5.321 4.9085-5.6175 8.6791h22.096c-.2965-3.7706-2.4618-6.9749-5.6175-8.6791z" })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl font-bold tracking-tight text-cream",
						children: "Android App"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-sage",
						children: "Trup Chal (Court Piece / Rang) on Mobile"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex border-b border-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setActiveTab("install"),
							className: `pb-2.5 px-3 text-xs font-medium transition-colors ${activeTab === "install" ? "border-b-2 border-sage text-cream" : "text-sage/70 hover:text-cream"}`,
							children: "Direct Install (PWA)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setActiveTab("apk"),
							className: `pb-2.5 px-3 text-xs font-medium transition-colors ${activeTab === "apk" ? "border-b-2 border-sage text-cream" : "text-sage/70 hover:text-cream"}`,
							children: "Build Android APK"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setActiveTab("features"),
							className: `pb-2.5 px-3 text-xs font-medium transition-colors ${activeTab === "features" ? "border-b-2 border-sage text-cream" : "text-sage/70 hover:text-cream"}`,
							children: "Mobile Settings"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 text-sm leading-relaxed text-cream-dim",
					children: [
						activeTab === "install" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Install Trup Chal directly to your Android home screen as a full-screen, fast standalone app without needing the Google Play Store." }),
								installed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-3 text-emerald-300 text-xs flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-base",
										children: "✓"
									}), "Trup Chal is already installed on your home screen!"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									className: "w-full h-12 text-base font-semibold",
									onClick: handleInstallPwa,
									children: "📲 Install App to Home Screen"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-ink/60 p-3 text-xs text-sage border border-line space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-semibold text-cream",
										children: "Manual Steps on Android Chrome / Edge:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
										className: "list-decimal pl-4 space-y-1 text-sage/90",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
												"Tap the 3 dots ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "(⋮)" }),
												" in Chrome menu (top-right)."
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
												"Tap ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Add to Home screen\"" }),
												" or ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\"Install app\"" }),
												"."
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Launch Trup Chal from your home screen for full-screen play!" })
										]
									})]
								})
							]
						}),
						activeTab === "apk" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									"This project includes complete ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Capacitor 6" }),
									" config to build a native Android APK file using Android Studio or Gradle."
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-black/40 border border-line p-3 font-mono text-xs text-sage space-y-1.5 overflow-x-auto",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-cream font-sans font-semibold",
											children: "Build Native APK Commands:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-amber-300",
											children: "# 1. Build web assets"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "npm run build" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-amber-300",
											children: "# 2. Add Android platform & sync"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "npx cap add android" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "npx cap sync android" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-amber-300",
											children: "# 3. Open in Android Studio or compile APK"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "npx cap open android" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-sage",
									children: [
										"Capacitor configuration file ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "text-cream",
											children: "capacitor.config.json"
										}),
										" is ready in the root workspace!"
									]
								})
							]
						}),
						activeTab === "features" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between rounded-lg bg-ink/60 border border-line p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-semibold text-cream",
									children: "Vibration Haptics"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-sage",
									children: "Feel haptic feedback on card play, trump call & trick win."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: toggleHaptics,
									className: `relative h-6 w-11 rounded-full transition-colors ${hapticsOn ? "bg-emerald-600" : "bg-sage/30"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `inline-block h-5 w-5 transform rounded-full bg-cream transition-transform ${hapticsOn ? "translate-x-5" : "translate-x-0.5"}` })
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-ink/60 border border-line p-3 text-xs space-y-2 text-sage",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-semibold text-cream text-sm",
										children: "Android App Capabilities"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-emerald-400",
											children: "✓"
										}), " Offline Practice Mode (Play vs 3 AI Bots without internet)"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-emerald-400",
											children: "✓"
										}), " Responsive Touch Layout (Portrait & Landscape)"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-emerald-400",
											children: "✓"
										}), " Screen Wake Lock (Keeps display lit during matches)"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-emerald-400",
											children: "✓"
										}), " Sound Effects & Custom Card Deck Animations"]
									})
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex justify-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						onClick: onClose,
						className: "h-10 px-5",
						children: "Done"
					})
				})
			]
		})
	});
}
function HomeScreen() {
	const navigate = useNavigate();
	const [name, setName] = (0, import_react.useState)("");
	const [code, setCode] = (0, import_react.useState)("");
	const [joining, setJoining] = (0, import_react.useState)(false);
	const [showAndroidModal, setShowAndroidModal] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setName(loadName());
		return bindAudioUnlock();
	}, []);
	const readyName = name.trim() || "You";
	function persist() {
		saveName(readyName);
		unlockAudio();
		sfx.tap();
		triggerHaptic("tap");
	}
	function create() {
		persist();
		const id = roomCode();
		navigate({
			to: "/play/$code",
			params: { code: id },
			search: { host: true }
		});
	}
	function join(e) {
		e.preventDefault();
		const id = normalizeCode(code);
		if (id.length < 4) return;
		persist();
		navigate({
			to: "/play/$code",
			params: { code: id },
			search: { host: false }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "felt-bg relative min-h-dvh overflow-hidden px-5 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(243,234,216,0.08),transparent_60%)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] uppercase tracking-[0.28em] text-sage",
						children: "Court Piece · Rang · Hokm"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							sfx.tap();
							triggerHaptic("tap");
							setShowAndroidModal(true);
						},
						className: "flex items-center gap-1.5 rounded-full border border-sage/40 bg-sage/10 px-2.5 py-1 text-[11px] font-medium text-sage hover:border-sage hover:bg-sage/20 hover:text-cream transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
							viewBox: "0 0 24 24",
							className: "h-3.5 w-3.5 fill-current",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.552 0 .9997.4482.9997.9993s-.4477.9997-.9997.9997zm-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.552 0 .9997.4482.9997.9993s-.4477.9997-.9997.9997zm11.4045-6.02l1.9973-3.4592c.1197-.207.0483-.4721-.1587-.5918-.207-.1197-.4721-.0483-.5918.1587l-2.0284 3.513c-1.4682-.672-3.1118-1.0487-4.8989-1.0487s-3.4307.3767-4.8989 1.0487l-2.0284-3.513c-.1197-.207-.3848-.2784-.5918-.1587-.207.1197-.2784.3848-.1587.5918l1.9973 3.4592c-3.1557 1.7042-5.321 4.9085-5.6175 8.6791h22.096c-.2965-3.7706-2.4618-6.9749-5.6175-8.6791z" })
						}), "Android App"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-6xl font-semibold leading-none tracking-tight text-cream sm:text-7xl",
					children: "Trup Chal"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-sm text-sm leading-relaxed text-cream-dim",
					children: "Four players, two teams, one turup. Deal five, call the suit, and fight to seven tricks. Sit with friends on a private table — or practise against the house."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-8 block text-[11px] uppercase tracking-[0.18em] text-sage",
					children: ["Your name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: name,
						onChange: (e) => setName(e.target.value.slice(0, 18)),
						placeholder: "e.g. Kabir",
						className: "mt-2 block h-11 w-full rounded-md border border-line bg-ink/50 px-3 text-sm text-cream outline-none placeholder:text-sage/70 focus:border-cream/40"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-col gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "h-12 w-full text-base",
						onClick: create,
						children: "Create table"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "h-12 w-full",
						onClick: () => {
							persist();
							setJoining((v) => !v);
						},
						children: "Join with code"
					})]
				}),
				joining && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: join,
					className: "mt-3 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: code,
						onChange: (e) => setCode(normalizeCode(e.target.value)),
						placeholder: "A7K2QM",
						autoCapitalize: "characters",
						autoCorrect: "off",
						spellCheck: false,
						className: "h-11 flex-1 rounded-md border border-line bg-ink/50 px-3 font-mono text-sm tracking-[0.2em] text-cream uppercase outline-none placeholder:tracking-normal placeholder:text-sage/70 focus:border-cream/40"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						disabled: normalizeCode(code).length < 4,
						children: "Sit"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/practice",
						onClick: persist,
						className: "rounded-lg border border-line bg-ink/30 px-4 py-4 transition-colors hover:border-sage",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-xl font-semibold",
							children: "Practice"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs leading-relaxed text-sage",
							children: "You plus three bots. Full rules."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/hotseat",
						onClick: persist,
						className: "rounded-lg border border-line bg-ink/30 px-4 py-4 transition-colors hover:border-sage",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-display text-xl font-semibold",
							children: "Pass & play"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs leading-relaxed text-sage",
							children: "Four friends, one phone."
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex items-center justify-between text-xs text-sage",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/rules",
						className: "underline-offset-4 hover:text-cream hover:underline",
						children: "How to play"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							sfx.tap();
							triggerHaptic("tap");
							setShowAndroidModal(true);
						},
						className: "max-w-[15rem] text-right leading-relaxed text-sage hover:text-cream underline-offset-4 hover:underline",
						children: "📱 Android App: Install or package APK →"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AndroidAppModal, {
					isOpen: showAndroidModal,
					onClose: () => setShowAndroidModal(false)
				})
			]
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeScreen, {});
}
//#endregion
export { Home as component };
