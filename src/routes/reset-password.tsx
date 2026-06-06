import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Новый пароль — Qi & Code" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase auto-обрабатывает recovery hash и создаёт временную сессию
    const sub = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => { sub.data.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) return toast.error("Минимум 6 символов");
    if (pwd !== pwd2) return toast.error("Пароли не совпадают");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Пароль обновлён");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <form onSubmit={submit} className="w-full max-w-md p-10 border border-gold/40 rounded-sm bg-card/60 backdrop-blur space-y-5">
        <div className="text-center">
          <div className="font-display text-5xl text-gold-gradient">∞</div>
          <h1 className="mt-3 font-display text-3xl">Новый пароль</h1>
          {!ready && (
            <p className="mt-2 text-xs text-muted-foreground">
              Откройте эту страницу по ссылке из письма восстановления.
            </p>
          )}
        </div>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Новый пароль</span>
          <input type="password" required minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-sm focus:border-gold focus:outline-none" />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Повторите пароль</span>
          <input type="password" required minLength={6} value={pwd2} onChange={(e) => setPwd2(e.target.value)} className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-sm focus:border-gold focus:outline-none" />
        </label>
        <button type="submit" disabled={busy || !ready} className="w-full px-6 py-4 bg-gold-gradient text-primary-foreground rounded-sm text-sm uppercase tracking-[0.2em] hover:opacity-95 shadow-gold disabled:opacity-60">
          {busy ? "…" : "Сохранить пароль"}
        </button>
      </form>
    </div>
  );
}
