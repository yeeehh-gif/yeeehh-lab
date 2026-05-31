CREATE OR REPLACE FUNCTION update_mastery(p_vocabulary_id UUID, p_delta INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE vocabulary
  SET mastery_level = GREATEST(0, LEAST(5, mastery_level + p_delta)),
      updated_at = now()
  WHERE id = p_vocabulary_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
