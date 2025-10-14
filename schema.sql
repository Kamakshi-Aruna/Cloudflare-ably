-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email ON form_submissions(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_created_at ON form_submissions(created_at DESC);