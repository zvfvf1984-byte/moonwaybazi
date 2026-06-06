import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Контакты — Qi & Code" }] }),
  component: Contact,
});

function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <div className="text-xs uppercase tracking-[0.4em] text-gold">Связь</div>
      <h1 className="mt-4 font-display text-6xl">Напишите нам</h1>
      <div className="hairline my-10 max-w-xs mx-auto" />
      <p className="text-muted-foreground">
        Лучший способ — оформить заявку через каталог. Мы свяжемся в течение 24 часов и согласуем
        удобное время.
      </p>
      <div className="mt-10 grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
        <a href="mailto:hello@qiandcode.app" className="p-6 border border-gold/40 rounded-sm hover:bg-gold/10 transition">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">E-mail</div>
          <div className="mt-2 font-display text-xl">hello@qiandcode.app</div>
        </a>
        <a href="https://t.me/qiandcode" className="p-6 border border-gold/40 rounded-sm hover:bg-gold/10 transition">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Telegram</div>
          <div className="mt-2 font-display text-xl">@qiandcode</div>
        </a>
      </div>
      <Link to="/catalog" className="mt-12 inline-block px-8 py-4 bg-gold-gradient text-primary-foreground rounded-sm text-sm uppercase tracking-[0.2em] shadow-gold">
        Перейти в каталог
      </Link>
    </div>
  );
}
