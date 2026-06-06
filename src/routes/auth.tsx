import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Вход — Qi & Code" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const fn = mode === "signin"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
    const { error } = await fn;
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "signup") {
      toast.success("Регистрация выполнена. Попросите супер-админа выдать вам роль admin.");
    } else {
      toast.success("Добро пожаловать");
      navigate({ to: "/admin" });
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <form onSubmit={submit} className="w-full max-w-md p-10 border border-gold/40 rounded-sm bg-card/60 backdrop-blur space-y-5">
        <div className="text-center">
          <div className="font-display text-5xl text-gold-gradient">氣</div>
          <h1 className="mt-3 font-display text-3xl">Вход для администратора</h1>
        </div>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">E-mail</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-sm focus:border-gold focus:outline-none" />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Пароль</span>
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-sm focus:border-gold focus:outline-none" />
        </label>
        <button type="submit" disabled={busy} className="w-full px-6 py-4 bg-gold-gradient text-primary-foreground rounded-sm text-sm uppercase tracking-[0.2em] hover:opacity-95 shadow-gold disabled:opacity-60">
          {busy ? "…" : mode === "signin" ? "Войти" : "Зарегистрироваться"}
        </button>
        <button type="button" onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))} className="w-full text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
          {mode === "signin" ? "Нет аккаунта — создать" : "Уже есть аккаунт — войти"}
        </button>
      </form>
    </div>
  );
}
