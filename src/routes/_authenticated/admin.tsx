import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, LogOut, ShieldAlert, Check, X } from "lucide-react";
import { formatPrice } from "@/lib/cart";

type Service = {
  id: string;
  title: string;
  slug: string;
  category: string;
  short_description: string;
  long_description: string;
  price: number;
  duration: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  includes: string[];
};

type Order = {
  id: string;
  customer_name: string;
  customer_contact: string;
  birth_info: string | null;
  message: string | null;
  items: { title: string; price: number; quantity: number }[];
  total: number;
  status: "new" | "in_progress" | "done" | "cancelled";
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Админка — Qi & Code" }] }),
  component: Admin,
});

function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"orders" | "services">("orders");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!error && !!data);
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (isAdmin === null) return <div className="p-20 text-center text-muted-foreground">Проверяем доступ…</div>;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <ShieldAlert className="mx-auto w-12 h-12 text-gold" />
        <h1 className="mt-6 font-display text-3xl">Доступ ограничен</h1>
        <p className="mt-4 text-muted-foreground">
          У вашего аккаунта нет роли администратора. Попросите супер-админа выдать вам роль командой:
        </p>
        <pre className="mt-6 p-4 bg-card border border-gold/30 rounded-sm text-xs text-left overflow-auto">
{`INSERT INTO public.user_roles (user_id, role)
VALUES ('${userId ?? "<ваш user_id>"}', 'admin');`}
        </pre>
        <button onClick={signOut} className="mt-8 px-6 py-3 border border-gold rounded-sm text-sm uppercase tracking-[0.2em] hover:bg-gold/10">
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.4em] text-gold">Панель управления</div>
          <h1 className="mt-2 font-display text-4xl">Админка</h1>
        </div>
        <button onClick={signOut} className="inline-flex items-center gap-2 px-5 py-2.5 border border-gold rounded-sm text-xs uppercase tracking-[0.2em] hover:bg-gold/10">
          <LogOut className="w-4 h-4" /> Выйти
        </button>
      </div>

      <div className="mt-8 flex gap-2 border-b border-gold/30">
        {(["orders", "services"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-xs uppercase tracking-[0.2em] border-b-2 transition ${
              tab === t ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-gold"
            }`}
          >
            {t === "orders" ? "Заявки" : "Каталог"}
          </button>
        ))}
      </div>

      <div className="mt-8">{tab === "orders" ? <OrdersTab /> : <ServicesTab />}</div>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  const load = async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setOrders((data as unknown as Order[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Статус обновлён");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить заявку?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  if (!orders) return <div className="text-muted-foreground">Загрузка…</div>;
  if (orders.length === 0) return <div className="text-muted-foreground">Заявок пока нет.</div>;

  const statusLabel: Record<Order["status"], string> = {
    new: "Новая", in_progress: "В работе", done: "Готово", cancelled: "Отменена",
  };

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="p-6 border border-gold/30 rounded-sm bg-card/40">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="font-display text-2xl">{o.customer_name}</div>
              <div className="text-sm text-muted-foreground">{o.customer_contact}</div>
              <div className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString("ru-RU")}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="font-display text-2xl text-gold-gradient">{formatPrice(Number(o.total))}</div>
              <select
                value={o.status}
                onChange={(e) => setStatus(o.id, e.target.value as Order["status"])}
                className="px-3 py-1.5 bg-background border border-gold/30 rounded-sm text-xs uppercase tracking-wider"
              >
                {(Object.keys(statusLabel) as Order["status"][]).map((s) => (
                  <option key={s} value={s}>{statusLabel[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 space-y-1 text-sm">
            {(o.items ?? []).map((it, idx) => (
              <div key={idx} className="flex justify-between border-b border-gold/10 py-1">
                <span>{it.title} × {it.quantity}</span>
                <span className="text-gold">{formatPrice(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>
          {o.birth_info && <div className="mt-3 text-sm"><span className="text-gold">Рождение:</span> {o.birth_info}</div>}
          {o.message && <div className="mt-2 text-sm text-muted-foreground italic">«{o.message}»</div>}
          <div className="mt-4 flex justify-end">
            <button onClick={() => remove(o.id)} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-destructive hover:opacity-80">
              <Trash2 className="w-3 h-3" /> Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function emptyService(): Partial<Service> {
  return { title: "", slug: "", category: "Личность", short_description: "", long_description: "", price: 0, duration: "", icon: "Sparkles", is_active: true, sort_order: 0, includes: ["Персональный разбор по дате и времени рождения","Письменное резюме после сессии","Рекомендации по благоприятным датам","Конфиденциальность гарантирована"] };
}

function ServicesTab() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);

  const load = async () => {
    const { data, error } = await supabase.from("services").select("*").order("sort_order");
    if (error) return toast.error(error.message);
    setServices((data as unknown as Service[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      title: editing.title ?? "",
      slug: (editing.slug ?? "").trim() || (editing.title ?? "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      category: editing.category ?? "Личность",
      short_description: editing.short_description ?? "",
      long_description: editing.long_description ?? "",
      price: Number(editing.price ?? 0),
      duration: editing.duration ?? null,
      icon: editing.icon ?? "Sparkles",
      is_active: editing.is_active ?? true,
      sort_order: Number(editing.sort_order ?? 0),
      includes: (editing.includes ?? []).filter((x) => x && x.trim().length > 0),
    };
    const op = editing.id
      ? supabase.from("services").update(payload).eq("id", editing.id)
      : supabase.from("services").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Сохранено");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить услугу?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  if (!services) return <div className="text-muted-foreground">Загрузка…</div>;

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button onClick={() => setEditing(emptyService())} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-primary-foreground rounded-sm text-xs uppercase tracking-[0.2em] shadow-gold">
          <Plus className="w-4 h-4" /> Добавить услугу
        </button>
      </div>

      <div className="grid gap-3">
        {services.map((s) => (
          <div key={s.id} className="p-5 border border-gold/30 rounded-sm bg-card/40 flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="font-display text-xl">{s.title}</div>
                {!s.is_active && <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider border border-muted-foreground/40 rounded">скрыта</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-1">/{s.slug} · {s.category}</div>
            </div>
            <div className="font-display text-xl text-gold">{formatPrice(Number(s.price))}</div>
            <button onClick={() => setEditing(s)} className="text-muted-foreground hover:text-gold"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-card border border-gold/40 rounded-sm w-full max-w-2xl p-8 my-10">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl">{editing.id ? "Редактировать" : "Новая услуга"}</h3>
              <button onClick={() => setEditing(null)} className="w-10 h-10 hover:bg-gold/10 rounded"><X className="w-4 h-4 mx-auto" /></button>
            </div>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <AField label="Название" value={editing.title ?? ""} onChange={(v) => setEditing({ ...editing, title: v })} />
              <AField label="Slug (URL)" value={editing.slug ?? ""} onChange={(v) => setEditing({ ...editing, slug: v })} />
              <AField label="Категория" value={editing.category ?? ""} onChange={(v) => setEditing({ ...editing, category: v })} />
              <AField label="Иконка (Sparkles, Coins, Heart, Mountain, Leaf, Moon)" value={editing.icon ?? ""} onChange={(v) => setEditing({ ...editing, icon: v })} />
              <AField label="Цена" type="number" value={String(editing.price ?? 0)} onChange={(v) => setEditing({ ...editing, price: Number(v) })} />
              <AField label="Длительность" value={editing.duration ?? ""} onChange={(v) => setEditing({ ...editing, duration: v })} />
              <AField label="Сортировка" type="number" value={String(editing.sort_order ?? 0)} onChange={(v) => setEditing({ ...editing, sort_order: Number(v) })} />
              <label className="flex items-center gap-3 px-4 py-3 border border-gold/30 rounded-sm">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                <span className="text-sm">Активна</span>
              </label>
            </div>
            <div className="mt-4">
              <label className="block">
                <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Краткое описание</span>
                <textarea value={editing.short_description ?? ""} onChange={(e) => setEditing({ ...editing, short_description: e.target.value })} rows={2} className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-sm focus:border-gold focus:outline-none resize-none" />
              </label>
            </div>
            <div className="mt-4">
              <label className="block">
                <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Полное описание</span>
                <textarea value={editing.long_description ?? ""} onChange={(e) => setEditing({ ...editing, long_description: e.target.value })} rows={5} className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-sm focus:border-gold focus:outline-none resize-none" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-5 py-2.5 border border-gold/40 rounded-sm text-xs uppercase tracking-[0.2em] hover:bg-gold/10">Отмена</button>
              <button onClick={save} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gold-gradient text-primary-foreground rounded-sm text-xs uppercase tracking-[0.2em] shadow-gold">
                <Check className="w-4 h-4" /> Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 bg-background/60 border border-gold/30 rounded-sm focus:border-gold focus:outline-none" />
    </label>
  );
}
