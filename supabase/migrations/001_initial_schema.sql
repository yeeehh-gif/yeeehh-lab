-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  daily_goal INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content library
CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  phonetic TEXT,
  part_of_speech TEXT,
  definition TEXT NOT NULL,
  example_sentence TEXT,
  category TEXT NOT NULL CHECK (category IN ('reading', 'speaking', 'writing')),
  source_note TEXT,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vocabulary_user ON vocabulary(user_id);
CREATE INDEX idx_vocabulary_category ON vocabulary(user_id, category);

-- Training records
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  training_type TEXT NOT NULL CHECK (training_type IN ('reading', 'speaking', 'writing')),
  result TEXT NOT NULL CHECK (result IN ('correct', 'maybe', 'wrong')),
  reviewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_training_user_date ON training_records(user_id, reviewed_at);

-- Ebbinghaus schedule
CREATE TABLE review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  next_review_at TIMESTAMPTZ NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, vocabulary_id)
);

CREATE INDEX idx_review_due ON review_schedule(user_id, next_review_at);

-- Error backlog
CREATE TABLE error_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL CHECK (error_type IN ('reading', 'speaking', 'writing')),
  attempts INTEGER DEFAULT 1,
  release_count INTEGER DEFAULT 3,
  next_attempt_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, vocabulary_id, error_type)
);

-- Import sessions
CREATE TABLE import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  items_found INTEGER DEFAULT 0,
  items_imported INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own data
CREATE POLICY "own_profiles" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_vocabulary" ON vocabulary FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_training" ON training_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_review" ON review_schedule FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_backlog" ON error_backlog FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_imports" ON import_sessions FOR ALL USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
