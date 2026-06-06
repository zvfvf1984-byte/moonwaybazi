// Server-only helper: send a Telegram message to the admin via the Lovable
// connector gateway. Silent no-op if not configured — never throw to the caller.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

export async function sendAdminTelegram(text: string): Promise<void> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  const chatId = process.env.TG_ADMIN_CHAT_ID;
  if (!lovableKey || !tgKey || !chatId) {
    console.warn("[notify] Telegram not configured, skipping");
    return;
  }
  try {
    const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": tgKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[notify] Telegram ${res.status}: ${body.slice(0, 300)}`);
    }
  } catch (e) {
    console.error("[notify] Telegram error", e);
  }
}

function esc(s: string | null | undefined): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ADMIN_URL = "https://moonwaybazi.lovable.app/admin";

export function formatOrderMessage(order: {
  customer_name: string;
  customer_contact: string;
  total: number | string;
  items: any;
  birth_info?: string | null;
  message?: string | null;
  source?: string | null;
}): string {
  const itemsArr = Array.isArray(order.items) ? order.items : [];
  const list = itemsArr
    .map((i: any) => `• ${esc(i.title)} — ${i.quantity ?? 1} × ${i.price}₽`)
    .join("\n") || "—";
  const lines = [
    `🔔 <b>Новая заявка${order.source === "bot" ? " (из чат-бота)" : ""}</b>`,
    `<b>Имя:</b> ${esc(order.customer_name)}`,
    `<b>Контакт:</b> ${esc(order.customer_contact)}`,
    `<b>Сумма:</b> ${order.total}₽`,
    ``,
    `<b>Состав:</b>`,
    list,
  ];
  if (order.birth_info) lines.push(``, `<b>Данные рождения:</b> ${esc(order.birth_info)}`);
  if (order.message) lines.push(``, `<b>Сообщение:</b> ${esc(order.message)}`);
  lines.push(``, `<a href="${ADMIN_URL}">Открыть в админке</a>`);
  return lines.join("\n");
}

export function formatTicketMessage(t: {
  visitor_name: string;
  visitor_phone: string;
  reason: string;
}): string {
  return [
    `⚠️ <b>Новый тикет из чата</b>`,
    `<b>Клиент:</b> ${esc(t.visitor_name)} (${esc(t.visitor_phone)})`,
    `<b>Причина:</b> ${esc(t.reason)}`,
    ``,
    `<a href="${ADMIN_URL}">Открыть чат в админке</a>`,
  ].join("\n");
}
