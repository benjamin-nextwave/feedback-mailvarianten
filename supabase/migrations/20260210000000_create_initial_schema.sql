-- Create forms table (DB-01)
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  webhook_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create email_variants table (DB-02)
CREATE TABLE email_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('eerste_mail', 'opvolgmail_1', 'opvolgmail_2')),
  variant_number INTEGER NOT NULL,
  subject_line TEXT NOT NULL,
  email_body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(form_id, email_type, variant_number)
);

-- Create feedback_responses table (DB-03)
CREATE TABLE feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES email_variants(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_email_variants_form_id ON email_variants(form_id);
CREATE INDEX idx_feedback_responses_form_id ON feedback_responses(form_id);
CREATE INDEX idx_feedback_responses_variant_id ON feedback_responses(variant_id);

-- Enable Row Level Security
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users (full access)
CREATE POLICY "Authenticated users have full access to forms"
  ON forms
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users have full access to email_variants"
  ON email_variants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users have full access to feedback_responses"
  ON feedback_responses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for anonymous users (read forms and variants, insert feedback)
CREATE POLICY "Anonymous users can read forms"
  ON forms
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can read email_variants"
  ON email_variants
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert feedback_responses"
  ON feedback_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Trigger to update updated_at timestamp on forms
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
