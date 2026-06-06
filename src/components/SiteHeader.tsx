import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";

const nav = [
  { to: "/", label: "Главная" },
  { to: "/catalog", label: "Каталог" },
  { to: "/about", label: "О методе" },
  { to: "/contact", label: "Контакты" },
] as const;

export function SiteHeader() {
  const items = useCart();
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-gold">
      <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gold-gradient opacity-80 group-hover:opacity-100 transition" />
            <span className="relative font-display text-2xl text-primary-foreground font-semibold">氣</span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl tracking-wide">Qi & Code</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Метафизика судьбы</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {nav.map((n) => {
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`relative text-sm tracking-wide uppercase transition ${
                  active ? "text-gold" : "text-foreground/80 hover:text-gold"
                }`}
              >
                {n.label}
                {active && <span className="absolute -bottom-2 left-0 right-0 h-px bg-gold-gradient" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative inline-flex items-center gap-2 px-4 h-11 border border-gold rounded-sm hover:bg-gold/10 transition"
          >
            <ShoppingBag className="w-4 h-4 text-gold" />
            <span className="hidden sm:inline text-sm tracking-wide">Корзина</span>
            {count > 0 && (
              <span className="ml-1 min-w-5 h-5 px-1 rounded-full bg-gold-gradient text-primary-foreground text-[11px] font-medium flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden w-11 h-11 border border-gold rounded-sm flex items-center justify-center"
            aria-label="Меню"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-gold bg-background/95">
          <div className="px-6 py-4 flex flex-col gap-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm uppercase tracking-wide text-foreground/80 hover:text-gold"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
