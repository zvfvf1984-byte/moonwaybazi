import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Coins, Heart, Mountain, Leaf, Moon, ArrowLeft, Check, Clock, ShoppingBag } from "lucide-react";
import { addToCart, formatPrice } from "@/lib/cart";
import { toast } from "sonner";

const iconMap = { Sparkles, Coins, Heart, Mountain, Leaf, Moon } as const;

const serviceQuery = (slug: string) =>
  queryOptions({
    queryKey: ["service", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

export const Route = createFileRoute("/service/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(serviceQuery(params.slug)),
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Qi & Code` },
      { property: "og:title", content: `Консультация — Qi & Code` },
    ],
  }),
  component: ServicePage,
  errorComponent: ({ error }) => <div className="p-10 text-center">{error.message}</div>,
  notFoundComponent: () => (
    <div className="p-20 text-center">
      <div className="font-display text-4xl">Услуга не найдена</div>
      <Link to="/catalog" className="mt-6 inline-block text-gold">Вернуться в каталог</Link>
    </div>
  ),
});

function ServicePage() {
  const { slug } = Route.useParams();
  const { data: s } = useSuspenseQuery(serviceQuery(slug));
  const navigate = useNavigate();
  const Icon = (s.icon && iconMap[s.icon as keyof typeof iconMap]) || Sparkles;

  const handleAdd = () => {
    addToCart({ id: s.id, slug: s.slug, title: s.title, price: Number(s.price) });
    toast.success("Добавлено в корзину");
  };

  const handleBuy = () => {
    addToCart({ id: s.id, slug: s.slug, title: s.title, price: Number(s.price) });
    navigate({ to: "/cart" });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition">
        <ArrowLeft className="w-4 h-4" /> в каталог
      </Link>

      <article className="mt-10 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <div className="text-xs uppercase tracking-[0.4em] text-gold">{s.category}</div>
          <h1 className="mt-4 font-display text-5xl md:text-6xl">{s.title}</h1>
          <p className="mt-6 text-lg text-muted-foreground">{s.short_description}</p>

          <div className="hairline my-10" />

          <h2 className="font-display text-2xl text-gold">Что включает</h2>
          <p className="mt-4 leading-relaxed whitespace-pre-line">{s.long_description}</p>

          {Array.isArray((s as any).includes) && (s as any).includes.length > 0 && (
            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              {((s as any).includes as string[]).map((t) => (
                <div key={t} className="flex items-start gap-3 p-4 border border-gold/30 rounded-xl bg-card/40">
                  <Check className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
                  <div className="text-sm">{t}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-28 p-8 border border-gold/40 rounded-xl bg-card/60 backdrop-blur">
            <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold">
              <Icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">Стоимость</div>
            <div className="mt-2 font-display text-5xl text-gold-gradient">{formatPrice(Number(s.price))}</div>
            {s.duration && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" /> {s.duration}
              </div>
            )}

            <div className="mt-8 space-y-3">
              <button
                onClick={handleBuy}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gold-gradient text-primary-foreground rounded-xl text-sm uppercase tracking-[0.2em] hover:opacity-95 shadow-gold transition"
              >
                Оформить
              </button>
              <button
                onClick={handleAdd}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 border border-gold rounded-xl text-sm uppercase tracking-[0.2em] hover:bg-gold/10 transition"
              >
                <ShoppingBag className="w-4 h-4" /> В корзину
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gold/20 text-xs text-muted-foreground leading-relaxed">
              Оплата консультации — после согласования времени с мастером. Мы свяжемся
              с вами в течение 24 часов.
            </div>
          </div>
        </aside>
      </article>
    </div>
  );
}
