CREATE TABLE user_predictions_stats (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  points integer DEFAULT 0,
  streak integer DEFAULT 0,
  daily_prediction_count integer DEFAULT 0,
  total_predictions integer DEFAULT 0,
  correct_predictions integer DEFAULT 0,
  bonus_points integer DEFAULT 0,
  last_prediction_date date,
  created_at timestamp with time zone DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Enable Row-Level Security
ALTER TABLE user_predictions_stats ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to view their own stats
CREATE POLICY select_all_stats ON user_predictions_stats
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create a policy to allow users to insert their own stats
CREATE POLICY insert_own_stats ON user_predictions_stats
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create a policy to allow users to update their own stats
CREATE POLICY update_own_stats ON user_predictions_stats
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create a policy to allow users to delete their own stats
CREATE POLICY delete_own_stats ON user_predictions_stats
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Apply the policies
ALTER TABLE user_predictions_stats FORCE ROW LEVEL SECURITY;
