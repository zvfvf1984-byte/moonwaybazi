import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Send, AlertCircle, CheckCircle2, MessageSquare, X } from "lucide-react";

type Session = {
  id: string;
  visitor_name: string;
  visitor_phone: string;
  status: "active" | "escalated" | "closed";
  created_at: string;
  last_message_at: string;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "operator" | "system";
  content: string;
  created_at: string;
};

type Ticket = {
  id: string;
  session_id: string;
  reason: string | null;
  status: "open" | "resolved";
  created_at: string;
};

export function AdminChats() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Session | null>(null);
  const [filter, setFilter] = useState<"all" | "tickets">("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [s, t] = await Promise.all([
      supabase.from("chat_sessions").select("*").order("last_message_at", { ascending: false }).limit(200),
      supabase.from("chat_tickets").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (s.error) toast.error(s.error.message);
    else setSessions((s.data as Session[]) ?? []);
    if (!t.error) setTickets((t.data as Ticket[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_tickets" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const ticketBySession = new Map(tickets.filter((t) => t.status === "open").map((t) => [t.session_id, t]));
  const visible = filter === "tickets" ? sessions.filter((s) => ticketBySession.has(s.id)) : sessions;

  if (loading) return <div className="text-muted-foreground">Загрузка…</div>;

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      <div>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 px-3 py-2 text-[11px] uppercase tracking-[0.2em] border rounded-xl transition ${filter === "all" ? "border-gold bg-gold/10 text-gold" : "border-gold/30 text-muted-foreground hover:border-gold"}`}
          >
            Все ({sessions.length})
          </button>
          <button
            onClick={() => setFilter("tickets")}
            className={`flex-1 px-3 py-2 text-[11px] uppercase tracking-[0.2em] border rounded-xl transition ${filter === "tickets" ? "border-gold bg-gold/10 text-gold" : "border-gold/30 text-muted-foreground hover:border-gold"}`}
          >
            Тикеты ({tickets.filter((t) => t.status === "open").length})
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="text-muted-foreground text-sm">Чатов нет.</div>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {visible.map((s) => {
              const ticket = ticketBySession.get(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s)}
                  className={`w-full text-left p-3 border rounded-xl transition ${active?.id === s.id ? "border-gold bg-gold/10" : "border-gold/30 hover:border-gold bg-card/40"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-display text-base truncate">{s.visitor_name}</div>
                    {ticket && <AlertCircle className="w-4 h-4 text-gold flex-shrink-0" />}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3" /> {s.visitor_phone}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {new Date(s.last_message_at).toLocaleString("ru-RU")}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border border-gold/30 rounded-xl bg-card/40 min-h-[60vh]">
        {active ? (
          <ChatViewer key={active.id} session={active} ticket={ticketBySession.get(active.id) ?? null} onClose={() => setActive(null)} onChange={load} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-10">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 mx-auto opacity-40" />
              <div className="mt-3">Выберите чат слева</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatViewer({ session, ticket, onClose, onChange }: { session: Session; ticket: Ticket | null; onClose: () => void; onChange: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const { data, error } = await supabase.from("chat_messages").select("*").eq("session_id", session.id).order("created_at", { ascending: true });
    if (error) return toast.error(error.message);
    setMessages((data as Message[]) ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`admin-chat-${session.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${session.id}` }, (p) => {
        setMessages((prev) => [...prev, p.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendOperator = async () => {
    const v = reply.trim();
    if (!v) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({ session_id: session.id, role: "operator", content: v });
    setSending(false);
    if (error) return toast.error(error.message);
    setReply("");
  };

  const resolveTicket = async () => {
    if (!ticket) return;
    const { error } = await supabase.from("chat_tickets").update({ status: "resolved" }).eq("id", ticket.id);
    if (error) return toast.error(error.message);
    toast.success("Тикет закрыт");
    onChange();
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="px-5 py-3 border-b border-gold/30 flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-lg">{session.visitor_name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2"><Phone className="w-3 h-3" /> <a href={`tel:${session.visitor_phone}`} className="hover:text-gold">{session.visitor_phone}</a></div>
          {ticket && (
            <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-xl bg-gold/10 border border-gold/40 text-xs text-gold">
              <AlertCircle className="w-3 h-3" /> Тикет: {ticket.reason || "—"}
              <button onClick={resolveTicket} className="ml-2 underline hover:opacity-80 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> закрыть
              </button>
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-gold"><X className="w-4 h-4" /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
              m.role === "user" ? "bg-gold-gradient text-primary-foreground"
              : m.role === "operator" ? "bg-background border border-gold text-foreground"
              : "bg-background/60 border border-gold/30 text-foreground"
            }`}>
              <div className="text-[10px] uppercase tracking-[0.2em] opacity-70 mb-0.5">
                {m.role === "user" ? "Клиент" : m.role === "operator" ? "Оператор" : "Бот"}
              </div>
              {m.content}
              <div className="text-[10px] opacity-50 mt-1">{new Date(m.created_at).toLocaleTimeString("ru-RU")}</div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); sendOperator(); }} className="p-3 border-t border-gold/30 flex items-end gap-2">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendOperator(); } }}
          rows={1}
          placeholder="Ответ как оператор…"
          className="flex-1 resize-none px-3 py-2 bg-background border border-gold/30 rounded-xl text-sm focus:border-gold focus:outline-none max-h-32"
        />
        <button type="submit" disabled={!reply.trim() || sending} className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-gold-gradient text-primary-foreground disabled:opacity-40">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
