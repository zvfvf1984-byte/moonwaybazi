import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public server fn: triggered by client after a successful order insert.
// Reads the order via service-role client and notifies the admin in Telegram.
// Failure is swallowed — notification must never break checkout UX.
export const notifyOrderCreated = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { sendAdminTelegram, formatOrderMessage } = await import("./notify.server");
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .select("customer_name, customer_contact, total, items, birth_info, message, source")
        .eq("id", data.orderId)
        .maybeSingle();
      if (error || !order) return { ok: false };
      await sendAdminTelegram(formatOrderMessage(order as any));
      return { ok: true };
    } catch (e) {
      console.error("[notifyOrderCreated]", e);
      return { ok: false };
    }
  });
