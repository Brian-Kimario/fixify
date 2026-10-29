-- Let professionals manage their own skills.
-- Before this, only SELECT/INSERT policies existed, so a skill could never be removed,
-- and INSERT allowed a professional to self-assert verified = true.

DROP POLICY IF EXISTS professional_skills_insert_own ON public.professional_skills;

CREATE POLICY professional_skills_insert_own ON public.professional_skills
  FOR INSERT
  WITH CHECK (professional_id = auth.uid() AND verified = false);

CREATE POLICY professional_skills_delete_own ON public.professional_skills
  FOR DELETE
  USING (professional_id = auth.uid());
