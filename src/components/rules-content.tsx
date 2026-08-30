import { Link } from "@tanstack/react-router";

export function RulesContent() {
  return (
    <main className="felt-bg min-h-dvh px-5 py-8">
      <div className="mx-auto max-w-2xl pb-16">
        <Link to="/" className="text-xs tracking-wide text-sage hover:text-cream">
          Back
        </Link>
        <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-sage">The real game</p>
        <h1 className="mt-2 font-display text-5xl font-semibold">Trup Chal</h1>
        <p className="mt-4 text-sm leading-relaxed text-cream-dim">
          Also called Court Piece, Turup Chaal, Rang, or Hokm. A four-player partnership
          trick-taker from the Indian subcontinent — the same game families play on Sunday
          mornings. This table follows the common 5–4–4 deal and first-to-seven scoring.
        </p>

        <Section title="The table">
          Four players sit in a square. Partners sit opposite: North with South, East with West.
          You may not talk about the cards. Play and deal run anti-clockwise.
        </Section>

        <Section title="The pack">
          A standard 52-card deck. Rank, high to low: A K Q J 10 9 8 7 6 5 4 3 2. Suits are equal
          until a turup (trump) is named.
        </Section>

        <Section title="The deal — 5, then 4, then 4">
          The player to the dealer’s left (next, anti-clockwise) is the trump caller. Everyone is
          dealt five cards first. The caller looks at those five and names the turup — spades,
          hearts, diamonds, or clubs. The rest of the pack is then dealt, four and four, so each
          player holds thirteen. The caller leads the first chal (trick).
        </Section>

        <Section title="Redeal">
          If the caller’s first five contain no court card (A, K, Q, or J), they may throw the
          hand in and ask for a fresh deal. At most two redeals in a row.
        </Section>

        <Section title="Play">
          The leader may play any card. Each player in turn must follow suit if they can. If they
          are void, they may kaat (cut) with turup, or throw any other card. The trick is won by
          the highest turup in it; if nobody cut, by the highest card of the suit led. The winner
          leads the next chal.
        </Section>

        <Section title="Winning the hand">
          First team to seven tricks wins the hand. The remaining cards are not played.
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Ordinary win (7–6 down to 7–1): 1 point.</li>
            <li>
              Court / kot — you take the first seven and the other side has none: 2 points.
            </li>
            <li>
              Seven straight hands without a court: another court is added (the old “saat haath”
              rule).
            </li>
          </ul>
          First team to 7 points wins the match.
        </Section>

        <Section title="Who deals next">
          If the caller’s team made their seven, the same dealer deals again. If they failed, the
          deal passes anti-clockwise.
        </Section>

        <Section title="How to sit with friends">
          Create a table to get a six-character code. Send it to three friends. They open the app,
          tap Join with code, and sit. Empty chairs can be filled with bots so you can start with
          two or three people. On a phone, Chrome’s Install app puts Trup Chal on the home screen
          like any other Android app.
        </Section>

        <Section title="House notes">
          No signalling. No looking into another hand. A card once played stays played. Bots on
          this table play a sound, conservative game — they follow, they cut when the trick is
          slipping, and they dump junk when partner is already winning.
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="mt-3 text-sm leading-relaxed text-cream-dim">{children}</div>
    </section>
  );
}
