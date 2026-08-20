"use client";

import { useEffect, useState } from "react";
import { assetPath } from "@/lib/asset-path";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type PushState = "checking" | "unsupported" | "needs-install" | "off" | "on" | "blocked";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

async function getServiceWorker() {
  const scriptUrl = assetPath("/sw.js");
  const scope = assetPath("/");
  const existing = await navigator.serviceWorker.getRegistration(scope);
  return existing ?? navigator.serviceWorker.register(scriptUrl, { scope });
}

export function AdminPushSettings() {
  const supabase = getSupabaseBrowserClient();
  const [state, setState] = useState<PushState>("checking");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (!cancelled) setState("unsupported");
        return;
      }

      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
        || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      if (isIos && !isStandalone) {
        if (!cancelled) setState("needs-install");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("blocked");
        return;
      }

      const registration = await getServiceWorker();
      const subscription = await registration.pushManager.getSubscription();
      if (!cancelled) setState(subscription ? "on" : "off");
    }
    void check().catch(() => { if (!cancelled) setState("unsupported"); });
    return () => { cancelled = true; };
  }, []);

  async function enable() {
    if (!supabase) return;
    setBusy(true); setFeedback("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        setFeedback("Разрешение на уведомления не выдано.");
        return;
      }

      const { data: settings, error: settingsError } = await supabase.functions.invoke("admin-push", {
        body: { action: "settings" },
      });
      if (settingsError || !settings?.publicKey) throw settingsError ?? new Error("VAPID key is missing");

      const registration = await getServiceWorker();
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(settings.publicKey),
      });
      const serialized = subscription.toJSON();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys?.auth) {
        throw new Error("Push subscription is incomplete");
      }

      const { error } = await supabase.from("admin_push_subscriptions").upsert({
        admin_user_id: user.id,
        endpoint: serialized.endpoint,
        p256dh: serialized.keys.p256dh,
        auth: serialized.keys.auth,
        user_agent: navigator.userAgent,
      }, { onConflict: "endpoint" });
      if (error) throw error;
      setState("on");
      setFeedback("Уведомления о новых заказах включены на этом устройстве.");
    } catch (error) {
      console.error("Push subscription failed", error);
      setFeedback("Не удалось включить уведомления. Обновите страницу и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!supabase) return;
    setBusy(true); setFeedback("");
    try {
      const registration = await getServiceWorker();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await supabase.from("admin_push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
      setFeedback("Уведомления выключены на этом устройстве.");
    } catch (error) {
      console.error("Push unsubscribe failed", error);
      setFeedback("Не удалось выключить уведомления.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (!supabase) return;
    setBusy(true); setFeedback("");
    const { data, error } = await supabase.functions.invoke("admin-push", { body: { action: "test" } });
    if (error || !data?.sent) setFeedback("Тестовое уведомление не отправилось. Проверьте разрешение iPhone.");
    else setFeedback("Тестовое уведомление отправлено.");
    setBusy(false);
  }

  const copy = state === "checking" ? "Проверяем это устройство…"
    : state === "needs-install" ? "На iPhone сначала добавьте сайт на экран «Домой», затем откройте админку из созданной иконки."
    : state === "unsupported" ? "Этот браузер не поддерживает push-уведомления."
    : state === "blocked" ? "Уведомления запрещены в настройках устройства. Разрешите их для JE TIKI."
    : state === "on" ? "Новые заказы будут приходить на это устройство даже при закрытом сайте."
    : "Включите уведомления, чтобы сразу узнавать о новом заказе.";

  return <section className="admin-push-card" aria-labelledby="admin-push-title">
    <div className="admin-push-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></svg>
    </div>
    <div><h3 id="admin-push-title">Уведомления о заказах</h3><p>{copy}</p>{feedback && <p className="admin-push-feedback" role="status">{feedback}</p>}</div>
    <div className="admin-push-actions">
      {state === "off" && <button type="button" className="primary-button" disabled={busy} onClick={() => void enable()}>{busy ? "Включаем…" : "Включить"}</button>}
      {state === "on" && <><button type="button" className="secondary-button" disabled={busy} onClick={() => void sendTest()}>Проверить</button><button type="button" className="text-button" disabled={busy} onClick={() => void disable()}>Выключить</button></>}
    </div>
  </section>;
}
