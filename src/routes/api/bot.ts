import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { sendAdminTelegram, formatOrderMessage, formatTicketMessage } from "@/lib/notify.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

const InitSchema = z.object({
  action: z.literal("init"),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(5).max(40),
});

const MessageSchema = z.object({
  action: z.literal("message"),
  sessionId: z.string().uuid(),
  sessionToken: z.string().uuid(),
  text: z.string().trim().min(1).max(4000),
});

const HistorySchema = z.object({
  action: z.literal("history"),
  sessionId: z.string().uuid(),
  sessionToken: z.string().uuid(),
  since: z.string().optional(),
});

const Body = z.discriminatedUnion("action", [InitSchema, MessageSchema, HistorySchema]);

type SupabaseAdmin = Awaited<ReturnType<typeof getAdmin>>;

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function verifySession(admin: SupabaseAdmin, sessionId: string, token: string) {
  const { data, error } = await admin
    .from("chat_sessions")
    .select("id, session_token, visitor_name, visitor_phone, status")
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  if (data.session_token !== token) return null;
  return data;
}

type ChatMsg = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string; tool_calls?: any[]; name?: string };

async function loadServices(admin: SupabaseAdmin) {
  const { data } = await admin.from("services").select("id, title, slug, category, short_description, price, duration").eq("is_active", true).order("sort_order");
  return data ?? [];
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_order",
      description: "Оформить заявку клиенту, когда он подтвердил выбор консультации. Используйте только после явного согласия пользователя.",
      parameters: {
        type: "object",
        properties: {
          service_slug: { type: "string", description: "Slug услуги из каталога" },
          format: { type: "string", enum: ["online", "pdf"], description: "Онлайн-консультация или PDF-разбор" },
          direction: { type: "string", description: "Краткое описание интересующего направления (отношения, здоровье, деньги, и т.п.)" },
          birth_info: { type: "string", description: "Дата, время и место рождения, если уже сообщены" },
          extra_note: { type: "string", description: "Дополнительные пожелания клиента" },
        },
        required: ["service_slug", "format", "direction"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_operator",
      description: "Передать диалог оператору, если возникли трудности или клиент просит соединить с сотрудником.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Краткая причина эскалации" },
        },
        required: ["reason"],
      },
    },
  },
];

function systemPrompt(name: string, phone: string, services: any[]) {
  const catalog = services.map((s) => `- [${s.slug}] ${s.title} (${s.category}) — ${s.price}₽${s.duration ? `, ${s.duration}` : ""}. ${s.short_description}`).join("\n");
  return `Вы — дружелюбный консультант студии «Qi & Code» (китайская метафизика, Ба-Цзы, Ци Мэнь).
Клиент: ${name}, телефон: ${phone}.

Каталог консультаций:
${catalog}

Ваша задача:
1. Понять запрос клиента (личность, отношения, здоровье, финансы, карьера и т.п.).
2. Подобрать подходящую услугу из каталога. Объясните, чем она поможет именно ему.
3. Предложите два формата: онлайн-консультация (живая встреча с мастером) или письменный PDF-разбор по выбранному направлению.
4. PDF-разбор формируется индивидуально: для запроса про отношения — всё о партнёрстве и взаимоотношениях; про здоровье — карта здоровья и приходящие такты; про деньги — финансовый потенциал и денежные периоды; и так далее.
5. Когда клиент подтверждает выбор — вызовите инструмент create_order.
6. Если клиент в затруднении, недоволен или просит соединить с сотрудником — вызовите escalate_to_operator. После этого спокойно сообщите, что оператор скоро свяжется по телефону. Никогда не используйте слово «живой/живому» по отношению к оператору — пишите просто «оператор».

Отвечайте кратко, по-русски, на «вы». Не выдумывайте услуги, которых нет в каталоге.`;
}

async function callAI(messages: ChatMsg[]) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      tools: TOOLS,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI gateway ${res.status}: ${t.slice(0, 300)}`);
  }
  return (await res.json()) as any;
}

async function executeTool(
  admin: SupabaseAdmin,
  sessionId: string,
  visitor: { name: string; phone: string },
  toolName: string,
  args: any,
): Promise<string> {
  if (toolName === "create_order") {
    const { data: svc } = await admin.from("services").select("id, title, price").eq("slug", String(args.service_slug)).maybeSingle();
    if (!svc) return JSON.stringify({ ok: false, error: "Услуга не найдена" });
    const items = [{
      id: svc.id,
      title: `${svc.title} — ${args.format === "pdf" ? "PDF-разбор" : "онлайн-консультация"} (${args.direction})`,
      price: Number(svc.price),
      quantity: 1,
    }];
    const message = [
      `Формат: ${args.format === "pdf" ? "PDF-разбор" : "Онлайн-консультация"}`,
      `Направление: ${args.direction}`,
      args.extra_note ? `Заметка: ${args.extra_note}` : null,
      `Источник: чат-бот`,
    ].filter(Boolean).join("\n");
    const { data: order, error } = await admin.from("orders").insert({
      customer_name: visitor.name,
      customer_contact: visitor.phone,
      birth_info: args.birth_info ?? null,
      message,
      items,
      total: Number(svc.price),
      source: "bot",
      chat_session_id: sessionId,
    }).select("id").single();
    if (error) return JSON.stringify({ ok: false, error: error.message });
    sendAdminTelegram(formatOrderMessage({
      customer_name: visitor.name,
      customer_contact: visitor.phone,
      total: Number(svc.price),
      items,
      birth_info: args.birth_info ?? null,
      message,
      source: "bot",
    })).catch(() => {});
    return JSON.stringify({ ok: true, order_id: order.id, service: svc.title, total: svc.price });
  }
  if (toolName === "escalate_to_operator") {
    const reason = String(args.reason ?? "Клиент попросил оператора");
    await admin.from("chat_tickets").insert({ session_id: sessionId, reason });
    await admin.from("chat_sessions").update({ status: "escalated" }).eq("id", sessionId);
    sendAdminTelegram(formatTicketMessage({
      visitor_name: visitor.name,
      visitor_phone: visitor.phone,
      reason,
    })).catch(() => {});
    return JSON.stringify({ ok: true, note: "Оператор уведомлён и свяжется по телефону." });
  }
  return JSON.stringify({ ok: false, error: "Unknown tool" });
}

async function runConversation(admin: SupabaseAdmin, sessionId: string, visitor: { name: string; phone: string }) {
  // Load full history
  const { data: msgs } = await admin
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  const services = await loadServices(admin);
  const aiMessages: ChatMsg[] = [
    { role: "system", content: systemPrompt(visitor.name, visitor.phone, services) },
    ...(msgs ?? []).filter((m) => m.role !== "operator" && m.role !== "system").map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  for (let step = 0; step < 6; step++) {
    const data = await callAI(aiMessages);
    const choice = data.choices?.[0];
    if (!choice) throw new Error("Нет ответа от AI");
    const msg = choice.message;
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      aiMessages.push({ role: "assistant", content: msg.content ?? "", tool_calls: msg.tool_calls });
      for (const tc of msg.tool_calls) {
        let args: any = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
        const result = await executeTool(admin, sessionId, visitor, tc.function.name, args);
        aiMessages.push({ role: "tool", tool_call_id: tc.id, name: tc.function.name, content: result });
      }
      continue;
    }
    const reply: string = msg.content ?? "Извините, не удалось сформулировать ответ.";
    await admin.from("chat_messages").insert({ session_id: sessionId, role: "assistant", content: reply });
    await admin.from("chat_sessions").update({ last_message_at: new Date().toISOString() }).eq("id", sessionId);
    return reply;
  }
  const fallback = "Извините, диалог временно затруднён. Передаю оператору.";
  const reason = "Превышено число шагов AI";
  await admin.from("chat_tickets").insert({ session_id: sessionId, reason });
  await admin.from("chat_sessions").update({ status: "escalated" }).eq("id", sessionId);
  await admin.from("chat_messages").insert({ session_id: sessionId, role: "assistant", content: fallback });
  sendAdminTelegram(formatTicketMessage({
    visitor_name: visitor.name,
    visitor_phone: visitor.phone,
    reason,
  })).catch(() => {});
  return fallback;
}

export const Route = createFileRoute("/api/bot")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let body: unknown;
        try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders }); }
        const parsed = Body.safeParse(body);
        if (!parsed.success) return Response.json({ error: "Bad request", details: parsed.error.flatten() }, { status: 400, headers: corsHeaders });

        const admin = await getAdmin();

        if (parsed.data.action === "init") {
          const { data, error } = await admin.from("chat_sessions").insert({
            visitor_name: parsed.data.name,
            visitor_phone: parsed.data.phone,
          }).select("id, session_token").single();
          if (error || !data) return Response.json({ error: error?.message ?? "Не удалось создать сессию" }, { status: 500, headers: corsHeaders });

          const greeting = `Здравствуйте, ${parsed.data.name}! Я помогу подобрать консультацию. Расскажите, что вас сейчас волнует — отношения, здоровье, финансы, карьера или что-то ещё?`;
          await admin.from("chat_messages").insert({ session_id: data.id, role: "assistant", content: greeting });
          return Response.json({ sessionId: data.id, sessionToken: data.session_token, greeting }, { headers: corsHeaders });
        }

        if (parsed.data.action === "history") {
          const session = await verifySession(admin, parsed.data.sessionId, parsed.data.sessionToken);
          if (!session) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
          let q = admin.from("chat_messages").select("id, role, content, created_at").eq("session_id", parsed.data.sessionId).order("created_at", { ascending: true });
          if (parsed.data.since) q = q.gt("created_at", parsed.data.since);
          const { data } = await q;
          return Response.json({ messages: data ?? [], status: session.status }, { headers: corsHeaders });
        }

        // message
        const session = await verifySession(admin, parsed.data.sessionId, parsed.data.sessionToken);
        if (!session) return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
        await admin.from("chat_messages").insert({ session_id: session.id, role: "user", content: parsed.data.text });
        await admin.from("chat_sessions").update({ last_message_at: new Date().toISOString() }).eq("id", session.id);

        if (session.status === "escalated") {
          const notice = "Ваше сообщение получено. Оператор скоро свяжется с вами по телефону.";
          await admin.from("chat_messages").insert({ session_id: session.id, role: "assistant", content: notice });
          return Response.json({ reply: notice, status: "escalated" }, { headers: corsHeaders });
        }

        try {
          const reply = await runConversation(admin, session.id, { name: session.visitor_name, phone: session.visitor_phone });
          const { data: fresh } = await admin.from("chat_sessions").select("status").eq("id", session.id).single();
          return Response.json({ reply, status: fresh?.status ?? "active" }, { headers: corsHeaders });
        } catch (e: any) {
          console.error("Bot error", e);
          const msg = "Извините, временная ошибка. Попробуйте ещё раз через минуту.";
          await admin.from("chat_messages").insert({ session_id: session.id, role: "assistant", content: msg });
          return Response.json({ reply: msg, status: "active", error: e?.message }, { status: 200, headers: corsHeaders });
        }
      },
    },
  },
});
