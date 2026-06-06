
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Admins view roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Services catalog
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  long_description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration TEXT,
  icon TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage services - insert" ON public.services FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage services - update" ON public.services FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage services - delete" ON public.services FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Orders / requests
CREATE TYPE public.order_status AS ENUM ('new', 'in_progress', 'done', 'cancelled');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_contact TEXT NOT NULL,
  birth_info TEXT,
  message TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit order" ON public.orders FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Admins view orders" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER services_touch BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed catalog
INSERT INTO public.services (title, slug, category, short_description, long_description, price, duration, icon, sort_order) VALUES
('Карта судьбы Ба-Цзы', 'bazi-fate-map', 'Личность', 'Глубинный портрет личности по четырём столпам рождения', 'Подробный анализ ваших врождённых талантов, сильных и слабых сторон, скрытых ресурсов и жизненных циклов на основе древней системы Ба-Цзы. Вы увидите карту своей судьбы — стихии, благоприятные направления и периоды.', 9900, '60–90 минут', 'Sparkles', 1),
('Где мои деньги? Финансовый код', 'money-code', 'Финансы', 'Анализ финансового потенциала и денежных каналов', 'Разбор финансовых звёзд в вашей карте: откуда приходят деньги, какие сферы приносят достаток, какие риски подстерегают. Рекомендации по активации денежных потоков и оптимальным датам для инвестиций.', 12900, '90 минут', 'Coins', 2),
('Карьерный путь и предназначение', 'career-path', 'Карьера', 'Ваша истинная профессия по китайской метафизике', 'Определение благоприятных профессиональных сфер, оптимальных направлений роста, периодов взлётов и спадов. Стратегия на ближайшие 10 лет с опорой на ваш личный энергетический код.', 11900, '90 минут', 'Mountain', 3),
('Возможности встречи и совместимость', 'love-compatibility', 'Отношения', 'Прогноз отношений и анализ партнёра', 'Когда и где состоится значимая встреча, какие качества искать в партнёре, анализ совместимости двух карт по стихиям, столпам и звёздам отношений.', 13900, '90–120 минут', 'Heart', 4),
('Карта здоровья и рисков', 'health-map', 'Здоровье', 'Профилактический разбор по системе пяти стихий', 'Выявление слабых зон организма по дисбалансу стихий, склонностей и периодов повышенного риска. Рекомендации по образу жизни, питанию и поддерживающим практикам.', 10900, '60 минут', 'Leaf', 5),
('Годовой прогноз', 'yearly-forecast', 'Личность', 'Персональная карта года: ключевые темы и даты', 'Месяц за месяцем — что год принесёт именно вам: благоприятные окна для решений, периоды паузы, возможности и предупреждения.', 7900, '45–60 минут', 'Moon', 6);
