import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/offer")({
  head: () => ({ meta: [{ title: "Публичная оферта — Qi & Code" }] }),
  component: Page,
});

function Page() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-xs uppercase tracking-[0.4em] text-gold">Документ</div>
      <h1 className="mt-4 font-display text-5xl">Публичная оферта</h1>
      <div className="hairline my-8" />
      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          Настоящий документ является официальным предложением (офертой) Qi & Code заключить договор
          возмездного оказания консультационных услуг на условиях, изложенных ниже.
        </p>
        <Section title="1. Предмет договора">
          Исполнитель оказывает Заказчику персональные консультации по китайской метафизике (Ба-Цзы,
          Ци Мэнь Дунь Цзя, фэн-шуй и смежным системам) в формате онлайн-сессии.
        </Section>
        <Section title="2. Порядок заказа">
          Заказчик оформляет заявку на сайте. Исполнитель связывается в течение 24 часов для согласования
          даты, времени и формата оплаты. Услуга считается заказанной после подтверждения времени.
        </Section>
        <Section title="3. Стоимость и оплата">
          Цена указана на странице каждой услуги. Оплата производится до начала консультации удобным
          способом, согласованным с Исполнителем.
        </Section>
        <Section title="4. Порядок оказания услуг">
          Консультация проводится по видеосвязи. По завершении Заказчику направляется письменное резюме
          с ключевыми выводами и рекомендациями.
        </Section>
        <Section title="5. Возврат и отмена">
          Возврат возможен до начала сессии. После проведения консультации услуга считается оказанной
          в полном объёме.
        </Section>
        <Section title="6. Ответственность">
          Рекомендации носят информационный характер и не заменяют профессиональную медицинскую, юридическую
          или финансовую помощь.
        </Section>
        <Section title="7. Прочие условия">
          Принимая оферту, Заказчик подтверждает согласие с условиями и Политикой конфиденциальности.
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
