import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Trash2, Minus, Plus, ArrowLeft, Sparkles, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useCart, removeFromCart, updateQty, cartTotal, formatPrice, clearCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { notifyOrderCreated } from "@/lib/notify.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Корзина — Qi & Code" }] }),
  component: CartPage,
});

type ContactType = "telegram" | "email" | "phone";

const baseSchema = z.object({
  customer_name: z.string().trim().min(2, "Укажите имя").max(100),
  contact_type: z.enum(["telegram", "email", "phone"]),
  contact_value: z.string().trim().min(1, "Укажите контакт").max(200),
  birth_date: z.string().optional(),
  birth_time: z.string().optional(),
  birth_place: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
}).superRefine((val, ctx) => {
  const v = val.contact_value.trim();
  if (val.contact_type === "telegram") {
    if (!/^@?[a-zA-Z0-9_]{4,}$|^(https?:\/\/)?t\.me\/[a-zA-Z0-9_]{4,}$/.test(v)) {
      ctx.addIssue({ code: "custom", path: ["contact_value"], message: "Введите Telegram username (@user) или ссылку t.me/user" });
    }
  } else if (val.contact_type === "email") {
    if (!z.string().email().safeParse(v).success) {
      ctx.addIssue({ code: "custom", path: ["contact_value"], message: "Введите корректный e-mail" });
    }
  } else if (val.contact_type === "phone") {
    const digits = v.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) {
      ctx.addIssue({ code: "custom", path: ["contact_value"], message: "Введите номер телефона (10–15 цифр)" });
    }
  }
  if (val.birth_time && !val.birth_date) {
    ctx.addIssue({ code: "custom", path: ["birth_date"], message: "Укажите дату рождения" });
  }
});

const CONTACT_TABS: { id: ContactType; label: string; placeholder: string }[] = [
  { id: "telegram", label: "Telegram", placeholder: "@username или t.me/username" },
  { id: "email", label: "E-mail", placeholder: "you@example.com" },
  { id: "phone", label: "Телефон", placeholder: "+7 999 123-45-67" },
];

function CartPage() {
  const items = useCart();
  const total = cartTotal(items);
  const navigate = useNavigate();
  const notifyOrder = useServerFn(notifyOrderCreated);
  const [customerName, setCustomerName] = useState("");
  const [contactType, setContactType] = useState<ContactType>("telegram");
  const [contactValue, setContactValue] = useState("");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleContactChange = (val: string) => {
    if (contactType === "phone") {
      // allow only digits, +, spaces, (), -
      setContactValue(val.replace(/[^\d+\s()-]/g, ""));
    } else if (contactType === "telegram") {
      setContactValue(val.replace(/[^a-zA-Z0-9_@./:]/g, ""));
    } else {
      setContactValue(val);
    }
  };

  const switchContactType = (t: ContactType) => {
    setContactType(t);
    setContactValue("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const birthDateStr = birthDate ? format(birthDate, "dd.MM.yyyy") : "";
    const parsed = baseSchema.safeParse({
      customer_name: customerName,
      contact_type: contactType,
      contact_value: contactValue,
      birth_date: birthDateStr,
      birth_time: birthTime,
      birth_place: birthPlace,
      message,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте поля");
      return;
    }

    const contactLabel = contactType === "telegram" ? "Telegram" : contactType === "email" ? "E-mail" : "Телефон";
    const customer_contact = `${contactLabel}: ${parsed.data.contact_value.trim()}`;
    const birthParts = [birthDateStr, birthTime, birthPlace.trim()].filter(Boolean);
    const birth_info = birthParts.length ? birthParts.join(", ") : null;

    setSubmitting(true);
    const { data: inserted, error } = await supabase.from("orders").insert({
      customer_name: parsed.data.customer_name,
      customer_contact,
      birth_info,
      message: message.trim() || null,
      items: items.map((i) => ({ id: i.id, slug: i.slug, title: i.title, price: i.price, quantity: i.quantity })),
      total,
    }).select("id").single();
    setSubmitting(false);
    if (error) {
      toast.error("Не удалось отправить заявку");
      return;
    }
    if (inserted?.id) {
      notifyOrder({ data: { orderId: inserted.id } }).catch(() => {});
    }
    clearCart();
    toast.success("Заявка отправлена! Мы свяжемся с вами.");
    navigate({ to: "/" });
  };

  const activeTab = CONTACT_TABS.find((t) => t.id === contactType)!;

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

            <Field label="Имя" value={customerName} onChange={setCustomerName} required />

            {/* Contact: type selector + value */}
            <div>
              <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Способ связи *</span>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {CONTACT_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => switchContactType(t.id)}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-xs uppercase tracking-[0.15em] transition",
                      contactType === t.id
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-gold/30 text-muted-foreground hover:border-gold/60",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <input
                value={contactValue}
                onChange={(e) => handleContactChange(e.target.value)}
                placeholder={activeTab.placeholder}
                required
                inputMode={contactType === "phone" ? "tel" : contactType === "email" ? "email" : "text"}
                type={contactType === "email" ? "email" : "text"}
                className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-xl focus:border-gold focus:outline-none transition"
              />
            </div>

            {/* Birth: date + time + place */}
            <div>
              <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Данные рождения (если знаете)</span>
              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-xl text-left flex items-center gap-2 hover:border-gold/60 transition",
                        !birthDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 text-gold" />
                      {birthDate ? format(birthDate, "dd.MM.yyyy") : "Дата"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={birthDate}
                      onSelect={setBirthDate}
                      captionLayout="dropdown"
                      defaultMonth={birthDate ?? new Date(1990, 0)}
                      disabled={(d) => d > new Date() || d < new Date(1900, 0, 1)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-xl focus:border-gold focus:outline-none transition"
                />
              </div>
              <input
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="Место рождения (город, страна)"
                className="mt-3 w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-xl focus:border-gold focus:outline-none transition"
              />
            </div>

            <TextArea label="Ваш вопрос (опционально)" value={message} onChange={setMessage} />
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
