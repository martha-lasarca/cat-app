-- Create catalogues table
CREATE TABLE IF NOT EXISTS catalogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  custom_link TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  slides JSONB DEFAULT '[]'::jsonb,
  products JSONB DEFAULT '[]'::jsonb
);

-- Create quote_logs table
CREATE TABLE IF NOT EXISTS quote_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  share_link TEXT NOT NULL,
  catalogue_name TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  pdf_url TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  items JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_catalogues_slug ON catalogues(slug);
CREATE INDEX IF NOT EXISTS idx_catalogues_custom_link ON catalogues(custom_link);
CREATE INDEX IF NOT EXISTS idx_quote_logs_timestamp ON quote_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_quote_logs_email ON quote_logs(email);

-- Enable Row Level Security (optional)
ALTER TABLE catalogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Allow public read access to catalogues" ON catalogues
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to catalogues" ON catalogues
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to catalogues" ON catalogues
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to catalogues" ON catalogues
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access to quote_logs" ON quote_logs
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to quote_logs" ON quote_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete access to quote_logs" ON quote_logs
  FOR DELETE USING (true);
