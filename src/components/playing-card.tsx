import { isRed } from "@/lib/game/cards";
import type { Card, Suit } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { SuitIcon } from "./suit-icon";

const PIPS: Record<string, Array<[number, number]>> = {
  "2": [
    [50, 22],
    [50, 78],
  ],
  "3": [
    [50, 20],
    [50, 50],
    [50, 80],
  ],
  "4": [
    [32, 24],
    [68, 24],
    [32, 76],
    [68, 76],
  ],
  "5": [
    [32, 24],
    [68, 24],
    [50, 50],
    [32, 76],
    [68, 76],
  ],
  "6": [
    [32, 22],
    [68, 22],
    [32, 50],
    [68, 50],
    [32, 78],
    [68, 78],
  ],
  "7": [
    [32, 20],
    [68, 20],
    [50, 36],
    [32, 50],
    [68, 50],
    [32, 80],
    [68, 80],
  ],
  "8": [
    [32, 18],
    [68, 18],
    [32, 40],
    [68, 40],
    [32, 60],
    [68, 60],
    [32, 82],
    [68, 82],
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
    [68, 82],
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
    [68, 84],
  ],
};

function Corner({ rank, suit, flip }: { rank: string; suit: Suit; flip?: boolean }) {
  const ten = rank === "10";
  return (
    <div
      className={cn(
        "absolute flex flex-col items-center leading-none",
        flip ? "right-0.5 bottom-0.5 rotate-180" : "top-0.5 left-0.5",
      )}
    >
      <span className={cn("font-display font-semibold", ten ? "text-[0.58em]" : "text-[0.72em]")}>
        {rank}
      </span>
      <SuitIcon suit={suit} className="h-[0.7em] w-[0.7em]" />
    </div>
  );
}

export function PlayingCard({
  card,
  className,
  selected,
  dimmed,
  faceDown,
  onClick,
  size = "md",
}: {
  card?: Card;
  className?: string;
  selected?: boolean;
  dimmed?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "w-10 h-14 text-[10px]",
    md: "w-14 h-[4.9rem] text-[13px]",
    lg: "w-16 h-[5.6rem] text-[13px]",
  };

  if (faceDown || !card) {
    return (
      <div
        className={cn(
          "card-back relative rounded-sm border border-cream/15",
          sizes[size],
          className,
        )}
        aria-hidden
      >
        <div className="absolute inset-[4px] rounded-[3px] border border-cream/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 rotate-45 rounded-[2px] border border-cream/35" />
        </div>
      </div>
    );
  }

  const red = isRed(card.suit);
  const pips = PIPS[card.rank];
  const face = card.rank === "J" || card.rank === "Q" || card.rank === "K";
  const ace = card.rank === "A";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "card-face relative rounded-sm border border-ink/10 text-left",
        sizes[size],
        red ? "text-heart" : "text-spade",
        selected && "-translate-y-3 ring-2 ring-cream",
        dimmed && "opacity-40",
        onClick && "cursor-pointer",
        !onClick && "cursor-default",
        className,
      )}
      aria-label={`${card.rank} of ${card.suit}`}
    >
      <Corner rank={card.rank} suit={card.suit} />
      <Corner rank={card.rank} suit={card.suit} flip />
      {pips && (
        <div className="absolute inset-0">
          {pips.map(([x, y], i) => (
            <span
              key={i}
              className="absolute h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <SuitIcon suit={card.suit} className="h-full w-full" />
            </span>
          ))}
        </div>
      )}
      {(face || ace) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {face && (
            <span className="font-display text-[1.45em] font-semibold leading-none">{card.rank}</span>
          )}
          <SuitIcon suit={card.suit} className={ace ? "h-[38%] w-[38%]" : "mt-0.5 h-[1em] w-[1em]"} />
        </div>
      )}
    </button>
  );
}
