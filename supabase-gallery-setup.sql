-- Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  field TEXT NOT NULL,
  field_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gallery_field_id ON gallery(field_id);
CREATE INDEX IF NOT EXISTS idx_gallery_user_id ON gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC);

-- Enable Row Level Security
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read gallery images
CREATE POLICY "Gallery images are viewable by everyone"
  ON gallery FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert their own images
CREATE POLICY "Users can upload their own images"
  ON gallery FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own images"
  ON gallery FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);




