import webpush from "npm:web-push@3.6.7";

type PushRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type AdminClient = {
  rpc: (name: string) => Promise<{ data: Array<{ public_key: string; private_key: string; subject: string }> | null; error: unknown }>;
  from: (table: string) => {
    delete: () => { in: (column: string, values: string[]) => Promise<unknown> };
  };
};

export async function getWebPushConfig(supabaseAdmin: AdminClient) {
  const environmentConfig = {
    publicKey: Deno.env.get("VAPID_PUBLIC_KEY") ?? "",
    privateKey: Deno.env.get("VAPID_PRIVATE_KEY") ?? "",
    subject: Deno.env.get("VAPID_SUBJECT") ?? "mailto:habkraihistory@gmail.com",
  };
  if (environmentConfig.publicKey && environmentConfig.privateKey) return environmentConfig;

  const { data, error } = await supabaseAdmin.rpc("get_web_push_config");
  if (error || !data?.[0]) return null;
  return {
    publicKey: data[0].public_key,
    privateKey: data[0].private_key,
    subject: data[0].subject,
  };
}

export async function sendWebPush(
  supabaseAdmin: AdminClient,
  subscriptions: PushRow[],
  payload: PushPayload,
) {
  const config = await getWebPushConfig(supabaseAdmin);
  if (!config || !subscriptions.length) return { sent: 0, expired: 0 };

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  const expiredIds: string[] = [];
  let sent = 0;

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }, JSON.stringify(payload), { TTL: 60 * 60, urgency: "high" });
      sent += 1;
    } catch (error) {
      const statusCode = Number((error as { statusCode?: number }).statusCode ?? 0);
      if (statusCode === 404 || statusCode === 410) expiredIds.push(subscription.id);
      else console.error("Web Push delivery failed", statusCode || error);
    }
  }));

  if (expiredIds.length) {
    await supabaseAdmin.from("admin_push_subscriptions").delete().in("id", expiredIds);
  }
  return { sent, expired: expiredIds.length };
}
