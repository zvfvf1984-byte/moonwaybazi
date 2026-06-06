import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Msg = { id?: string; role: "user" | "assistant" | "operator"; content: string; created_at?: string };

const LS_KEY = "qi-bot-session-v1";

type Saved = { sessionId: string; sessionToken: string; name: string; phone: string };

export function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Saved | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [creating, setCreating] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  // Load history when opening with existing session
  useEffect(() => {
    if (!open || !session) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "history", sessionId: session.sessionId, sessionToken: session.sessionToken }),
        });
        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem(LS_KEY);
            setSession(null);
          }
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const msgs: Msg[] = (data.messages || []).filter((m: Msg) => m.role !== "user" || true);
        setMessages(msgs);
        setEscalated(data.status === "escalated");
        if (msgs.length) lastTimeRef.current = msgs[msgs.length - 1].created_at ?? null;
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [open, session]);

  // Poll for new messages (operator replies)
  useEffect(() => {
    if (!open || !session) return;
    const t = setInterval(async () => {
      if (!lastTimeRef.current) return;
      try {
        const res = await fetch("/api/bot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "history", sessionId: session.sessionId, sessionToken: session.sessionToken, since: lastTimeRef.current }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const fresh: Msg[] = data.messages || [];
        if (fresh.length) {
          setMessages((prev) => [...prev, ...fresh]);
          lastTimeRef.current = fresh[fresh.length - 1].created_at ?? lastTimeRef.current;
        }
        setEscalated(data.status === "escalated");
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [open, session]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const start = async () => {
    if (!name.trim() || !phone.trim()) return;
    if (!agree) return;
    setCreating(true);
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init", name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      const saved: Saved = { sessionId: data.sessionId, sessionToken: data.sessionToken, name: name.trim(), phone: phone.trim() };
      localStorage.setItem(LS_KEY, JSON.stringify(saved));
      setSession(saved);
      const greet: Msg = { role: "assistant", content: data.greeting, created_at: new Date().toISOString() };
      setMessages([greet]);
      lastTimeRef.current = greet.created_at!;
    } catch (e: any) {
      alert(e?.message ?? "Не удалось начать чат");
    } finally {
      setCreating(false);
    }
  };

  const send = async () => {
    const v = text.trim();
    if (!v || !session || sending) return;
    setSending(true);
    const userMsg: Msg = { role: "user", content: v, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setText("");
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", sessionId: session.sessionId, sessionToken: session.sessionToken, text: v }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      const reply: Msg = { role: "assistant", content: data.reply, created_at: new Date().toISOString() };
      setMessages((prev) => [...prev, reply]);
      lastTimeRef.current = reply.created_at!;
      setEscalated(data.status === "escalated");
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Ошибка: ${e?.message ?? "сеть"}`, created_at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    if (!confirm("Очистить чат и начать заново?")) return;
    localStorage.removeItem(LS_KEY);
    setSession(null);
    setMessages([]);
    setName(""); setPhone(""); setAgree(false);
    setEscalated(false);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Открыть чат"
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gold-gradient text-primary-foreground shadow-gold hover:opacity-95 transition"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs uppercase tracking-[0.2em]">Бот</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(92vw,380px)] h-[min(80vh,560px)] flex flex-col bg-card border border-gold/40 rounded-sm shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/30 bg-background/40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <div className="font-display text-sm">Qi & Code · Консультант</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-gold" aria-label="Свернуть">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!session ? (
            <form
              onSubmit={(e) => { e.preventDefault(); start(); }}
              className="flex-1 flex flex-col gap-3 p-5 overflow-y-auto"
            >
              <p className="text-xs text-muted-foreground">
                Чтобы начать чат, представьтесь и оставьте телефон для связи.
              </p>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Имя</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={120}
                  className="w-full px-3 py-2 bg-background/60 border border-gold/30 rounded-sm text-sm focus:border-gold focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Телефон</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  type="tel"
                  maxLength={40}
                  placeholder="+7 ___ ___ __ __"
                  className="w-full px-3 py-2 bg-background/60 border border-gold/30 rounded-sm text-sm focus:border-gold focus:outline-none"
                />
              </label>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
                <span>
                  Я согласен(а) с <Link to="/privacy" className="text-gold underline">политикой конфиденциальности</Link> и обработкой персональных данных.
                </span>
              </label>
              <button
                type="submit"
                disabled={!name.trim() || !phone.trim() || !agree || creating}
                className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gold-gradient text-primary-foreground rounded-sm text-xs uppercase tracking-[0.2em] disabled:opacity-50 shadow-gold"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Начать чат
              </button>
            </form>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((m, i) => (
                  <div key={m.id ?? i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-sm text-sm whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-gold-gradient text-primary-foreground"
                          : m.role === "operator"
                            ? "bg-background border border-gold text-foreground"
                            : "bg-background/60 border border-gold/30 text-foreground"
                      }`}
                    >
                      {m.role === "operator" && <div className="text-[10px] uppercase tracking-[0.2em] text-gold mb-1">Оператор</div>}
                      {m.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2 rounded-sm bg-background/60 border border-gold/30 text-xs text-muted-foreground inline-flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> печатает…
                    </div>
                  </div>
                )}
              </div>
              {escalated && (
                <div className="px-4 py-2 text-[11px] text-gold border-t border-gold/30 bg-background/30">
                  Передано оператору — он свяжется с вами по телефону.
                </div>
              )}
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-end gap-2 p-3 border-t border-gold/30 bg-background/40"
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1}
                  maxLength={4000}
                  placeholder="Ваше сообщение…"
                  className="flex-1 resize-none px-3 py-2 bg-background border border-gold/30 rounded-sm text-sm focus:border-gold focus:outline-none max-h-32"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="w-10 h-10 inline-flex items-center justify-center rounded-sm bg-gold-gradient text-primary-foreground disabled:opacity-40"
                  aria-label="Отправить"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="px-3 py-1.5 border-t border-gold/10 text-right">
                <button onClick={reset} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
                  Начать заново
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
