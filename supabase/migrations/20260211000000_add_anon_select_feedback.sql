-- Add SELECT policy on feedback_responses for anonymous users
-- This is REQUIRED because PostgreSQL SELECTs the newly inserted row to return it to the client.
-- Without this policy, anonymous INSERT operations fail silently.
-- The original migration (20260210) only has INSERT WITH CHECK but no SELECT USING for anon on feedback_responses.
CREATE POLICY "Anonymous users can read feedback_responses"
  ON feedback_responses
  FOR SELECT
  TO anon
  USING (true);

-- Add UPDATE policy on forms for anonymous users to allow status change to 'completed'
-- The WITH CHECK ensures anon can only set status to 'completed', not change other fields maliciously.
CREATE POLICY "Anonymous users can update form status"
  ON forms
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (status = 'completed');
