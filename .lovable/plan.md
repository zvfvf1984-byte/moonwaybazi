## Fix: Restrict Realtime subscriptions to admins

The tables `chat_sessions`, `chat_messages`, `chat_tickets` are in the `supabase_realtime` publication so the admin panel can receive live updates. The table-level SELECT policies already restrict reads to admins via `has_role(auth.uid(), 'admin')`, but Realtime broadcasts go through `realtime.messages`, which currently has no RLS — so any authenticated user can subscribe and receive row changes (including `visitor_phone`).

### Change

Add RLS to `realtime.messages` so only admins can receive Realtime events for our chat channels.

```sql
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins receive chat realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Notes

- Matches existing SELECT policies on `chat_sessions` / `chat_messages` / `chat_tickets`.
- Anon and non-admin authenticated users will no longer receive any Realtime broadcasts; the admin panel (`AdminChats.tsx`) is unaffected because admins still pass the check.
- No application code changes needed.
- After the migration, mark the finding as fixed.
