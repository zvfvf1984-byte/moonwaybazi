
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

DROP POLICY IF EXISTS "Anyone can submit order" ON public.orders;
CREATE POLICY "Anyone can submit order" ON public.orders FOR INSERT
  WITH CHECK (length(customer_name) > 0 AND length(customer_contact) > 0);
