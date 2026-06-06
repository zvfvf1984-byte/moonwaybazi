
-- 1) Ограничить длину полей публичной заявки
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
);

-- 2) user_roles: только admin@elfeika.com может быть admin (защита от эскалации)
CREATE OR REPLACE FUNCTION public.enforce_admin_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
BEGIN
  IF NEW.role = 'admin' THEN
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
    IF v_email IS DISTINCT FROM 'admin@elfeika.com' THEN
      RAISE EXCEPTION 'Роль admin доступна только учётной записи admin@elfeika.com';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_admin_email_trg ON public.user_roles;
CREATE TRIGGER enforce_admin_email_trg
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_email();

-- На всякий случай гарантируем, что никто из обычных ролей не может писать в user_roles
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM anon, authenticated;

-- 3) Ограничить EXECUTE на security definer функциях
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.enforce_admin_email() FROM PUBLIC, anon, authenticated;

-- touch_updated_at — служебная триггер-функция, не нужна публично
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
