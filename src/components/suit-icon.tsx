import type { Suit } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function SuitIcon({
  suit,
  className,
}: {
  suit: Suit;
  className?: string;
}) {
  const red = suit === "H" || suit === "D";
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(red ? "text-heart" : "text-spade", className)}
      fill="currentColor"
      aria-hidden
    >
      {suit === "S" && (
        <path d="M12 2C9.2 7.2 4 10.4 4 15.2 4 18.6 6.6 21 10 21c.9 0 1.7-.2 2.4-.6L11 22h2l-1.4-1.6c.7.4 1.5.6 2.4.6 3.4 0 6-2.4 6-5.8C20 10.4 14.8 7.2 12 2z" />
      )}
      {suit === "H" && (
        <path d="M12 21S3 13.6 3 8.6C3 5.5 5.5 3 8.4 3c1.8 0 3.4.9 3.6 2.4C12.2 3.9 13.8 3 15.6 3 18.5 3 21 5.5 21 8.6 21 13.6 12 21 12 21z" />
      )}
      {suit === "D" && <path d="M12 2 21 12 12 22 3 12z" />}
      {suit === "C" && (
        <path d="M12 8.2c-1.7-2.6-5.6-2.2-5.6 1.6 0 2.2 1.8 3.6 4 3.6h.2L9.2 21h5.6l-1.4-7.6h.2c2.2 0 4-1.4 4-3.6 0-3.8-3.9-4.2-5.6-1.6z" />
      )}
    </svg>
  );
}
