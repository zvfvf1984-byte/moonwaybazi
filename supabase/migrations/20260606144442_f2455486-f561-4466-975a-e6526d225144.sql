
-- Enums
CREATE TYPE public.chat_session_status AS ENUM ('active', 'escalated', 'closed');
CREATE TYPE public.chat_message_role AS ENUM ('user', 'assistant', 'system', 'operator');
CREATE TYPE public.chat_ticket_status AS ENUM ('open', 'resolved');

-- Sessions
CREATE TABLE public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL,
  visitor_phone text NOT NULL,
  session_token uuid NOT NULL DEFAULT gen_random_uuid(),
  status public.chat_session_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.chat_sessions TO service_role;
GRANT SELECT, UPDATE ON public.chat_sessions TO authenticated;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view sessions" ON public.chat_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update sessions" ON public.chat_sessions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role public.chat_message_role NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_session_idx ON public.chat_messages(session_id, created_at);
GRANT ALL ON public.chat_messages TO service_role;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view messages" ON public.chat_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert operator messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND role = 'operator');

-- Tickets
CREATE TABLE public.chat_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  reason text,
  status public.chat_ticket_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_tickets_session_idx ON public.chat_tickets(session_id);
GRANT ALL ON public.chat_tickets TO service_role;
GRANT SELECT, UPDATE ON public.chat_tickets TO authenticated;
ALTER TABLE public.chat_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view tickets" ON public.chat_tickets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update tickets" ON public.chat_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER chat_tickets_touch BEFORE UPDATE ON public.chat_tickets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_tickets;

-- Mark orders that came from the bot
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'site';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS chat_session_id uuid REFERENCES public.chat_sessions(id) ON DELETE SET NULL;
