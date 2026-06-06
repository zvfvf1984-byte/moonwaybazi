import { useSyncExternalStore } from "react";

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  price: number;
  quantity: number;
};

const STORAGE_KEY = "qi-cart-v1";
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: CartItem[]) {
  cache = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCart() {
  return useSyncExternalStore(subscribe, read, () => []);
}

export function addToCart(item: Omit<CartItem, "quantity">, qty = 1) {
  const items = [...read()];
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = { ...items[idx], quantity: items[idx].quantity + qty };
  else items.push({ ...item, quantity: qty });
  write(items);
}

export function removeFromCart(id: string) {
  write(read().filter((i) => i.id !== id));
}

export function updateQty(id: string, qty: number) {
  if (qty <= 0) return removeFromCart(id);
  write(read().map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
}

export function clearCart() {
  write([]);
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}
