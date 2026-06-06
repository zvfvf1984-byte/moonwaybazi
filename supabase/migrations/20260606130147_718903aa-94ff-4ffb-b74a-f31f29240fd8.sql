
CREATE POLICY "Users view own orders" ON public.orders
FOR SELECT TO authenticated
USING (user_id IS NOT NULL AND user_id = auth.uid());
