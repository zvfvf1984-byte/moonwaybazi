import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, Minus, Plus, ArrowLeft, Sparkles } from "lucide-react";
import { useCart, removeFromCart, updateQty, cartTotal, formatPrice, clearCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { notifyOrderCreated } from "@/lib/notify.functions";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Корзина — Qi & Code" }] }),
  component: CartPage,
});

const formSchema = z.object({
  customer_name: z.string().trim().min(2, "Укажите имя").max(100),
  customer_contact: z.string().trim().min(5, "Укажите контакт").max(200),
  birth_info: z.string().trim().max(500).optional(),
  message: z.string().trim().max(2000).optional(),
});

function CartPage() {
  const items = useCart();
  const total = cartTotal(items);
  const navigate = useNavigate();
  const [form, setForm] = useState({ customer_name: "", customer_contact: "", birth_info: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте поля");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("orders").insert({
      customer_name: parsed.data.customer_name,
      customer_contact: parsed.data.customer_contact,
      birth_info: parsed.data.birth_info || null,
      message: parsed.data.message || null,
      items: items.map((i) => ({ id: i.id, slug: i.slug, title: i.title, price: i.price, quantity: i.quantity })),
      total,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Не удалось отправить заявку");
      return;
    }
    clearCart();
    toast.success("Заявка отправлена! Мы свяжемся с вами.");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold transition">
        <ArrowLeft className="w-4 h-4" /> продолжить выбор
      </Link>
      <h1 className="mt-6 font-display text-5xl">Корзина</h1>

      {items.length === 0 ? (
        <div className="mt-20 text-center">
          <div className="mx-auto w-20 h-20 rounded-full border border-gold/40 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gold" />
          </div>
          <p className="mt-6 text-muted-foreground">Здесь пока пусто. Выберите консультацию в каталоге.</p>
          <Link to="/catalog" className="mt-6 inline-block px-8 py-3 bg-gold-gradient text-primary-foreground rounded-xl text-sm uppercase tracking-[0.2em]">
            В каталог
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-4">
            {items.map((i) => (
              <div key={i.id} className="p-6 border border-gold/30 rounded-xl bg-card/50 flex items-center gap-6">
                <div className="flex-1">
                  <Link to="/service/$slug" params={{ slug: i.slug }} className="font-display text-xl hover:text-gold transition">
                    {i.title}
                  </Link>
                  <div className="mt-1 text-sm text-muted-foreground">{formatPrice(i.price)} × {i.quantity}</div>
                </div>
                <div className="flex items-center gap-1 border border-gold/40 rounded-xl">
                  <button onClick={() => updateQty(i.id, i.quantity - 1)} className="w-9 h-9 hover:bg-gold/10"><Minus className="w-3 h-3 mx-auto" /></button>
                  <div className="w-8 text-center text-sm">{i.quantity}</div>
                  <button onClick={() => updateQty(i.id, i.quantity + 1)} className="w-9 h-9 hover:bg-gold/10"><Plus className="w-3 h-3 mx-auto" /></button>
                </div>
                <div className="font-display text-xl text-gold w-32 text-right">{formatPrice(i.price * i.quantity)}</div>
                <button onClick={() => removeFromCart(i.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="pt-6 border-t border-gold/30 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Итого</div>
              <div className="font-display text-4xl text-gold-gradient">{formatPrice(total)}</div>
            </div>
          </div>

          <form onSubmit={submit} className="lg:col-span-5 p-8 border border-gold/40 rounded-xl bg-card/60 space-y-5 h-fit sticky top-28">
            <h2 className="font-display text-2xl text-gold">Оформление заявки</h2>
            <Field label="Имя" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} required />
            <Field label="Telegram / e-mail / телефон" value={form.customer_contact} onChange={(v) => setForm({ ...form, customer_contact: v })} required />
            <Field label="Дата, время и место рождения (если знаете)" value={form.birth_info} onChange={(v) => setForm({ ...form, birth_info: v })} />
            <TextArea label="Ваш вопрос (опционально)" value={form.message} onChange={(v) => setForm({ ...form, message: v })} />
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 bg-gold-gradient text-primary-foreground rounded-xl text-sm uppercase tracking-[0.2em] hover:opacity-95 shadow-gold transition disabled:opacity-60"
            >
              {submitting ? "Отправляем…" : "Отправить заявку"}
            </button>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Нажимая кнопку, вы соглашаетесь с <Link to="/privacy" className="text-gold underline">политикой конфиденциальности</Link> и
              <Link to="/offer" className="text-gold underline ml-1">офертой</Link>.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{label}{required && " *"}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-xl focus:border-gold focus:outline-none transition"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-xl focus:border-gold focus:outline-none transition resize-none"
      />
    </label>
  );
}
