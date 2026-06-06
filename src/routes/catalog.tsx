import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Coins, Heart, Mountain, Leaf, Moon, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/cart";
import { z } from "zod";

const iconMap = { Sparkles, Coins, Heart, Mountain, Leaf, Moon } as const;

const catalogQuery = queryOptions({
  queryKey: ["services", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data;
  },
});

const searchSchema = z.object({ category: z.string().optional() });

export const Route = createFileRoute("/catalog")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Каталог консультаций — Qi & Code" },
      { name: "description", content: "Услуги по китайской метафизике: личность, карьера, финансы, отношения и здоровье." },
      { property: "og:title", content: "Каталог — Qi & Code" },
      { property: "og:description", content: "Все консультации по Ба-Цзы и Ци Мэнь." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: Catalog,
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
});

function Catalog() {
  const { data } = useSuspenseQuery(catalogQuery);
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/catalog" });
  const categories = Array.from(new Set(data.map((d) => d.category)));
  const filtered = category ? data.filter((d) => d.category === category) : data;

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <header className="text-center max-w-2xl mx-auto">
        <div className="text-xs uppercase tracking-[0.4em] text-gold">Каталог</div>
        <h1 className="mt-4 font-display text-6xl">Консультации</h1>
        <p className="mt-6 text-muted-foreground">
          Каждая услуга — отдельная карта, прочитанная мастером. Выберите сферу, в которой
          нужен ответ.
        </p>
        <div className="hairline mt-8 max-w-xs mx-auto" />
      </header>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => navigate({ search: {} })}
          className={`px-5 py-2 text-xs uppercase tracking-[0.2em] rounded-sm border transition ${
            !category ? "bg-gold-gradient text-primary-foreground border-transparent" : "border-gold/40 hover:border-gold"
          }`}
        >
          Все
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => navigate({ search: { category: c } })}
            className={`px-5 py-2 text-xs uppercase tracking-[0.2em] rounded-sm border transition ${
              category === c ? "bg-gold-gradient text-primary-foreground border-transparent" : "border-gold/40 hover:border-gold"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => {
          const Icon = (s.icon && iconMap[s.icon as keyof typeof iconMap]) || Sparkles;
          return (
            <Link
              key={s.id}
              to="/service/$slug"
              params={{ slug: s.slug }}
              className="group relative p-8 border border-gold/30 rounded-sm bg-card/50 hover:border-gold hover:bg-card transition flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-gold/70">{s.category}</div>
              </div>
              <h3 className="mt-6 font-display text-2xl">{s.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3 flex-1">{s.short_description}</p>
              <div className="mt-6 pt-6 border-t border-gold/20 flex items-center justify-between">
                <div className="text-gold-gradient font-display text-2xl">{formatPrice(Number(s.price))}</div>
                <span className="text-xs uppercase tracking-[0.2em] text-gold inline-flex items-center gap-2">
                  Открыть <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-20 text-center text-muted-foreground">В этой категории пока пусто.</div>
      )}
    </div>
  );
}
