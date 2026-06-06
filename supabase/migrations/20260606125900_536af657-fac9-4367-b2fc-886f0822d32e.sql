
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);

DROP POLICY IF EXISTS "Anyone can submit order" ON public.orders;
CREATE POLICY "Anyone can submit order"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(customer_name) BETWEEN 1 AND 120
  AND length(customer_contact) BETWEEN 1 AND 200
  AND (birth_info IS NULL OR length(birth_info) <= 500)
  AND (message IS NULL OR length(message) <= 2000)
  AND status = 'new'
  AND (user_id IS NULL OR user_id = auth.uid())
);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
