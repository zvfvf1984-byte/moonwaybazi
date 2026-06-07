import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Copy, RefreshCw, Sparkles, Check } from "lucide-react";

export const Route = createFileRoute("/affirmations")({
  head: () => ({
    meta: [
      { title: "Аффирмации — Qi & Code" },
      {
        name: "description",
        content:
          "Генератор аффирмаций по категориям: уверенность, любовь к себе, мотивация, спокойствие, успех, здоровье, благодарность, отношения.",
      },
    ],
  }),
  component: AffirmationsPage,
});

type CategoryKey =
  | "all"
  | "confidence"
  | "self-love"
  | "motivation"
  | "peace"
  | "success"
  | "health"
  | "gratitude"
  | "relationships";

const categories: { key: CategoryKey; label: string; icon: string; hint: string }[] = [
  { key: "all", label: "Все", icon: "✦", hint: "Случайная из всех" },
  { key: "confidence", label: "Уверенность", icon: "💪", hint: "Сила и опора в себе" },
  { key: "self-love", label: "Любовь к себе", icon: "💗", hint: "Принятие и нежность" },
  { key: "motivation", label: "Мотивация", icon: "🚀", hint: "Импульс к действию" },
  { key: "peace", label: "Спокойствие", icon: "🌿", hint: "Тишина внутри" },
  { key: "success", label: "Успех", icon: "⭐", hint: "Поток достижений" },
  { key: "health", label: "Здоровье", icon: "🍃", hint: "Сила тела и дыхания" },
  { key: "gratitude", label: "Благодарность", icon: "🙏", hint: "Изобилие в простом" },
  { key: "relationships", label: "Отношения", icon: "💫", hint: "Тепло и связь" },
];

const data: Record<Exclude<CategoryKey, "all">, string[]> = {
  confidence: [
    "Я доверяю себе и каждому своему решению.",
    "Моя сила растёт с каждым вдохом.",
    "Я достоин(а) занимать своё место в этом мире.",
    "Внутри меня — спокойная, неподвижная опора.",
    "Я говорю и действую от своего центра.",
  ],
  "self-love": [
    "Я принимаю себя таким(ой), какой(ая) я есть сегодня.",
    "Я отношусь к себе с теплом и вниманием.",
    "Моё тело — мой дом, и я забочусь о нём.",
    "Я заслуживаю любви, в том числе своей собственной.",
    "С каждым днём я становлюсь себе ближе.",
  ],
  motivation: [
    "Каждый маленький шаг ведёт меня к большой цели.",
    "Энергия движется через меня и оживляет действия.",
    "Я начинаю — и Вселенная отвечает.",
    "Сегодня я делаю то, что отложил(а) вчера.",
    "Моё дыхание — мой двигатель.",
  ],
  peace: [
    "Я возвращаюсь в покой так часто, как нужно.",
    "Между вдохом и выдохом — моя тишина.",
    "Я отпускаю то, что не могу контролировать.",
    "Моя нервная система знает, как замедлиться.",
    "В моменте «сейчас» всё хорошо.",
  ],
  success: [
    "Возможности приходят ко мне естественно.",
    "Мой труд приносит достойные плоды.",
    "Я создан(а) для большего и иду к этому.",
    "Успех — это спокойное движение в свою сторону.",
    "Деньги приходят за моей энергией.",
  ],
  health: [
    "Моё тело умеет восстанавливаться каждую секунду.",
    "Я слышу сигналы своего тела и уважаю их.",
    "Дыхание наполняет меня жизнью.",
    "Сон возвращает мне силу и ясность.",
    "Моё здоровье — мой главный капитал.",
  ],
  gratitude: [
    "Я благодарю этот день за всё, что он принёс.",
    "Я замечаю красоту даже в мелочах.",
    "Чем больше я благодарю, тем больше получаю.",
    "Спасибо моему телу, моему пути, моим людям.",
    "Изобилие уже окружает меня.",
  ],
  relationships: [
    "Меня окружают люди, которые видят меня настоящим(ей).",
    "Я открыт(а) к глубоким и тёплым связям.",
    "Я даю и принимаю любовь свободно.",
    "Мои границы — это форма уважения к себе и другим.",
    "Правильные люди находят меня в правильное время.",
  ],
};

const allItems = (Object.entries(data) as [Exclude<CategoryKey, "all">, string[]][]).flatMap(
  ([cat, list]) => list.map((text) => ({ cat, text })),
);

function AffirmationsPage() {
  const [category, setCategory] = useState<CategoryKey>("all");
  const [current, setCurrent] = useState<{ cat: Exclude<CategoryKey, "all">; text: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const pool = useMemo(() => {
    if (category === "all") return allItems;
    return data[category].map((text) => ({ cat: category, text }));
  }, [category]);

  function generate() {
    if (pool.length === 0) return;
    let next = pool[Math.floor(Math.random() * pool.length)];
    if (current && pool.length > 1) {
      let guard = 0;
      while (next.text === current.text && guard++ < 5) {
        next = pool[Math.floor(Math.random() * pool.length)];
      }
    }
    setCurrent(next);
    setCopied(false);
  }

  async function copy() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  }

  const currentCatLabel =
    current && categories.find((c) => c.key === current.cat)?.label;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full border border-gold/15 animate-float-slow" />
        <div className="absolute top-40 left-10 w-40 h-40 rounded-full border border-gold/20 animate-float-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center animate-fade-up">
          <div className="text-xs uppercase tracking-[0.4em] text-gold">Практика</div>
          <h1 className="mt-4 font-display text-6xl md:text-7xl">
            Генератор <span className="text-gold-gradient italic">аффирмаций</span>
          </h1>
          <div className="hairline my-8 max-w-xs mx-auto" />
          <p className="max-w-xl mx-auto text-muted-foreground">
            Выберите тему — и получите фразу, которую полезно произнести себе сегодня. Тихо, без
            спешки, с дыханием.
          </p>
        </div>

        <section aria-label="Категории" className="mt-14">
          <div className="text-xs uppercase tracking-[0.3em] text-gold/80 mb-4">Категория</div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c.key === category;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`group inline-flex items-center gap-2 px-4 h-10 rounded-full border text-sm transition ${
                    active
                      ? "bg-gold-gradient text-primary-foreground border-transparent shadow-gold"
                      : "border-gold/40 text-foreground/80 hover:border-gold hover:bg-gold/10"
                  }`}
                  aria-pressed={active}
                >
                  <span className="text-base leading-none">{c.icon}</span>
                  <span className="tracking-wide">{c.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section
          aria-live="polite"
          aria-atomic="true"
          className="mt-12 relative rounded-2xl border border-gold/40 bg-card/50 p-10 md:p-14 min-h-[280px] flex items-center justify-center overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gold-soft/5 blur-3xl" />

          {current ? (
            <div key={current.text} className="relative text-center animate-fade-up">
              {currentCatLabel && (
                <span className="inline-block px-3 py-1 rounded-full border border-gold/50 text-[10px] uppercase tracking-[0.3em] text-gold mb-6">
                  {currentCatLabel}
                </span>
              )}
              <blockquote className="font-display text-3xl md:text-5xl leading-snug italic text-gold-gradient">
                «{current.text}»
              </blockquote>
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Сделайте вдох — и повторите про себя
              </p>
            </div>
          ) : (
            <div className="relative text-center text-muted-foreground">
              <div className="font-display text-7xl text-gold-gradient">✦</div>
              <p className="mt-4">Нажмите кнопку ниже, чтобы получить свою аффирмацию</p>
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={generate}
            className="inline-flex items-center gap-3 px-8 h-12 bg-gold-gradient text-primary-foreground rounded-xl text-sm uppercase tracking-[0.2em] shadow-gold hover:opacity-95 transition"
          >
            <Sparkles className="w-4 h-4" />
            {current ? "Ещё одну" : "Получить аффирмацию"}
          </button>
          {current && (
            <>
              <button
                type="button"
                onClick={generate}
                className="inline-flex items-center gap-3 px-6 h-12 border border-gold rounded-xl text-sm uppercase tracking-[0.2em] hover:bg-gold/10 transition"
              >
                <RefreshCw className="w-4 h-4 text-gold" />
                Другая
              </button>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-3 px-6 h-12 border border-gold/40 rounded-xl text-sm uppercase tracking-[0.2em] hover:bg-gold/10 transition"
              >
                {copied ? <Check className="w-4 h-4 text-gold" /> : <Copy className="w-4 h-4 text-gold" />}
                {copied ? "Скопировано" : "Скопировать"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
