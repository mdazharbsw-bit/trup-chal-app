const BOT_NAMES = [
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
  "Zara",
];

export function botName(seat: number, seed = 1): string {
  return BOT_NAMES[(seat * 3 + seed) % BOT_NAMES.length]!;
}

export const NAME_KEY = "trupchal-name";

export function loadName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function saveName(name: string): void {
  window.localStorage.setItem(NAME_KEY, name.trim().slice(0, 18));
}

export function roomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export function normalizeCode(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}
