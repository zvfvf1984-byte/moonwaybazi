import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-gold">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute -inset-2 rounded-full bg-gold/30 blur-xl" />
              <div className="absolute inset-0 rounded-full bg-gold-gradient shadow-gold" />
              <span className="relative font-display text-xl text-primary-foreground">∞</span>
            </div>
            <div className="font-display text-2xl">Qi & Code</div>
          </div>
          <p className="mt-5 max-w-md text-sm text-muted-foreground leading-relaxed">
            Древнее искусство китайской метафизики — Ба-Цзы, Ци Мэнь, Фэн-шуй — в форме точных
            персональных консультаций. Карта вашей судьбы, написанная стихиями.
          </p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Навигация</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-gold transition">Главная</Link></li>
            <li><Link to="/catalog" className="hover:text-gold transition">Каталог</Link></li>
            <li><Link to="/about" className="hover:text-gold transition">О методе</Link></li>
            <li><Link to="/contact" className="hover:text-gold transition">Контакты</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Документы</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy" className="hover:text-gold transition">Политика конфиденциальности</Link></li>
            <li><Link to="/offer" className="hover:text-gold transition">Публичная оферта</Link></li>
            <li><Link to="/auth" className="hover:text-gold transition">Вход для администратора</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gold/40">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} Qi & Code. Все права защищены.</div>
          <div className="tracking-[0.3em] uppercase">Земля · Металл · Вода · Дерево · Огонь</div>
        </div>
      </div>
    </footer>
  );
}
