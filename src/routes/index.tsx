import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Sparkles, Coins, Heart, Mountain, Leaf, Moon } from "lucide-react";
import { formatPrice } from "@/lib/cart";
import { AffirmationsWidget } from "@/components/AffirmationsWidget";

const iconMap = { Sparkles, Coins, Heart, Mountain, Leaf, Moon } as const;

const featuredQuery = queryOptions({
  queryKey: ["services", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .limit(6);
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Qi & Code — Китайская метафизика онлайн" },
      { name: "description", content: "Ба-Цзы и Ци Мэнь онлайн: карта личности, финансов, карьеры и отношений на основе древних систем." },
      { property: "og:title", content: "Qi & Code — Карта вашей судьбы" },
      { property: "og:description", content: "Точные персональные консультации по китайской метафизике." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQuery),
  component: Index,
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
});

const categories = [
  { label: "Личность", icon: Sparkles, hint: "Карта врождённых талантов" },
  { label: "Финансы", icon: Coins, hint: "Денежные каналы и потоки" },
  { label: "Карьера", icon: Mountain, hint: "Профессиональный путь" },
  { label: "Отношения", icon: Heart, hint: "Встречи и совместимость" },
  { label: "Здоровье", icon: Leaf, hint: "Баланс пяти стихий" },
];

function Index() {
  const { data: services } = useSuspenseQuery(featuredQuery);
  const [affOpen, setAffOpen] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gold/5 blur-3xl" />
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full border border-gold/20 animate-float-slow" />
          <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full border border-gold/15 animate-float-slow" style={{ animationDelay: "2s" }} />
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 animate-fade-up">
            <div className="inline-flex items-center gap-3 px-4 py-2 border border-gold rounded-full text-xs uppercase tracking-[0.3em] text-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Древнее искусство · онлайн
            </div>
            <h1 className="mt-8 font-display text-6xl md:text-7xl lg:text-8xl leading-[0.95]">
              Код вашей <br />
              <span className="text-gold-gradient italic animate-shimmer-text">судьбы</span>,<br />
              написанный стихиями.
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Ба-Цзы и Ци Мэнь Дунь Цзя — две тысячи лет точных ответов о личности,
              финансах, карьере, отношениях и здоровье. Персональный разбор онлайн.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/catalog"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gold-gradient text-primary-foreground rounded-xl text-sm uppercase tracking-[0.2em] hover:opacity-95 shadow-gold transition"
              >
                Открыть каталог
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center gap-3 px-8 py-4 border border-gold rounded-xl text-sm uppercase tracking-[0.2em] hover:bg-gold/10 transition"
              >
                О методе
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Decorative compass */}
              <div className="absolute inset-0 rounded-full border border-gold/30 animate-float-slow" />
              <div className="absolute inset-8 rounded-full border border-gold/20" style={{ animationDelay: "1s" }} />
              <div className="absolute inset-16 rounded-full border border-gold/15" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-display text-[10rem] leading-none text-gold-gradient">命</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.5em] text-gold">Mìng · судьба</div>
                </div>
              </div>
              {["金", "木", "水", "火", "土"].map((ch, i) => {
                const top = (50 - 45 * Math.cos((i / 5) * Math.PI * 2)).toFixed(4);
                const left = (50 + 45 * Math.sin((i / 5) * Math.PI * 2)).toFixed(4);
                return (
                  <div
                    key={ch}
                    className="absolute font-display text-3xl text-gold/80"
                    style={{
                      top: `${top}%`,
                      left: `${left}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {ch}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <div className="text-xs uppercase tracking-[0.4em] text-gold">Пять сфер</div>
          <h2 className="mt-4 font-display text-5xl">Где вы хотите услышать ответ</h2>
          <div className="hairline mt-8 max-w-xs mx-auto" />
        </div>
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.label}
                to="/catalog"
                search={{ category: c.label }}
                className="group relative p-8 border border-gold/40 rounded-xl bg-card/40 hover:bg-card hover:border-gold transition overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gold/5 group-hover:bg-gold/10 transition" />
                <Icon className="relative w-8 h-8 text-gold" />
                <div className="relative mt-6 font-display text-2xl">{c.label}</div>
                <div className="relative mt-2 text-xs text-muted-foreground">{c.hint}</div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured services */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex items-end justify-between gap-6 mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.4em] text-gold">Каталог</div>
            <h2 className="mt-4 font-display text-5xl">Избранные консультации</h2>
          </div>
          <Link to="/catalog" className="text-sm uppercase tracking-[0.2em] text-gold hover:text-gold-soft transition inline-flex items-center gap-2">
            Все услуги <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => {
            const Icon = (s.icon && iconMap[s.icon as keyof typeof iconMap]) || Sparkles;
            return (
              <Link
                key={s.id}
                to="/service/$slug"
                params={{ slug: s.slug }}
                className="group relative p-8 border border-gold/30 rounded-xl bg-card/50 hover:border-gold hover:bg-card transition flex flex-col"
              >
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-gold/70">{s.category}</div>
                </div>
                <h3 className="mt-6 font-display text-2xl">{s.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{s.short_description}</p>
                <div className="mt-6 pt-6 border-t border-gold/20 flex items-center justify-between">
                  <div className="text-gold-gradient font-display text-2xl">{formatPrice(Number(s.price))}</div>
                  <span className="text-xs uppercase tracking-[0.2em] text-gold group-hover:translate-x-1 transition inline-flex items-center gap-2">
                    Подробнее <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Philosophy band */}
      <section className="relative my-24 py-24 border-y border-gold/40">
        <div className="absolute inset-0 -z-10 bg-gold/5" />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="font-display text-6xl text-gold-gradient">道</div>
          <blockquote className="mt-6 font-display text-3xl md:text-4xl leading-snug italic">
            «Знающий других — мудр. Знающий себя — просветлён.»
          </blockquote>
          <div className="mt-4 text-xs uppercase tracking-[0.4em] text-muted-foreground">Лао-цзы · Дао Дэ Цзин</div>
        </div>
      </section>
    </div>
  );
}
