import { useEffect, useMemo, useState } from "react";
import { Copy, RefreshCw, Sparkles, Check, X } from "lucide-react";

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

const categories: { key: CategoryKey; label: string; icon: string }[] = [
  { key: "all", label: "Все", icon: "✦" },
  { key: "confidence", label: "Уверенность", icon: "💪" },
  { key: "self-love", label: "Любовь к себе", icon: "💗" },
  { key: "motivation", label: "Мотивация", icon: "🚀" },
  { key: "peace", label: "Спокойствие", icon: "🌿" },
  { key: "success", label: "Успех", icon: "⭐" },
  { key: "health", label: "Здоровье", icon: "🍃" },
  { key: "gratitude", label: "Благодарность", icon: "🙏" },
  { key: "relationships", label: "Отношения", icon: "💫" },
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

export function AffirmationsWidget({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [category, setCategory] = useState<CategoryKey>("all");
  const [current, setCurrent] = useState<{ cat: Exclude<CategoryKey, "all">; text: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const pool = useMemo(() => {
    if (category === "all") return allItems;
    return data[category].map((text) => ({ cat: category, text }));
  }, [category]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

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

  if (!open) return null;

  const currentCatLabel = current && categories.find((c) => c.key === current.cat)?.label;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Генератор аффирмаций"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-up"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gold/50 bg-card shadow-elevated animate-fade-up">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-4 right-4 w-10 h-10 rounded-full border border-gold/40 flex items-center justify-center hover:bg-gold/10 transition z-10"
        >
          <X className="w-4 h-4 text-gold" />
        </button>

        <div className="relative p-6 md:p-10">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gold">Практика</div>
            <h2 className="mt-3 font-display text-3xl md:text-4xl">
              Генератор <span className="text-gold-gradient italic">аффирмаций</span>
            </h2>
            <div className="hairline my-5 max-w-[180px] mx-auto" />
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Зарядись положительной энергией на весь день. Выбери тему — и получи фразу для себя.
            </p>
          </div>

          <div className="mt-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold/80 mb-3">
              Категория
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = c.key === category;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={`inline-flex items-center gap-2 px-3 h-9 rounded-full border text-xs transition ${
                      active
                        ? "bg-gold-gradient text-primary-foreground border-transparent shadow-gold"
                        : "border-gold/40 text-foreground/80 hover:border-gold hover:bg-gold/10"
                    }`}
                    aria-pressed={active}
                  >
                    <span className="text-sm leading-none">{c.icon}</span>
                    <span className="tracking-wide">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            aria-live="polite"
            className="mt-8 relative rounded-xl border border-gold/40 bg-background/40 p-6 md:p-10 min-h-[220px] flex items-center justify-center overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-gold/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gold-soft/5 blur-3xl" />
            {current ? (
              <div key={current.text} className="relative text-center animate-fade-up">
                {currentCatLabel && (
                  <span className="inline-block px-3 py-1 rounded-full border border-gold/50 text-[10px] uppercase tracking-[0.3em] text-gold mb-4">
                    {currentCatLabel}
                  </span>
                )}
                <blockquote className="font-display text-2xl md:text-3xl leading-snug italic text-gold-gradient">
                  «{current.text}»
                </blockquote>
                <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  Сделай вдох — и повтори про себя
                </p>
              </div>
            ) : (
              <div className="relative text-center text-muted-foreground">
                <div className="font-display text-6xl text-gold-gradient">✦</div>
                <p className="mt-3 text-sm">Нажми кнопку ниже, чтобы получить аффирмацию</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={generate}
              className="inline-flex items-center gap-2 px-6 h-11 bg-gold-gradient text-primary-foreground rounded-xl text-xs uppercase tracking-[0.2em] shadow-gold hover:opacity-95 transition"
            >
              <Sparkles className="w-4 h-4" />
              {current ? "Ещё одну" : "Получить аффирмацию"}
            </button>
            {current && (
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-2 px-5 h-11 border border-gold/50 rounded-xl text-xs uppercase tracking-[0.2em] hover:bg-gold/10 transition"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-gold" />
                ) : (
                  <Copy className="w-4 h-4 text-gold" />
                )}
                {copied ? "Скопировано" : "Скопировать"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
