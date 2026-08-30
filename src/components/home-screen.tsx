import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { loadName, normalizeCode, roomCode, saveName } from "@/lib/names";
import { bindAudioUnlock, sfx, unlockAudio } from "@/lib/audio";
import { useEffect } from "react";
import { AndroidAppModal } from "./android-app-modal";
import { triggerHaptic } from "@/lib/mobile-native";

export function HomeScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  useEffect(() => {
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
    void navigate({ to: "/play/$code", params: { code: id }, search: { host: true } });
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const id = normalizeCode(code);
    if (id.length < 4) return;
    persist();
    void navigate({ to: "/play/$code", params: { code: id }, search: { host: false } });
  }

  return (
    <main className="felt-bg relative min-h-dvh overflow-hidden px-5 py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(243,234,216,0.08),transparent_60%)]" />
      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.28em] text-sage">Court Piece · Rang · Hokm</p>
          <button
            onClick={() => {
              sfx.tap();
              triggerHaptic("tap");
              setShowAndroidModal(true);
            }}
            className="flex items-center gap-1.5 rounded-full border border-sage/40 bg-sage/10 px-2.5 py-1 text-[11px] font-medium text-sage hover:border-sage hover:bg-sage/20 hover:text-cream transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.552 0 .9997.4482.9997.9993s-.4477.9997-.9997.9997zm-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.552 0 .9997.4482.9997.9993s-.4477.9997-.9997.9997zm11.4045-6.02l1.9973-3.4592c.1197-.207.0483-.4721-.1587-.5918-.207-.1197-.4721-.0483-.5918.1587l-2.0284 3.513c-1.4682-.672-3.1118-1.0487-4.8989-1.0487s-3.4307.3767-4.8989 1.0487l-2.0284-3.513c-.1197-.207-.3848-.2784-.5918-.1587-.207.1197-.2784.3848-.1587.5918l1.9973 3.4592c-3.1557 1.7042-5.321 4.9085-5.6175 8.6791h22.096c-.2965-3.7706-2.4618-6.9749-5.6175-8.6791z" />
            </svg>
            Android App
          </button>
        </div>

        <h1 className="mt-3 font-display text-6xl font-semibold leading-none tracking-tight text-cream sm:text-7xl">
          Trup Chal
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-dim">
          Four players, two teams, one turup. Deal five, call the suit, and fight to seven tricks.
          Sit with friends on a private table — or practise against the house.
        </p>

        <label className="mt-8 block text-[11px] uppercase tracking-[0.18em] text-sage">
          Your name
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 18))}
            placeholder="e.g. Kabir"
            className="mt-2 block h-11 w-full rounded-md border border-line bg-ink/50 px-3 text-sm text-cream outline-none placeholder:text-sage/70 focus:border-cream/40"
          />
        </label>

        <div className="mt-6 flex flex-col gap-3">
          <Button className="h-12 w-full text-base" onClick={create}>
            Create table
          </Button>
          <Button
            variant="secondary"
            className="h-12 w-full"
            onClick={() => {
              persist();
              setJoining((v) => !v);
            }}
          >
            Join with code
          </Button>
        </div>

        {joining && (
          <form onSubmit={join} className="mt-3 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(normalizeCode(e.target.value))}
              placeholder="A7K2QM"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="h-11 flex-1 rounded-md border border-line bg-ink/50 px-3 font-mono text-sm tracking-[0.2em] text-cream uppercase outline-none placeholder:tracking-normal placeholder:text-sage/70 focus:border-cream/40"
            />
            <Button type="submit" disabled={normalizeCode(code).length < 4}>
              Sit
            </Button>
          </form>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link
            to="/practice"
            onClick={persist}
            className="rounded-lg border border-line bg-ink/30 px-4 py-4 transition-colors hover:border-sage"
          >
            <div className="font-display text-xl font-semibold">Practice</div>
            <p className="mt-1 text-xs leading-relaxed text-sage">You plus three bots. Full rules.</p>
          </Link>
          <Link
            to="/hotseat"
            onClick={persist}
            className="rounded-lg border border-line bg-ink/30 px-4 py-4 transition-colors hover:border-sage"
          >
            <div className="font-display text-xl font-semibold">Pass & play</div>
            <p className="mt-1 text-xs leading-relaxed text-sage">Four friends, one phone.</p>
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-between text-xs text-sage">
          <Link to="/rules" className="underline-offset-4 hover:text-cream hover:underline">
            How to play
          </Link>
          <button
            onClick={() => {
              sfx.tap();
              triggerHaptic("tap");
              setShowAndroidModal(true);
            }}
            className="max-w-[15rem] text-right leading-relaxed text-sage hover:text-cream underline-offset-4 hover:underline"
          >
            📱 Android App: Install or package APK →
          </button>
        </div>

        {/* Android App Modal */}
        <AndroidAppModal isOpen={showAndroidModal} onClose={() => setShowAndroidModal(false)} />
      </div>
    </main>
  );
}
