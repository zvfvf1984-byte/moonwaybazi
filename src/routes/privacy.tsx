import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Политика конфиденциальности — Qi & Code" }] }),
  component: Page,
});

function Page() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20 prose prose-invert">
      <div className="text-xs uppercase tracking-[0.4em] text-gold">Документ</div>
      <h1 className="mt-4 font-display text-5xl">Политика конфиденциальности</h1>
      <div className="hairline my-8" />
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          Настоящая Политика описывает порядок обработки персональных данных пользователей сайта Qi & Code
          (далее — «Сайт»). Оставляя заявку, вы соглашаетесь с условиями ниже.
        </p>
        <Section title="1. Какие данные мы собираем">
          Имя, контактные данные (telegram, e-mail, телефон), дата и место рождения (если указаны вами),
          текст вашего обращения, а также технические данные (cookies, IP-адрес).
        </Section>
        <Section title="2. Цели обработки">
          Связь с вами по поводу заявки, подготовка и проведение консультации, улучшение работы сайта,
          выполнение требований законодательства.
        </Section>
        <Section title="3. Хранение и защита">
          Данные хранятся в защищённой облачной инфраструктуре. Доступ имеют только администраторы сайта.
          Срок хранения — не более 3 лет с момента последнего обращения.
        </Section>
        <Section title="4. Передача третьим лицам">
          Мы не передаём ваши данные третьим лицам, кроме случаев, прямо предусмотренных законом.
        </Section>
        <Section title="5. Ваши права">
          Вы можете запросить доступ, исправление или удаление своих данных, написав на контактный адрес,
          указанный на сайте.
        </Section>
        <Section title="6. Изменения политики">
          Мы вправе обновлять Политику. Актуальная версия всегда доступна на этой странице.
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-foreground mb-2">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
