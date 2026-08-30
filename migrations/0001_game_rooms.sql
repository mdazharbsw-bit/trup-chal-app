CREATE TABLE IF NOT EXISTS game_rooms (
  code TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  seats JSONB NOT NULL,
  state JSONB,
  seq INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS game_rooms_updated_at ON game_rooms (updated_at);
