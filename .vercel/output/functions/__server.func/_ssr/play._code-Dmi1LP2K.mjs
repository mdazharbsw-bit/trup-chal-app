import { o as __toESM } from "../_runtime.mjs";
import { R as require_jsx_runtime, v as useNavigate, z as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as unlockAudio, c as normalizeCode, g as triggerHaptic, h as shareGame, i as cn, m as sfx, n as bindAudioUnlock, r as botName, s as loadName, t as Button } from "./mobile-native-Bdp_UzMx.mjs";
import { i as createMatch, n as applyAction, o as toClientView, r as botAction, t as GameTable } from "./game-table-frxscOSp.mjs";
import { n as Route } from "./router-DHWAXhRe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/play._code-Dmi1LP2K.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FAST_POLL_MS = 400;
var IDLE_POLL_MS = 2e3;
var PING_INTERVAL_MS = 2e3;
var STALL_MS = 1e4;
var MAX_RECOVERY_ATTEMPTS = 3;
var SIGNAL_RETRY_DELAYS_MS = [250, 750];
function defaultIceServers() {
	return [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
}
var P2PRoom = class {
	opts;
	peers = /* @__PURE__ */ new Map();
	/** Per-remote-peer signal delivery chains (order-preserving). */
	signalQueues = /* @__PURE__ */ new Map();
	cursor = 0;
	pollTimer = null;
	pingTimer = null;
	closed = false;
	everPolled = false;
	lastPeersFingerprint = "";
	constructor(opts) {
		this.opts = opts;
	}
	/**
	* The first poll IS the join: it registers this peer and returns the
	* roster. A failed first poll (cold DB, offline tab) must not strand the
	* room: the loop and timers start regardless and the next poll retries.
	*/
	async join() {
		try {
			await this.pollOnce();
		} catch {}
		if (this.closed) return;
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
		this.pingTimer = setInterval(() => {
			this.pingAll();
			this.watchdog();
		}, PING_INTERVAL_MS);
	}
	close() {
		this.closed = true;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		if (this.pingTimer) clearInterval(this.pingTimer);
		for (const slot of this.peers.values()) slot.pc.close();
		this.peers.clear();
		fetch("/api/rtc", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				op: "leave",
				room: this.opts.room,
				peer: this.opts.selfId
			}),
			keepalive: true
		}).catch(() => {});
	}
	/** Send on the unreliable game-state channel (drops stale packets). */
	broadcast(data) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		for (const slot of this.peers.values()) if (slot.state?.readyState === "open") slot.state.send(wire);
	}
	/** Send reliably (ordered) to one peer, or to all when peerId is omitted. */
	send(data, peerId) {
		const wire = JSON.stringify({
			t: "d",
			d: data
		});
		const targets = peerId ? [this.peers.get(peerId)] : [...this.peers.values()];
		for (const slot of targets) if (slot?.reliable?.readyState === "open") slot.reliable.send(wire);
	}
	peerList() {
		return [...this.peers.values()].map((s) => ({ ...s.info }));
	}
	schedulePoll(delay) {
		if (this.closed) return;
		if (this.pollTimer) clearTimeout(this.pollTimer);
		this.pollTimer = setTimeout(() => void this.poll(), delay);
	}
	anyPairConnecting() {
		for (const s of this.peers.values()) {
			if (s.terminal) continue;
			if (s.info.connectionState !== "connected") return true;
		}
		return false;
	}
	async pollOnce() {
		const params = new URLSearchParams({
			room: this.opts.room,
			peer: this.opts.selfId,
			name: this.opts.name ?? "",
			since: String(this.cursor)
		});
		const res = await fetch(`/api/rtc?${params}`);
		if (this.closed) return;
		if (!res.ok) throw new Error(`signaling poll failed: ${res.status}`);
		const body = await res.json();
		if (this.closed) return;
		if (!this.everPolled) {
			this.everPolled = true;
			this.opts.onConnected?.();
		}
		this.reconcileRoster(body.peers);
		const roster = new Set(body.peers.map((p) => p.id));
		for (const sig of body.signals) {
			this.cursor = Math.max(this.cursor, sig.id);
			await this.onSignal(sig.from, sig.kind, sig.payload, roster);
			if (this.closed) return;
		}
	}
	async poll() {
		if (this.closed) return;
		try {
			await this.pollOnce();
		} catch {}
		this.schedulePoll(this.anyPairConnecting() ? FAST_POLL_MS : IDLE_POLL_MS);
	}
	reconcileRoster(peers) {
		const alive = new Set(peers.map((p) => p.id));
		for (const p of peers) {
			if (p.id === this.opts.selfId) continue;
			const existing = this.peers.get(p.id);
			if (existing) existing.info.name = p.name;
			else this.connectTo(p.id, p.name, this.opts.selfId > p.id);
		}
		for (const [id, slot] of this.peers) if (!alive.has(id)) {
			slot.pc.close();
			this.peers.delete(id);
		}
		this.emitPeers();
	}
	connectTo(peerId, name, initiator) {
		if (this.closed) return null;
		const pc = new RTCPeerConnection({ iceServers: this.opts.iceServers ?? defaultIceServers() });
		const slot = {
			pc,
			makingOffer: false,
			ignoreOffer: false,
			pendingCandidates: [],
			lastProgressAt: Date.now(),
			recoveryAttempts: 0,
			info: {
				id: peerId,
				name,
				connectionState: pc.connectionState,
				candidateType: null,
				rttMs: null
			}
		};
		this.peers.set(peerId, slot);
		pc.onicecandidate = (e) => {
			if (e.candidate) this.sendSignal(peerId, "ice", e.candidate.toJSON());
		};
		pc.onconnectionstatechange = () => {
			slot.info.connectionState = pc.connectionState;
			if (pc.connectionState === "connecting" || pc.connectionState === "connected") slot.lastProgressAt = Date.now();
			if (pc.connectionState === "connected") {
				slot.recoveryAttempts = 0;
				slot.terminal = false;
				this.readCandidateType(slot);
			}
			this.emitPeers();
			if (pc.connectionState === "failed") pc.restartIce();
			if (pc.connectionState === "failed" || pc.connectionState === "disconnected") this.schedulePoll(FAST_POLL_MS);
		};
		pc.onnegotiationneeded = async () => {
			try {
				slot.makingOffer = true;
				await pc.setLocalDescription();
				await this.sendSignal(peerId, "offer", pc.localDescription.toJSON());
			} catch {} finally {
				slot.makingOffer = false;
			}
		};
		pc.ondatachannel = (e) => this.attachChannel(slot, e.channel);
		if (initiator) {
			this.attachChannel(slot, pc.createDataChannel("state", {
				ordered: false,
				maxRetransmits: 0
			}));
			this.attachChannel(slot, pc.createDataChannel("reliable", { ordered: true }));
		}
		return slot;
	}
	attachChannel(slot, channel) {
		if (channel.label === "state") slot.state = channel;
		else slot.reliable = channel;
		channel.onopen = () => {
			slot.lastProgressAt = Date.now();
		};
		channel.onmessage = (e) => {
			let msg;
			try {
				msg = JSON.parse(e.data);
			} catch {
				return;
			}
			if (msg.t === "ping") {
				if (slot.state?.readyState === "open") slot.state.send(JSON.stringify({ t: "pong" }));
			} else if (msg.t === "pong") {
				if (slot.pingSentAt) {
					slot.info.rttMs = Math.round(performance.now() - slot.pingSentAt);
					slot.pingSentAt = void 0;
					this.emitPeers();
				}
			} else this.opts.onMessage?.(slot.info.id, msg.d, channel.label === "state" ? "state" : "reliable");
		};
	}
	/** Apply buffered ICE candidates once a remote description is in place. */
	async flushPendingCandidates(slot) {
		while (slot.pendingCandidates.length > 0) {
			const candidate = slot.pendingCandidates.shift();
			try {
				await slot.pc.addIceCandidate(candidate);
			} catch (err) {
				if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
			}
			if (this.closed) return;
		}
	}
	async onSignal(from, kind, payload, roster) {
		if (this.closed) return;
		let slot = this.peers.get(from);
		if (!slot) {
			if (!roster.has(from)) return;
			const created = this.connectTo(from, "", false);
			if (!created) return;
			slot = created;
		}
		const polite = this.opts.selfId < from;
		try {
			if (kind === "offer" || kind === "answer") {
				const description = payload;
				const collision = kind === "offer" && (slot.makingOffer || slot.pc.signalingState !== "stable");
				slot.ignoreOffer = !polite && collision;
				if (slot.ignoreOffer) return;
				try {
					await slot.pc.setRemoteDescription(description);
				} catch (err) {
					if (kind !== "offer" || slot.recreatedForOffer) throw err;
					const attempts = slot.recoveryAttempts;
					const name = slot.info.name;
					slot.pc.close();
					this.peers.delete(from);
					const fresh = this.connectTo(from, name, false);
					if (!fresh) return;
					fresh.recoveryAttempts = attempts;
					fresh.recreatedForOffer = true;
					slot = fresh;
					await slot.pc.setRemoteDescription(description);
				}
				if (this.closed) return;
				await this.flushPendingCandidates(slot);
				if (this.closed) return;
				if (kind === "offer") {
					await slot.pc.setLocalDescription();
					if (this.closed) return;
					await this.sendSignal(from, "answer", slot.pc.localDescription.toJSON());
				}
			} else if (kind === "ice") {
				const candidate = payload;
				if (!slot.pc.remoteDescription) {
					slot.pendingCandidates.push(candidate);
					return;
				}
				try {
					await slot.pc.addIceCandidate(candidate);
				} catch (err) {
					if (!slot.ignoreOffer) console.warn("[p2p] addIceCandidate failed:", err);
				}
			}
		} catch {}
	}
	/**
	* Signals are serialized per remote peer (a candidate must never overtake
	* its SDP into the DB) and retried on failure with short backoff.
	*/
	sendSignal(to, kind, payload) {
		const next = (this.signalQueues.get(to) ?? Promise.resolve()).then(() => this.postSignal(to, kind, payload));
		this.signalQueues.set(to, next.catch(() => {}));
		return next;
	}
	async postSignal(to, kind, payload) {
		for (let attempt = 0;; attempt++) {
			if (this.closed) return;
			try {
				const res = await fetch("/api/rtc", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						op: "signal",
						room: this.opts.room,
						from: this.opts.selfId,
						to,
						kind,
						payload
					})
				});
				if (res.ok) return;
				throw new Error(`signal POST failed: ${res.status}`);
			} catch (err) {
				if (attempt >= SIGNAL_RETRY_DELAYS_MS.length) {
					console.warn(`[p2p] signal ${kind} to ${to} failed after retries`, err);
					return;
				}
				await new Promise((r) => setTimeout(r, SIGNAL_RETRY_DELAYS_MS[attempt]));
			}
		}
	}
	pingAll() {
		const wire = JSON.stringify({ t: "ping" });
		for (const slot of this.peers.values()) {
			if (slot.state?.readyState !== "open") continue;
			const stale = slot.pingSentAt !== void 0 && performance.now() - slot.pingSentAt > 2 * PING_INTERVAL_MS;
			if (slot.pingSentAt === void 0 || stale) {
				slot.pingSentAt = performance.now();
				slot.state.send(wire);
			}
		}
	}
	/**
	* Stuck-pair recovery, piggybacked on the ping interval. A pair that has
	* made no progress for STALL_MS gets rebuilt by the dialer with a FRESH
	* RTCPeerConnection (new DTLS identity — fixes the suspend/resume
	* fingerprint wedge). After MAX_RECOVERY_ATTEMPTS the pair is terminal:
	* visible to the app as its last connectionState, ignored by fast-poll.
	*/
	watchdog() {
		if (this.closed) return;
		const now = Date.now();
		for (const [peerId, slot] of this.peers) {
			const live = slot.pc.connectionState;
			if (live !== slot.info.connectionState) {
				slot.info.connectionState = live;
				if (live === "connecting" || live === "connected") slot.lastProgressAt = now;
				this.emitPeers();
			}
			if (slot.terminal || live === "connected") continue;
			if (now - slot.lastProgressAt <= STALL_MS) continue;
			if (slot.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
				slot.terminal = true;
				this.emitPeers();
				continue;
			}
			slot.recoveryAttempts += 1;
			slot.lastProgressAt = now;
			if (this.opts.selfId > peerId) {
				const { name } = slot.info;
				const attempts = slot.recoveryAttempts;
				slot.pc.close();
				this.peers.delete(peerId);
				const fresh = this.connectTo(peerId, name, true);
				if (fresh) fresh.recoveryAttempts = attempts;
				this.schedulePoll(FAST_POLL_MS);
			}
		}
	}
	async readCandidateType(slot) {
		try {
			const stats = await slot.pc.getStats();
			let selected;
			stats.forEach((s) => {
				if (s.type === "candidate-pair" && s.nominated) selected = s;
			});
			const localId = selected?.localCandidateId;
			if (localId) {
				const local = stats.get(localId);
				slot.info.candidateType = local?.candidateType ?? null;
				this.emitPeers();
			}
		} catch {}
	}
	emitPeers() {
		const list = this.peerList();
		const fingerprint = JSON.stringify(list.map((p) => [
			p.id,
			p.name,
			p.connectionState,
			p.candidateType,
			p.rttMs
		]));
		if (fingerprint === this.lastPeersFingerprint) return;
		this.lastPeersFingerprint = fingerprint;
		this.opts.onPeersChanged?.(list);
	}
};
/**
* React binding for P2PRoom. Identity and room id are captured once on mount.
*/
function defaultRoom() {
	if (typeof window === "undefined") return "room-ssr";
	return `room-${window.location.hostname.split(".")[0]}`.slice(0, 64);
}
function useP2PRoom(options = {}) {
	const [selfId] = (0, import_react.useState)(() => `p-${Math.random().toString(36).slice(2, 10)}`);
	const [room] = (0, import_react.useState)(() => options.room ?? defaultRoom());
	const [name] = (0, import_react.useState)(() => options.name ?? selfId);
	const [peers, setPeers] = (0, import_react.useState)([]);
	const [joined, setJoined] = (0, import_react.useState)(false);
	const roomRef = (0, import_react.useRef)(null);
	const listeners = (0, import_react.useRef)(/* @__PURE__ */ new Set());
	(0, import_react.useEffect)(() => {
		const p2p = new P2PRoom({
			room,
			selfId,
			name,
			onPeersChanged: setPeers,
			onMessage: (from, data, channel) => {
				for (const fn of listeners.current) fn(from, data, channel);
			},
			onConnected: () => setJoined(true)
		});
		roomRef.current = p2p;
		p2p.join();
		return () => {
			roomRef.current = null;
			p2p.close();
		};
	}, [
		room,
		selfId,
		name
	]);
	return {
		selfId,
		room,
		peers,
		joined,
		broadcast: (0, import_react.useCallback)((data) => roomRef.current?.broadcast(data), []),
		send: (0, import_react.useCallback)((data, peerId) => roomRef.current?.send(data, peerId), []),
		onMessage: (0, import_react.useCallback)((fn) => {
			listeners.current.add(fn);
			return () => {
				listeners.current.delete(fn);
			};
		}, [])
	};
}
function emptyLobby(hostId, hostName) {
	return [
		{
			seat: 0,
			name: hostName,
			peerId: hostId,
			isBot: false
		},
		{
			seat: 1,
			name: "",
			peerId: null,
			isBot: false
		},
		{
			seat: 2,
			name: "",
			peerId: null,
			isBot: false
		},
		{
			seat: 3,
			name: "",
			peerId: null,
			isBot: false
		}
	];
}
function isUp(p) {
	return p.connectionState === "connected";
}
function OnlineTable({ code, isCreator }) {
	const navigate = useNavigate();
	const [myName] = (0, import_react.useState)(() => loadName() || "You");
	const p2p = useP2PRoom({
		room: code,
		name: myName
	});
	const [lobby, setLobby] = (0, import_react.useState)([]);
	const [hostId, setHostId] = (0, import_react.useState)(null);
	const [state, setState] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const seq = (0, import_react.useRef)(0);
	const stateRef = (0, import_react.useRef)(null);
	const lobbyRef = (0, import_react.useRef)([]);
	const acting = (0, import_react.useRef)(false);
	const seeded = (0, import_react.useRef)(false);
	const iAmHost = hostId === p2p.selfId || isCreator && hostId === null;
	(0, import_react.useEffect)(() => {
		stateRef.current = state;
	}, [state]);
	(0, import_react.useEffect)(() => {
		lobbyRef.current = lobby;
	}, [lobby]);
	(0, import_react.useEffect)(() => bindAudioUnlock(), []);
	(0, import_react.useEffect)(() => {
		if (!p2p.joined || seeded.current) return;
		if (!isCreator) return;
		seeded.current = true;
		setHostId(p2p.selfId);
		setLobby(emptyLobby(p2p.selfId, myName));
	}, [
		p2p.joined,
		p2p.selfId,
		isCreator,
		myName
	]);
	(0, import_react.useEffect)(() => {
		if (!iAmHost || !seeded.current || stateRef.current) return;
		setLobby((prev) => {
			if (prev.length === 0) return prev;
			let next = prev.map((s) => ({ ...s }));
			const known = new Set(next.map((s) => s.peerId).filter(Boolean));
			for (const peer of p2p.peers) {
				if (known.has(peer.id)) {
					next = next.map((s) => s.peerId === peer.id && peer.name ? {
						...s,
						name: peer.name
					} : s);
					continue;
				}
				const free = next.find((s) => !s.peerId && !s.isBot);
				if (!free) continue;
				next = next.map((s) => s.seat === free.seat ? {
					...s,
					name: peer.name || "Player",
					peerId: peer.id,
					isBot: false
				} : s);
				known.add(peer.id);
			}
			const live = new Set(p2p.peers.map((p) => p.id));
			live.add(p2p.selfId);
			next = next.map((s) => s.peerId && !live.has(s.peerId) ? {
				...s,
				peerId: null,
				name: "",
				isBot: false
			} : s);
			const changed = JSON.stringify(next) !== JSON.stringify(prev);
			if (changed) p2p.send({
				t: "lobby",
				seats: next,
				hostId: p2p.selfId
			});
			return changed ? next : prev;
		});
	}, [
		p2p.peers,
		p2p,
		iAmHost
	]);
	(0, import_react.useEffect)(() => {
		return p2p.onMessage((from, data) => {
			const msg = data;
			if (!msg || typeof msg !== "object" || !("t" in msg)) return;
			if (msg.t === "lobby") {
				setHostId(msg.hostId);
				setLobby(msg.seats);
				return;
			}
			if (msg.t === "start") {
				setLobby(msg.seats);
				setState(msg.state);
				sfx.deal();
				return;
			}
			if (msg.t === "snap") {
				if (msg.seq <= seq.current) return;
				seq.current = msg.seq;
				setState((prev) => {
					if (msg.state.phase === "trickEnd" && prev?.phase === "playing") sfx.play();
					if (msg.state.phase === "playing" && prev?.phase === "trickEnd") sfx.trick();
					if (msg.state.phase === "playing" && prev?.phase === "choosingTrump") sfx.deal();
					if ((msg.state.phase === "handEnd" || msg.state.phase === "matchEnd") && prev?.phase !== msg.state.phase) {
						if (msg.state.lastResult?.kot) sfx.kot();
						else sfx.win();
					}
					return msg.state;
				});
				return;
			}
			if (msg.t === "act") {
				if ((hostId ?? (isCreator ? p2p.selfId : null)) !== p2p.selfId) return;
				applyHost(msg.action, msg.actor);
			}
		});
	}, [
		p2p,
		hostId,
		isCreator
	]);
	(0, import_react.useEffect)(() => {
		if (!iAmHost) return;
		for (const peer of p2p.peers) {
			if (!isUp(peer)) continue;
			if (stateRef.current) p2p.send({
				t: "start",
				state: stateRef.current,
				seats: lobbyRef.current
			}, peer.id);
			else if (lobbyRef.current.length) p2p.send({
				t: "lobby",
				seats: lobbyRef.current,
				hostId: p2p.selfId
			}, peer.id);
		}
	}, [
		p2p.peers,
		p2p,
		iAmHost
	]);
	function applyHost(action, actor) {
		const cur = stateRef.current;
		if (!cur) return;
		try {
			const next = applyAction(cur, action, actor);
			seq.current += 1;
			setState(next);
			p2p.send({
				t: "snap",
				state: next,
				seq: seq.current
			});
			if (action.type === "playCard") sfx.play();
			if (action.type === "chooseTrump") sfx.deal();
			if (action.type === "collectTrick") sfx.trick();
			if (next.phase === "handEnd" || next.phase === "matchEnd") {
				if (next.lastResult?.kot) sfx.kot();
				else sfx.win();
			}
		} catch {
			sfx.illegal();
		}
	}
	function fillBot() {
		setLobby((prev) => {
			const free = prev.find((s) => !s.peerId && !s.isBot);
			if (!free) return prev;
			const next = prev.map((s) => s.seat === free.seat ? {
				...s,
				isBot: true,
				name: botName(free.seat, 4),
				peerId: null
			} : s);
			p2p.send({
				t: "lobby",
				seats: next,
				hostId: p2p.selfId
			});
			return next;
		});
	}
	function startGame() {
		const filled = lobby.map((s, i) => s.peerId || s.isBot ? s : {
			...s,
			isBot: true,
			name: botName(i, 9)
		});
		const seed = (Math.floor(Math.random() * 4294967295) || 1) >>> 0;
		const next = createMatch(seed, 3);
		seq.current = 1;
		setLobby(filled);
		setState(next);
		p2p.send({
			t: "start",
			state: next,
			seats: filled
		});
		sfx.deal();
	}
	(0, import_react.useEffect)(() => {
		if (!iAmHost || !state) return;
		if (state.phase === "matchEnd") return;
		if (state.phase === "trickEnd") {
			const t = window.setTimeout(() => applyHost({ type: "collectTrick" }, state.currentPlayer), 1100);
			return () => window.clearTimeout(t);
		}
		if (state.phase === "handEnd") {
			const t = window.setTimeout(() => applyHost({ type: "nextHand" }, 0), 1800);
			return () => window.clearTimeout(t);
		}
		const actor = state.currentPlayer;
		if (!lobby.find((s) => s.seat === actor)?.isBot) return;
		if (acting.current) return;
		acting.current = true;
		const t = window.setTimeout(() => {
			try {
				applyHost(botAction(state, actor), actor);
			} finally {
				acting.current = false;
			}
		}, 500 + Math.random() * 700);
		return () => {
			window.clearTimeout(t);
			acting.current = false;
		};
	}, [
		state,
		iAmHost,
		lobby
	]);
	const mySeat = lobby.find((s) => s.peerId === p2p.selfId)?.seat ?? (isCreator ? 0 : null);
	const filledCount = lobby.filter((s) => s.peerId || s.isBot).length;
	const humans = lobby.filter((s) => s.peerId).length;
	const peersReady = p2p.peers.filter((p) => lobby.some((s) => s.peerId === p.id)).every(isUp) || p2p.peers.length === 0;
	const seatInfos = (lobby.length ? lobby : emptyLobby(p2p.selfId, myName)).map((s) => ({
		seat: s.seat,
		name: s.name || (s.seat === 0 ? "South" : s.seat === 1 ? "East" : s.seat === 2 ? "North" : "West"),
		isBot: s.isBot,
		connected: !s.peerId || s.peerId === p2p.selfId || p2p.peers.find((p) => p.id === s.peerId)?.connectionState === "connected"
	}));
	async function copyCode() {
		triggerHaptic("tap");
		if (await shareGame(code, myName)) {
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2e3);
		}
	}
	if (!state || mySeat === null) {
		const rows = lobby.length ? lobby : emptyLobby(p2p.selfId, isCreator ? myName : "");
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "felt-bg min-h-dvh px-5 py-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => void navigate({ to: "/" }),
						className: "text-xs tracking-wide text-sage hover:text-cream",
						children: "Leave"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-8 text-[11px] uppercase tracking-[0.28em] text-sage",
						children: "Private table"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-5xl font-semibold",
						children: "Sit down"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-cream-dim",
						children: "Share this code. Partners sit opposite — South with North, East with West."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => void copyCode(),
						className: "mt-6 flex w-full items-center justify-between rounded-lg border border-line bg-ink/40 px-4 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono text-3xl tracking-[0.28em] text-cream",
							children: code
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-sage",
							children: copied ? "Copied" : "Copy"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-8 space-y-3",
						children: rows.map((s) => {
							const peer = s.peerId ? p2p.peers.find((p) => p.id === s.peerId) : null;
							const mine = s.peerId === p2p.selfId;
							const label = s.seat === 0 ? "South" : s.seat === 1 ? "East" : s.seat === 2 ? "North" : "West";
							const team = s.seat % 2 === 0 ? "NS" : "EW";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: cn("flex items-center justify-between rounded-md border px-4 py-3", mine ? "border-cream/40 bg-cream/10" : "border-line bg-ink/30"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[10px] uppercase tracking-[0.16em] text-sage",
									children: [
										label,
										" · ",
										team
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-sm font-medium",
									children: [s.name || (s.isBot ? "Bot" : "Empty"), mine ? " (you)" : ""]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-sage",
									children: s.peerId ? mine ? "Seated" : peer ? isUp(peer) ? "Connected" : peer.connectionState === "failed" ? "Can't reach" : "Linking…" : "Linking…" : s.isBot ? "Bot" : iAmHost ? "Open" : "Waiting"
								})]
							}, s.seat);
						})
					}),
					iAmHost && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-col gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								disabled: filledCount >= 4,
								onClick: fillBot,
								children: "Fill a seat with a bot"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								disabled: filledCount < 4 || !p2p.joined,
								onClick: () => {
									unlockAudio();
									startGame();
								},
								children: "Deal"
							}),
							!peersReady && humans > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-center text-xs text-sage",
								children: "Waiting for every phone to link…"
							})
						]
					}),
					!iAmHost && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-center text-sm text-sage",
						children: p2p.joined ? "Waiting for the host to deal." : "Joining the table…"
					})
				]
			})
		});
	}
	const seated = mySeat ?? 0;
	const view = toClientView(state, seated);
	const myTurn = state.currentPlayer === seated;
	const myHuman = Boolean(lobby.find((s) => s.seat === seated && s.peerId === p2p.selfId));
	function onAction(action) {
		unlockAudio();
		if (iAmHost) applyHost(action, seated);
		else p2p.send({
			t: "act",
			action,
			actor: seated
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameTable, {
		view,
		seats: seatInfos,
		canAct: myHuman && myTurn && (state.phase === "playing" || state.phase === "choosingTrump"),
		onAction,
		onLeave: () => void navigate({ to: "/" }),
		status: p2p.peers.some((p) => p.connectionState === "failed") ? "A friend could not connect. Try the same wifi, or fill the seat with a bot." : void 0
	});
}
function Play() {
	const { code } = Route.useParams();
	const { host } = Route.useSearch();
	const id = normalizeCode(code);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OnlineTable, {
		code: id,
		isCreator: host
	}, id);
}
//#endregion
export { Play as component };
