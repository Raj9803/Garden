-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  flower_id TEXT UNIQUE NOT NULL,
  note TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Create index on flower_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_notes_flower_id ON notes(flower_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
