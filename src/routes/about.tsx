import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "О методе — Qi & Code" },
      { name: "description", content: "Что такое Ба-Цзы и Ци Мэнь Дунь Цзя — кратко и по существу." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="text-xs uppercase tracking-[0.4em] text-gold">Метод</div>
      <h1 className="mt-4 font-display text-6xl">Древние системы — современный язык</h1>
      <div className="hairline my-10" />

      <div className="grid md:grid-cols-2 gap-10">
        <Card chinese="八字" title="Ба-Цзы" subtitle="Четыре столпа судьбы">
          Карта личности, построенная из ваших года, месяца, дня и часа рождения. Каждый столп —
          две стихии, формирующие 8 иероглифов. Из них читаются таланты, типы отношений, финансовые
          каналы и десятилетние циклы.
        </Card>
        <Card chinese="奇門遁甲" title="Ци Мэнь Дунь Цзя" subtitle="Искусство тактики">
          Древняя система прогнозов и стратегии. Помогает выбрать время и направление для важных
          действий: переговоров, переезда, инвестиций, встреч.
        </Card>
        <Card chinese="風水" title="Фэн-шуй" subtitle="Энергия пространства">
          Анализ дома или офиса с точки зрения потоков ци. Корректирует рабочее место, спальню и
          вход — туда, где живёт ваша удача.
        </Card>
        <Card chinese="五行" title="У-син" subtitle="Пять стихий">
          Базовый язык всех систем: Дерево, Огонь, Земля, Металл, Вода. Их баланс или дисбаланс
          в карте — ключ к здоровью, поведению и решениям.
        </Card>
      </div>

      <div className="mt-16 text-center">
        <Link to="/catalog" className="inline-flex items-center gap-3 px-8 py-4 bg-gold-gradient text-primary-foreground rounded-xl text-sm uppercase tracking-[0.2em] shadow-gold">
          Выбрать консультацию
        </Link>
      </div>
    </div>
  );
}

function Card({ chinese, title, subtitle, children }: { chinese: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="p-8 border border-gold/30 rounded-xl bg-card/40">
      <div className="font-display text-5xl text-gold-gradient">{chinese}</div>
      <div className="mt-4 font-display text-2xl">{title}</div>
      <div className="text-xs uppercase tracking-[0.3em] text-gold mt-1">{subtitle}</div>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}
