import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Вход — Qi & Code" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
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
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) return toast.error(error.message);
        toast.success("Письмо для восстановления отправлено. Проверьте почту.");
        setMode("signin");
        return;
      }
      const { error } = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/admin" } });
      if (error) return toast.error(error.message);
      if (mode === "signup") {
        toast.success("Регистрация выполнена. Проверьте почту для подтверждения.");
      } else {
        toast.success("Добро пожаловать");
        navigate({ to: "/admin" });
      }
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "signin" ? "Вход в личный кабинет" :
    mode === "signup" ? "Регистрация" :
    "Восстановление пароля";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <form onSubmit={submit} className="w-full max-w-md p-10 border border-gold/40 rounded-sm bg-card/60 backdrop-blur space-y-5">
        <div className="text-center">
          <div className="font-display text-5xl text-gold-gradient">∞</div>
          <h1 className="mt-3 font-display text-3xl">{title}</h1>
          {mode === "forgot" && (
            <p className="mt-2 text-xs text-muted-foreground">Введите e-mail — отправим ссылку для смены пароля.</p>
          )}
        </div>
        <label className="block">
          <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">E-mail</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-sm focus:border-gold focus:outline-none" />
        </label>
        {mode !== "forgot" && (
          <label className="block">
            <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Пароль</span>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-sm focus:border-gold focus:outline-none" />
          </label>
        )}
        <button type="submit" disabled={busy} className="w-full px-6 py-4 bg-gold-gradient text-primary-foreground rounded-sm text-sm uppercase tracking-[0.2em] hover:opacity-95 shadow-gold disabled:opacity-60">
          {busy ? "…" : mode === "signin" ? "Войти" : mode === "signup" ? "Зарегистрироваться" : "Отправить ссылку"}
        </button>

        <div className="flex flex-col gap-2 pt-2 text-center">
          {mode === "signin" && (
            <>
              <button type="button" onClick={() => setMode("forgot")} className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
                Забыли пароль?
              </button>
              <button type="button" onClick={() => setMode("signup")} className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
                Нет аккаунта — создать
              </button>
            </>
          )}
          {mode === "signup" && (
            <button type="button" onClick={() => setMode("signin")} className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
              Уже есть аккаунт — войти
            </button>
          )}
          {mode === "forgot" && (
            <button type="button" onClick={() => setMode("signin")} className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
              Вернуться ко входу
            </button>
          )}
          <Link to="/" className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-gold mt-2">
            На главную
          </Link>
        </div>
      </form>
    </div>
  );
}
