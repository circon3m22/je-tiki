import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { getWebPushConfig, sendWebPush } from "../_shared/web-push.ts";

type AdminAction = { action?: unknown };

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "method_not_allowed" }, { status: 405 });
    }

    const userId = ctx.userClaims?.id;
    if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
    const { data: admin } = await ctx.supabaseAdmin
      .from("admin_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!admin) return Response.json({ error: "forbidden" }, { status: 403 });

    let payload: AdminAction;
    try { payload = await req.json() as AdminAction; }
    catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }

    if (payload.action === "settings") {
      const config = await getWebPushConfig(ctx.supabaseAdmin);
      if (!config) return Response.json({ error: "push_not_configured" }, { status: 503 });
      return Response.json({ publicKey: config.publicKey });
    }

    if (payload.action === "test") {
      const { data: subscriptions, error } = await ctx.supabaseAdmin
        .from("admin_push_subscriptions")
        .select("id,endpoint,p256dh,auth")
        .eq("admin_user_id", userId);
      if (error) return Response.json({ error: "subscriptions_unavailable" }, { status: 500 });
      const result = await sendWebPush(ctx.supabaseAdmin, subscriptions ?? [], {
        title: "JE TIKI · Проверка",
        body: "Push-уведомления о новых заказах работают.",
        url: "admin/",
        tag: `je-tiki-test-${Date.now()}`,
      });
      return Response.json(result);
    }

    return Response.json({ error: "unknown_action" }, { status: 400 });
  }),
};
