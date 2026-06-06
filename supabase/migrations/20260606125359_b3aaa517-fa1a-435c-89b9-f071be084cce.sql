
CREATE POLICY "No self insert into user_roles" ON public.user_roles
  FOR INSERT TO anon, authenticated WITH CHECK (false);

CREATE POLICY "No update of user_roles" ON public.user_roles
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "No delete of user_roles" ON public.user_roles
  FOR DELETE TO anon, authenticated USING (false);
