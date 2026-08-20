const APP_BASE = self.location.pathname.replace(/\/sw\.js$/, "");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() ?? {}; } catch { payload = { body: event.data?.text() ?? "" }; }
  const relativeTarget = String(payload.url || "admin/").replace(/^\/+/, "");
  const targetUrl = /^https?:\/\//.test(relativeTarget)
    ? relativeTarget
    : new URL(`${APP_BASE}/${relativeTarget}`, self.location.origin).href;

  event.waitUntil(self.registration.showNotification(payload.title || "JE TIKI", {
    body: payload.body || "Новый заказ на сайте.",
    icon: `${APP_BASE}/icon-192.png`,
    badge: `${APP_BASE}/badge-96.png`,
    tag: payload.tag || "je-tiki-order",
    renotify: true,
    data: { url: targetUrl },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || new URL(`${APP_BASE}/admin/`, self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("navigate" in client) await client.navigate(targetUrl);
      if ("focus" in client) return client.focus();
    }
    return self.clients.openWindow(targetUrl);
  })());
});
