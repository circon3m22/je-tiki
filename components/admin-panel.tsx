"use client";
/* eslint-disable @next/next/no-img-element -- Admin thumbnails can use arbitrary saved external URLs. */

import { FormEvent, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { assetPath } from "@/lib/asset-path";
import { availableProductSlug, productHref } from "@/lib/product-link";
import { siteContentDefaults, siteContentFields, storefrontStorageKey, type SiteContentKey } from "@/lib/site-content";
import { AdminPushSettings } from "@/components/admin-push-settings";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useModalFocus } from "@/lib/use-modal-focus";

type Section = "dashboard" | "orders" | "products" | "categories" | "collections" | "content" | "documents";
type CategoryRow = { id: string; slug: string; name: string; sort_order: number; published: boolean };
type ProductRow = {
  id: string; slug: string; name: string; subtitle: string; description: string; price: number;
  old_price: number | null; orderable: boolean; status: "draft" | "published" | "archived";
  featured: boolean; stock_quantity: number; category_id: string | null; collection_id: string; material: string;
  wood_type: string; metal: string; dimensions: string; care: string; updated_at: string;
};
type OrderItem = { id: string; product_name: string; product_subtitle: string; unit_price: number; quantity: number; line_total: number };
type OrderRow = {
  id: string; order_number: string; customer_name: string; customer_phone: string; customer_email: string | null;
  total: number; shipping_method: string; shipping_city: string | null; shipping_address: string | null;
  status: string; payment_status: string; shipping_status: string; tracking_number: string | null;
  tracking_url: string | null; comment: string | null; created_at: string; order_items: OrderItem[];
};
type CollectionRow = { id: string; slug: string; name: string; description: string; hero_image_url: string | null; sort_order: number; published: boolean };
type ContentRow = { key: SiteContentKey; content: Record<string, unknown>; published: boolean; updated_at?: string };
type DocumentRow = { slug: string; title: string; body: string; published: boolean; updated_at?: string };
type ImageRow = { id: string; product_id: string; storage_path: string | null; external_url: string | null; alt_text: string; sort_order: number };

const nav: Array<{ label: string; items: Array<{ id: Section; label: string }> }> = [
  { label: "Магазин", items: [{ id: "dashboard", label: "Обзор" }, { id: "orders", label: "Заказы" }] },
  { label: "Каталог", items: [{ id: "products", label: "Товары" }, { id: "collections", label: "Коллекции" }, { id: "categories", label: "Категории" }] },
  { label: "Витрина", items: [{ id: "content", label: "Блоки сайта" }, { id: "documents", label: "Документы" }] },
];

const contentBlockTitles: Record<SiteContentKey, string> = {
  hero: "Первый экран",
  home_intro: "Вступление о бренде",
  about: "О мастерской",
  contacts: "Контакты в подвале",
};
const contentFieldLabels: Record<string, string> = {
  eyebrow: "Надпись над заголовком", title: "Заголовок", intro: "Вводный текст", cta: "Текст кнопки",
  paragraph1: "Первый абзац", paragraph2: "Второй абзац", phone: "Телефон", footer_text: "Подпись в подвале",
};

const productColumns = "id,slug,name,subtitle,description,price,old_price,orderable,status,featured,stock_quantity,category_id,collection_id,material,wood_type,metal,dimensions,care,updated_at";
const emptyProduct: ProductRow = {
  id: "", slug: "", name: "", subtitle: "", description: "", price: 0, old_price: null,
  orderable: true, status: "draft", featured: false, stock_quantity: 0, category_id: null,
  collection_id: "", material: "", wood_type: "", metal: "", dimensions: "", care: "", updated_at: "",
};

const money = (value: number) => new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value);
const dateTime = (value: string) => new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const orderStatusOptions = [
  { value: "new", label: "Новый — ждёт оформления" },
  { value: "awaiting_payment", label: "Ожидает оплаты" },
  { value: "paid", label: "Оплачен — ждёт оформления" },
  { value: "forming", label: "Оформляется" },
  { value: "pickup_point_contact", label: "Согласование выдачи" },
  { value: "ready_to_ship", label: "Готов к выдаче или отправке" },
  { value: "shipped", label: "Доставляется" },
  { value: "completed", label: "Выполнен" },
  { value: "cancelled", label: "Отменён" },
  { value: "refunded", label: "Возврат оформлен" },
];
const paymentStatusOptions = [
  { value: "pending", label: "Ожидает оплаты" }, { value: "paid", label: "Оплачен" },
  { value: "failed", label: "Ошибка оплаты" }, { value: "cancelled", label: "Оплата отменена" },
  { value: "refunded", label: "Деньги возвращены" },
];
const shippingStatusOptions = [
  { value: "not_shipped", label: "Не отправлен" }, { value: "preparing", label: "Готовится к отправке" },
  { value: "shipped", label: "В пути" }, { value: "delivered", label: "Доставлен" },
  { value: "returned", label: "Возвращён" },
];

export function AdminPanel() {
  const supabase = getSupabaseBrowserClient();
  const [authState, setAuthState] = useState<"loading" | "login" | "ready">("loading");
  const [section, setSection] = useState<Section>("dashboard");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [content, setContent] = useState<ContentRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productCollectionFilter, setProductCollectionFilter] = useState("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const productEditorRef = useRef<HTMLDivElement>(null);
  const closeProductEditor = useCallback(() => {
    if (!busy) setSelectedProduct(null);
  }, [busy]);
  const hasSelectedProduct = selectedProduct !== null;

  useModalFocus({ active: mobileEditorOpen, containerRef: productEditorRef, onClose: closeProductEditor });

  const loadData = useCallback(async () => {
    if (!supabase) return;
    const [p, o, c, co, sc, d, im] = await Promise.all([
      supabase.from("products").select(productColumns).order("updated_at", { ascending: false }),
      supabase.from("orders").select("*,order_items(id,product_name,product_subtitle,unit_price,quantity,line_total)").order("created_at", { ascending: false }),
      supabase.from("categories").select("id,slug,name,sort_order,published").order("sort_order"),
      supabase.from("collections").select("id,slug,name,description,hero_image_url,sort_order,published").order("sort_order"),
      supabase.from("site_content").select("key,content,published,updated_at").order("key"),
      supabase.from("legal_documents").select("slug,title,body,published,updated_at").order("slug"),
      supabase.from("product_images").select("id,product_id,storage_path,external_url,alt_text,sort_order").order("sort_order"),
    ]);
    const firstError = [p, o, c, co, sc, d, im].find((result) => result.error)?.error;
    if (firstError) throw firstError;
    setProducts((p.data ?? []) as ProductRow[]); setOrders((o.data ?? []) as OrderRow[]);
    setCategories((c.data ?? []) as CategoryRow[]); setCollections((co.data ?? []) as CollectionRow[]);
    setContent((sc.data ?? []) as ContentRow[]); setDocuments((d.data ?? []) as DocumentRow[]);
    setImages((im.data ?? []) as ImageRow[]);
  }, [supabase]);

  const verifyAdmin = useCallback(async () => {
    if (!supabase) { setError("Не настроено подключение к Supabase."); setAuthState("login"); return; }
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError?.name === "AuthSessionMissingError") { setAuthState("login"); return; }
      if (userError) throw userError;
      if (!user || user.is_anonymous) { setAuthState("login"); return; }
      const { data: profile, error: profileError } = await supabase.from("admin_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) { await supabase.auth.signOut(); setError("Для этой учётной записи нет доступа к панели."); setAuthState("login"); return; }
      await loadData();
      setAuthState("ready");
    } catch {
      setError("Не удалось загрузить данные магазина.");
      setAuthState("login");
    }
  }, [loadData, supabase]);

  useEffect(() => { void verifyAdmin(); }, [verifyAdmin]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 48rem)");
    const sync = () => setMobileEditorOpen(section === "products" && hasSelectedProduct && query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [hasSelectedProduct, section]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase) return;
    setBusy(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      const login = String(form.get("login")).trim();
      const password = String(form.get("password"));
      if (login.includes("@")) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: login, password });
        if (signInError) { setError("Не удалось войти. Проверьте логин и пароль."); return; }
      } else {
        const { data, error: signInError } = await supabase.functions.invoke("admin-login", { body: { login, password } });
        if (signInError || !data?.access_token || !data?.refresh_token) {
          setError("Не удалось войти. Проверьте логин и пароль."); return;
        }
        const { error: sessionError } = await supabase.auth.setSession(data);
        if (sessionError) { setError("Не удалось сохранить вход. Попробуйте ещё раз."); return; }
      }
      await verifyAdmin();
    } catch {
      setError("Не удалось подключиться. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => PromiseLike<{ error: { message: string } | null }>, success: string, updatesStorefront = false) {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await action();
      if (result.error) {
        setError(`Ошибка: ${result.error.message}`);
        return;
      }

      setMessage(success);
      if (updatesStorefront) {
        try { window.localStorage.setItem(storefrontStorageKey, crypto.randomUUID()); } catch {
          // Public pages also refresh when their tab regains focus.
        }
      }
      try { await loadData(); } catch {
        setError(`${success} Не удалось обновить данные панели.`);
      }
    } catch {
      setError("Не удалось выполнить действие. Проверьте подключение и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProduct(product: ProductRow) {
    if (!supabase || busy) return;
    const client = supabase;
    setMessage(""); setError("");
    const name = product.name.trim();
    if (!name || !product.collection_id) {
      setError("Укажите название и выберите коллекцию.");
      return;
    }

    const { id, updated_at, old_price, price } = product;
    const payload = {
      name, price, old_price: old_price !== null && old_price >= price ? old_price : null,
      category_id: product.category_id, collection_id: product.collection_id,
      status: product.status, orderable: product.orderable, featured: product.featured,
      stock_quantity: product.stock_quantity, description: product.description, subtitle: product.subtitle,
      material: product.material, wood_type: product.wood_type, metal: product.metal,
      dimensions: product.dimensions, care: product.care,
    };

    await run(async () => {
      const save = async () => {
        if (id) {
          return client.from("products").update(payload).eq("id", id).eq("updated_at", updated_at)
            .select(productColumns).maybeSingle();
        }

        const taken = new Set(products.map((item) => item.slug));
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = availableProductSlug(name, taken);
          const result = await client.from("products").insert({ ...payload, slug: candidate }).select(productColumns).single();
          if (result.error?.code !== "23505") return result;
          taken.add(candidate);
        }
        return { data: null, error: { message: "Не удалось создать уникальную ссылку. Обновите список товаров и повторите сохранение." } };
      };

      const { data, error: saveError } = await save();
      if (saveError) return { error: saveError };
      if (!data) return { error: { message: "Товар изменился после открытия карточки. Обновите список и откройте его снова." } };
      setSelectedProduct(data as ProductRow);
      return { error: null };
    }, id ? "Товар сохранён." : "Товар создан. Теперь можно добавить фотографии.", true);
  }

  async function saveContent(value: ContentRow) {
    if (!supabase || busy) return;
    const client = supabase;
    await run(async () => {
      const { error: saveError } = await client.from("site_content")
        .upsert({ key: value.key, published: value.published, content: value.content }, { onConflict: "key" })
        .select("key").single();
      return { error: saveError };
    }, value.published ? "Блок сохранён и показывается на сайте." : "Блок сохранён и скрыт на сайте.", true);
  }

  async function replaceProductImage(image: ImageRow, file: File) {
    if (!supabase || busy) return;
    await run(async () => {
      const optimized = await optimizeImage(file);
      const safeName = optimized.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      const path = `${image.product_id}/${crypto.randomUUID()}-${safeName}`;
      const upload = await supabase.storage.from("product-media").upload(path, optimized, {
        contentType: optimized.type,
        cacheControl: "31536000",
        upsert: false,
      });
      if (upload.error) return upload;

      const update = supabase.from("product_images")
        .update({ storage_path: path, external_url: null })
        .eq("id", image.id);
      const withStoragePath = image.storage_path === null
        ? update.is("storage_path", null)
        : update.eq("storage_path", image.storage_path);
      const { data, error: updateError } = await (image.external_url === null
        ? withStoragePath.is("external_url", null)
        : withStoragePath.eq("external_url", image.external_url)).select("id").maybeSingle();
      if (updateError) return { error: updateError };
      if (!data) {
        return { error: { message: "Фото уже изменилось или было удалено. Обновите данные и попробуйте снова." } };
      }
      return { error: null };
    }, "Фотография заменена.");
  }

  async function refreshData() {
    setBusy(true); setError(""); setMessage("");
    try {
      await loadData();
      setMessage("Данные обновлены.");
    } catch {
      setError("Не удалось обновить данные. Проверьте подключение и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  const stats = useMemo(() => ({
    newOrders: orders.filter((order) => ["new", "awaiting_payment", "paid"].includes(order.status)).length,
    revenue: orders.filter((order) => order.payment_status === "paid").reduce((sum, order) => sum + order.total, 0),
    published: products.filter((product) => product.status === "published").length,
    lowStock: products.filter((product) => product.stock_quantity <= 2).length,
  }), [orders, products]);
  const filteredProducts = useMemo(() => [...products]
    .filter((product) => product.name.toLocaleLowerCase("ru").includes(productSearch.trim().toLocaleLowerCase("ru")))
    .filter((product) => productCollectionFilter === "all" || product.collection_id === productCollectionFilter)
    .filter((product) => productCategoryFilter === "all" || product.category_id === productCategoryFilter)
    .sort((left, right) => {
      const leftCollection = collections.find((item) => item.id === left.collection_id);
      const rightCollection = collections.find((item) => item.id === right.collection_id);
      const collectionOrder = (leftCollection?.sort_order ?? 0) - (rightCollection?.sort_order ?? 0);
      if (collectionOrder) return collectionOrder;
      const leftCategory = categories.find((item) => item.id === left.category_id)?.name ?? "";
      const rightCategory = categories.find((item) => item.id === right.category_id)?.name ?? "";
      return leftCategory.localeCompare(rightCategory, "ru") || left.name.localeCompare(right.name, "ru");
    }), [categories, collections, productCategoryFilter, productCollectionFilter, productSearch, products]);

  function openProduct(product: ProductRow) {
    setError("");
    setMessage("");
    setSelectedProduct(product);
  }

  if (authState === "loading") return <main id="main-content" className="admin-loading"><p>Загружаем панель управления…</p></main>;
  if (authState === "login") return (
    <main id="main-content" className="admin-login section-shell">
      <h1>Вход в панель JE TIKI</h1>
      <form onSubmit={signIn}>
        <label>Логин<input required name="login" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} /></label>
        <label>Пароль<input required name="password" type="password" autoComplete="current-password" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={busy} type="submit">{busy ? "Входим…" : "Войти"}</button>
      </form>
    </main>
  );

  return (
    <main id="main-content" className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span>JE TIKI</span><h1>Управление магазином</h1></div>
        <nav aria-label="Разделы панели">{nav.map((group) => <div className="admin-nav-group" key={group.label}>
          <p>{group.label}</p>
          <div className="admin-nav-items">{group.items.map((item) => <button key={item.id}
            aria-current={section === item.id ? "page" : undefined} disabled={busy} onClick={() => {
              setSection(item.id); setError(""); setMessage("");
            }}>{item.label}</button>)}</div>
        </div>)}</nav>
        <div className="admin-sidebar-actions">
          <Link href="/" target="_blank" rel="noopener noreferrer">Открыть сайт</Link>
          <button className="admin-signout" onClick={async () => { await supabase?.auth.signOut(); setAuthState("login"); }}>Выйти</button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-toolbar"><h2>{nav.flatMap((group) => group.items).find((item) => item.id === section)?.label}</h2><button className="secondary-button" disabled={busy} onClick={() => void refreshData()}>Обновить</button></header>
        {!mobileEditorOpen && (message || error) && <div className={error ? "admin-alert error" : "admin-alert"} role={error ? "alert" : "status"}>{error || message}</div>}

        {section === "dashboard" && <section className="admin-section">
          <AdminPushSettings />
          <div className="admin-stats">
            <article><span>Активные заказы</span><strong>{stats.newOrders}</strong></article>
            <article><span>Оплачено</span><strong>{money(stats.revenue)}</strong></article>
            <article><span>Опубликовано</span><strong>{stats.published}</strong></article>
            <article><span>Остаток ≤ 2</span><strong>{stats.lowStock}</strong></article>
          </div>
          <div className="admin-section-heading"><h3>Последние заказы</h3><button className="text-button" onClick={() => setSection("orders")}>Все заказы</button></div>
          <OrderList orders={orders.slice(0, 5)} onSave={async (order) => run(() => supabase!.from("orders").update({ status: order.status, payment_status: order.payment_status, shipping_status: order.shipping_status, tracking_number: order.tracking_number, tracking_url: order.tracking_url }).eq("id", order.id), "Заказ обновлён.")} busy={busy} />
        </section>}

        {section === "orders" && <section className="admin-section">
          <OrderList orders={orders} onSave={async (order) => run(() => supabase!.from("orders").update({ status: order.status, payment_status: order.payment_status, shipping_status: order.shipping_status, tracking_number: order.tracking_number, tracking_url: order.tracking_url }).eq("id", order.id), "Заказ обновлён.")} busy={busy} />
        </section>}

        {section === "products" && <section className="admin-section admin-split">
          <div className="admin-list">
            <button className="admin-add" disabled={busy} onClick={() => openProduct(emptyProduct)}>+ Добавить товар</button>
            <div className="admin-product-filters">
              <label>Поиск по названию<input type="search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Например, браслет" /></label>
              <label>Коллекция<select value={productCollectionFilter} onChange={(event) => setProductCollectionFilter(event.target.value)}><option value="all">Все коллекции</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></label>
              <label>Вид товара<select value={productCategoryFilter} onChange={(event) => setProductCategoryFilter(event.target.value)}><option value="all">Все виды</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            </div>
            <p className="admin-product-count">Показано: {filteredProducts.length}</p>
            {!filteredProducts.length && <p className="admin-empty">Товары не найдены.</p>}
            {filteredProducts.map((product) => {
              const cover = images.find((image) => image.product_id === product.id);
              const src = cover?.external_url || (cover?.storage_path ? supabase?.storage.from("product-media").getPublicUrl(cover.storage_path).data.publicUrl : "");
              const visible = product.status === "published";
              return <button key={product.id} aria-pressed={selectedProduct?.id === product.id} disabled={busy}
                className={`admin-product-row${selectedProduct?.id === product.id ? " active" : ""}`} onClick={() => openProduct(product)}>
                {src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <span className="admin-product-placeholder" aria-hidden="true">—</span>}
                <span>
                  <strong>{product.name}</strong>
                  <small>{money(product.price)} · {product.stock_quantity} шт.</small>
                  <span className={`admin-visibility${visible ? " visible" : ""}`}>{visible ? "На сайте" : "Скрыт"}</span>
                </span>
              </button>;
            })}
          </div>
          <ProductEditor key={selectedProduct?.id ?? "empty"} editorRef={productEditorRef} value={selectedProduct}
            categories={categories} collections={collections} images={images.filter((image) => image.product_id === selectedProduct?.id)}
            busy={busy} mobile={mobileEditorOpen} message={message} error={error} takenSlugs={new Set(products.map((item) => item.slug))}
            onChange={setSelectedProduct} onClose={closeProductEditor} onSave={saveProduct} onUpload={async (files, productId) => {
            if (!supabase || !productId) return setError("Сначала сохраните новый товар, затем добавьте фотографии.");
            const currentCount = images.filter((image) => image.product_id === productId).length;
            if (currentCount + files.length > 10) return setError(`Можно добавить ещё не более ${10 - currentCount} фото.`);
            setBusy(true); setError("");
            for (const [index, file] of files.entries()) {
              const optimized = await optimizeImage(file);
              const safeName = optimized.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
              const path = `${productId}/${Date.now()}-${index}-${safeName}`;
              const upload = await supabase.storage.from("product-media").upload(path, optimized, { contentType: optimized.type, cacheControl: "31536000", upsert: false });
              if (upload.error) { setError(upload.error.message); setBusy(false); return; }
              const insert = await supabase.from("product_images").insert({ product_id: productId, storage_path: path, alt_text: file.name.replace(/\.[^.]+$/, ""), sort_order: currentCount + index });
              if (insert.error) { setError(insert.error.message); setBusy(false); return; }
            }
            setMessage("Фотографии добавлены к товару."); await loadData(); setBusy(false);
          }} onReplaceImage={replaceProductImage} onUpdateImage={async (image, patch) => run(() => supabase!.from("product_images").update(patch).eq("id", image.id), "Галерея обновлена.")} onDeleteImage={async (image) => run(async () => { if (image.storage_path) await supabase!.storage.from("product-media").remove([image.storage_path]); return supabase!.from("product_images").delete().eq("id", image.id); }, "Фотография удалена.")} />
        </section>}

        {section === "categories" && <section className="admin-section"><div className="admin-rows">
          {categories.map((category) => <CategoryEditor key={category.id} value={category} busy={busy} onSave={(value) => run(() => supabase!.from("categories").update(value).eq("id", value.id), "Категория сохранена.")} />)}
          <CategoryEditor value={{ id: "", slug: "new-category", name: "Новая категория", sort_order: categories.length * 10 + 10, published: false }} busy={busy} onSave={(value) => run(() => supabase!.from("categories").insert({ slug: value.slug, name: value.name, sort_order: value.sort_order, published: value.published }), "Категория создана.")} />
        </div></section>}

        {section === "collections" && <section className="admin-section"><p className="admin-help">Каждому товару нужна коллекция. Её можно изменить в карточке товара.</p><div className="admin-rows">
          {[...collections, { id: "", slug: "new-collection", name: "Новая коллекция", description: "", hero_image_url: null, sort_order: collections.length * 10 + 10, published: false }].map((collection, index) => <CollectionEditor key={collection.id || `new-${index}`} value={collection} products={products} busy={busy} onSave={async (value) => {
            const payload = { slug: value.slug, name: value.name, description: value.description, hero_image_url: value.hero_image_url || null, sort_order: value.sort_order, published: value.published };
            if (value.id) await run(() => supabase!.from("collections").update(payload).eq("id", value.id), "Коллекция сохранена.");
            else { const result = await supabase!.from("collections").insert(payload); if (result.error) setError(result.error.message); else { setMessage("Коллекция создана. Теперь можно назначать ей товары."); await loadData(); } }
          }} onUploadHero={async (file, collectionId) => {
            if (!supabase || !collectionId) { setError("Сначала сохраните новую коллекцию."); return; }
            setBusy(true); setError("");
            const optimized = await optimizeImage(file); const safeName = optimized.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-"); const path = `collections/${collectionId}/${Date.now()}-${safeName}`;
            const upload = await supabase.storage.from("product-media").upload(path, optimized, { contentType: optimized.type, cacheControl: "31536000" });
            if (upload.error) { setError(upload.error.message); setBusy(false); return; }
            const publicUrl = supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
            const update = await supabase.from("collections").update({ hero_image_url: publicUrl }).eq("id", collectionId);
            if (update.error) setError(update.error.message); else { setMessage("Обложка коллекции обновлена."); await loadData(); }
            setBusy(false);
          }} />)}
        </div></section>}

        {section === "content" && <section className="admin-section"><div className="admin-rows">
          {(Object.keys(siteContentDefaults) as SiteContentKey[]).map((key) => {
            const block = content.find((item) => item.key === key);
            return <ContentEditor key={`${key}:${block?.updated_at ?? ""}`}
              contentKey={key} value={block} busy={busy} onSave={saveContent} />;
          })}
        </div></section>}

        {section === "documents" && <section className="admin-section"><div className="admin-rows">{documents.map((document) => <DocumentEditor key={document.slug} value={document} busy={busy} onSave={(value) => run(() => supabase!.from("legal_documents").update({ title: value.title, body: value.body, published: value.published }).eq("slug", value.slug), "Документ сохранён.")} />)}</div></section>}

      </div>
    </main>
  );
}

function OrderList({ orders, onSave, busy }: { orders: OrderRow[]; onSave: (order: OrderRow) => Promise<void>; busy: boolean }) {
  if (!orders.length) return <p className="admin-empty">Заказов пока нет.</p>;
  return <div className="order-list">{orders.map((initial) => <OrderEditor key={initial.id} value={initial} onSave={onSave} busy={busy} />)}</div>;
}
function OrderEditor({ value, onSave, busy }: { value: OrderRow; onSave: (order: OrderRow) => Promise<void>; busy: boolean }) {
  const [order, setOrder] = useState(value); useEffect(() => setOrder(value), [value]);
  return <details className="order-card"><summary><div><strong>{order.order_number}</strong><span>{dateTime(order.created_at)} · {order.customer_name}</span></div><b>{money(order.total)}</b><OrderStatusBadge status={order.status} /></summary><div className="order-body">
    <div className="order-customer"><p><b>{order.customer_name}</b></p><a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>{order.customer_email && <a href={`mailto:${order.customer_email}`}>{order.customer_email}</a>}<p>{order.shipping_method} · {[order.shipping_city, order.shipping_address].filter(Boolean).join(", ")}</p>{order.comment && <p>Комментарий: {order.comment}</p>}</div>
    <div>{order.order_items?.map((item) => <p key={item.id}>{item.product_name} × {item.quantity} — {money(item.line_total)}</p>)}</div>
    <div className="admin-form-grid"><LabeledSelect label="Этап заказа" value={order.status} options={orderStatusOptions} onChange={(status) => setOrder({ ...order, status })} /><LabeledSelect label="Оплата" value={order.payment_status} options={paymentStatusOptions} onChange={(payment_status) => setOrder({ ...order, payment_status })} /><LabeledSelect label="Доставка" value={order.shipping_status} options={shippingStatusOptions} onChange={(shipping_status) => setOrder({ ...order, shipping_status })} /><Field label="Трек-номер" value={order.tracking_number ?? ""} onChange={(tracking_number) => setOrder({ ...order, tracking_number })} /><Field label="Ссылка отслеживания" value={order.tracking_url ?? ""} onChange={(tracking_url) => setOrder({ ...order, tracking_url })} /></div>
    <button className="primary-button" disabled={busy} onClick={() => void onSave(order)}>Сохранить заказ</button>
  </div></details>;
}

function ProductEditor({
  editorRef, value, categories, collections, images, busy, mobile, message, error, takenSlugs,
  onChange, onClose, onSave, onUpload, onReplaceImage, onUpdateImage, onDeleteImage,
}: {
  editorRef: RefObject<HTMLDivElement | null>;
  value: ProductRow | null;
  categories: CategoryRow[];
  collections: CollectionRow[];
  images: ImageRow[];
  busy: boolean;
  mobile: boolean;
  message: string;
  error: string;
  takenSlugs: Set<string>;
  onChange: (value: ProductRow) => void;
  onClose: () => void;
  onSave: (value: ProductRow) => Promise<void>;
  onUpload: (files: File[], productId: string) => Promise<void>;
  onReplaceImage: (image: ImageRow, file: File) => Promise<void>;
  onUpdateImage: (image: ImageRow, patch: Partial<ImageRow>) => Promise<void>;
  onDeleteImage: (image: ImageRow) => Promise<void>;
}) {
  if (!value) return <div className="admin-editor admin-product-editor admin-empty">Выберите товар или добавьте новый.</div>;
  const product = value;
  const set = <K extends keyof ProductRow>(key: K, next: ProductRow[K]) => onChange({ ...product, [key]: next });
  const visible = product.status === "published";
  const address = product.slug ? assetPath(productHref(product.slug)) : "";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void onSave({ ...product, price: Number(form.get("price")), stock_quantity: Number(form.get("stock")) });
  }

  return <div ref={editorRef} tabIndex={-1} className="admin-editor admin-product-editor"
    role={mobile ? "dialog" : undefined} aria-modal={mobile || undefined} aria-labelledby="admin-product-title">
    <header className="admin-product-editor-header">
      <button data-modal-initial-focus type="button" className="admin-product-editor-back" disabled={busy} onClick={onClose}
        aria-label="Вернуться к списку товаров">←</button>
      <h3 id="admin-product-title">{product.id ? "Карточка товара" : "Новый товар"}</h3>
    </header>

    {mobile && (message || error) && <div className={error ? "admin-alert error" : "admin-alert"}
      role={error ? "alert" : "status"}>{error || message}</div>}

    <form id="admin-product-form" onSubmit={submit}>
      <fieldset disabled={busy} className="admin-product-fields">
        <section className="admin-product-group" aria-labelledby="admin-product-main">
          <h4 id="admin-product-main">Основное</h4>
          <label>Название<input required value={product.name} placeholder="Название украшения" onChange={(event) => set("name", event.target.value)} /></label>
          <div className="admin-form-grid">
            <label>Коллекция
              <select required value={product.collection_id} onChange={(event) => set("collection_id", event.target.value)}>
                <option value="" disabled>Выберите коллекцию</option>
                {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
              </select>
            </label>
            <label>Вид товара
              <select value={product.category_id ?? ""} onChange={(event) => set("category_id", event.target.value || null)}>
                <option value="">Без категории</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          </div>
          <TextArea label="Описание" rows={3} value={product.description ?? ""} onChange={(next) => set("description", next)} />
        </section>

        <section className="admin-product-group" aria-labelledby="admin-product-inventory">
          <h4 id="admin-product-inventory">Цена и наличие</h4>
          <div className="admin-form-grid">
            <label>Цена, ₽<input name="price" type="number" inputMode="numeric" min={0} max={2147483647} step={1}
              required defaultValue={product.id ? product.price : ""} placeholder="Например, 2500" /></label>
            <label>В наличии, шт.<input name="stock" type="number" inputMode="numeric" min={0} max={2147483647} step={1}
              required defaultValue={product.stock_quantity} aria-describedby="admin-stock-hint" /></label>
          </div>
          <p className="admin-field-hint" id="admin-stock-hint">При остатке 0 товар доступен под заказ, если заказы включены.</p>
          <Switch label="Принимать заказы" checked={product.orderable} onChange={(next) => set("orderable", next)} />
        </section>

        <section className="admin-product-group" aria-labelledby="admin-product-visibility">
          <h4 id="admin-product-visibility">На сайте</h4>
          <Switch label="Показывать на сайте" checked={visible}
            onChange={(next) => set("status", next ? "published" : "draft")} />
          {address ? <p className="admin-field-hint">Ссылка на товар {product.status === "published"
            ? <a href={address} target="_blank" rel="noopener noreferrer">{address}</a>
            : <span>{address}</span>}</p>
            : <p className="admin-field-hint">{product.name.trim()
              ? `Адрес создастся при сохранении: ${assetPath(productHref(availableProductSlug(product.name, takenSlugs)))}`
              : "Адрес создастся автоматически из названия."}</p>}
        </section>

        <details className="admin-product-details">
          <summary>Характеристики и размещение</summary>
          <div className="admin-form-grid">
            <Field label="Подзаголовок" value={product.subtitle ?? ""} onChange={(next) => set("subtitle", next)} />
            <Field label="Материал" value={product.material ?? ""} onChange={(next) => set("material", next)} />
            <Field label="Порода дерева" value={product.wood_type ?? ""} onChange={(next) => set("wood_type", next)} />
            <Field label="Металл" value={product.metal ?? ""} onChange={(next) => set("metal", next)} />
            <Field label="Размеры" value={product.dimensions ?? ""} onChange={(next) => set("dimensions", next)} />
          </div>
          <TextArea label="Уход" rows={3} value={product.care ?? ""} onChange={(next) => set("care", next)} />
          <Switch label="Добавить в подборку на главной" checked={product.featured} onChange={(next) => set("featured", next)} />
        </details>
      </fieldset>
    </form>

    <ProductGallery product={product} images={images} busy={busy} onUpload={onUpload} onReplace={onReplaceImage}
      onUpdate={onUpdateImage} onDelete={onDeleteImage} />
    <div className="admin-product-editor-savebar">
      <button className="primary-button" type="submit" form="admin-product-form" disabled={busy}>
        {product.id ? "Сохранить товар" : "Создать товар"}
      </button>
    </div>
  </div>;
}

function Switch({ label, checked, onChange, disabled }: {
  label: string; checked: boolean; onChange: (next: boolean) => void; disabled?: boolean;
}) {
  return <label className="admin-switch">
    <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    {label}
  </label>;
}

function CategoryEditor({ value, onSave, busy }: { value: CategoryRow; onSave: (value: CategoryRow) => Promise<void>; busy: boolean }) { const [row, setRow] = useState(value); useEffect(() => setRow(value), [value]); return <article className="admin-inline-editor"><div className="admin-form-grid"><Field label="Название" value={row.name} onChange={(name) => setRow({ ...row, name })} /><Field label="Slug" value={row.slug} onChange={(slug) => setRow({ ...row, slug })} /><Field label="Порядок" type="number" value={String(row.sort_order)} onChange={(v) => setRow({ ...row, sort_order: Number(v) || 0 })} /></div><label className="check"><input type="checkbox" checked={row.published} onChange={(e) => setRow({ ...row, published: e.target.checked })} /> Опубликована</label><button className="secondary-button" disabled={busy} onClick={() => void onSave(row)}>Сохранить</button></article>; }
function CollectionEditor({ value, products, onSave, onUploadHero, busy }: { value: CollectionRow; products: ProductRow[]; onSave: (value: CollectionRow) => Promise<void>; onUploadHero: (file: File, collectionId: string) => Promise<void>; busy: boolean }) { const [row, setRow] = useState(value); useEffect(() => setRow(value), [value]); const assigned = products.filter((product) => product.collection_id === row.id); return <article className="admin-inline-editor"><h3>{row.name}</h3>{row.hero_image_url && <img className="collection-editor-hero" src={row.hero_image_url} alt="" />}<div className="admin-form-grid"><Field label="Название" value={row.name} onChange={(name) => setRow({ ...row, name })} /><Field label="Slug" value={row.slug} onChange={(slug) => setRow({ ...row, slug })} /><Field label="Порядок" type="number" value={String(row.sort_order)} onChange={(sort_order) => setRow({ ...row, sort_order: Number(sort_order) || 0 })} /><Field label="Ссылка на широкую обложку" value={row.hero_image_url ?? ""} onChange={(hero_image_url) => setRow({ ...row, hero_image_url })} /></div><TextArea label="Описание" value={row.description ?? ""} onChange={(description) => setRow({ ...row, description })} /><label className={`secondary-button gallery-upload ${!row.id ? "disabled" : ""}`}>Загрузить широкую обложку<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!row.id || busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUploadHero(file, row.id); event.target.value = ""; }} /></label><details><summary>Товары коллекции ({assigned.length})</summary><div className="admin-product-checks">{assigned.length ? assigned.map((product) => <span key={product.id}>{product.name}</span>) : <span>Товаров пока нет.</span>}</div></details><label className="check"><input type="checkbox" checked={row.published} onChange={(e) => setRow({ ...row, published: e.target.checked })} /> Опубликована</label><button className="secondary-button" disabled={busy} onClick={() => void onSave(row)}>Сохранить коллекцию</button></article>; }
function ContentEditor({ contentKey, value, onSave, busy }: {
  contentKey: SiteContentKey; value?: ContentRow; onSave: (value: ContentRow) => Promise<void>; busy: boolean;
}) {
  const [fields, setFields] = useState<Record<string, string>>(() => siteContentFields(contentKey, value?.content));
  const [published, setPublished] = useState(value?.published ?? true);

  return <article className="admin-inline-editor">
    <h3>{contentBlockTitles[contentKey]}</h3>
    <fieldset className="admin-content-fields" disabled={busy}>
      {Object.entries(fields).map(([key, text]) => {
        const label = contentFieldLabels[key] ?? key;
        const onChange = (next: string) => setFields((current) => ({ ...current, [key]: next }));
        return ["intro", "paragraph1", "paragraph2"].includes(key)
          ? <TextArea key={key} label={label} rows={3} value={text} onChange={onChange} />
          : <Field key={key} label={label} value={text} onChange={onChange} />;
      })}
    </fieldset>
    <Switch label="Показывать блок на сайте" checked={published} onChange={setPublished} disabled={busy} />
    <button type="button" className="secondary-button" disabled={busy}
      onClick={() => void onSave({ key: contentKey, content: { ...value?.content, ...fields }, published })}>
      Сохранить блок
    </button>
  </article>;
}

function DocumentEditor({ value, onSave, busy }: { value: DocumentRow; onSave: (value: DocumentRow) => Promise<void>; busy: boolean }) { const [row, setRow] = useState(value); useEffect(() => setRow(value), [value]); return <article className="admin-inline-editor"><p className="eyebrow">/{row.slug}</p><Field label="Заголовок" value={row.title} onChange={(title) => setRow({ ...row, title })} /><TextArea label="Текст документа" rows={14} value={row.body ?? ""} onChange={(body) => setRow({ ...row, body })} /><label className="check"><input type="checkbox" checked={row.published} onChange={(e) => setRow({ ...row, published: e.target.checked })} /> Опубликован</label><button className="secondary-button" disabled={busy} onClick={() => void onSave(row)}>Сохранить документ</button></article>; }
function ProductGallery({ product, images, busy, onUpload, onReplace, onUpdate, onDelete }: { product: ProductRow; images: ImageRow[]; busy: boolean; onUpload: (files: File[], productId: string) => Promise<void>; onReplace: (image: ImageRow, file: File) => Promise<void>; onUpdate: (image: ImageRow, patch: Partial<ImageRow>) => Promise<void>; onDelete: (image: ImageRow) => Promise<void> }) {
  const replacementInput = useRef<HTMLInputElement>(null);
  const replacementImage = useRef<ImageRow | null>(null);
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/product-media/`;
  const move = async (image: ImageRow, direction: -1 | 1) => {
    const index = sorted.findIndex((item) => item.id === image.id); const target = sorted[index + direction]; if (!target) return;
    await Promise.all([onUpdate(image, { sort_order: target.sort_order }), onUpdate(target, { sort_order: image.sort_order })]);
  };
  return <section className="product-gallery-editor" aria-labelledby="product-gallery-title"><div className="product-gallery-heading"><div><h4 id="product-gallery-title">Фотографии товара</h4><p>{images.length} из 10</p></div><label className={`secondary-button gallery-upload ${!product.id || images.length >= 10 ? "disabled" : ""}`}>Добавить фото<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={!product.id || busy || images.length >= 10} onChange={(event) => { const files = Array.from(event.target.files ?? []).slice(0, 10 - images.length); if (files.length) void onUpload(files, product.id); event.target.value = ""; }} /></label></div>
    {!product.id && <p className="admin-empty">Сначала сохраните новый товар.</p>}
    {product.id && !images.length && <p className="admin-empty">Фотографий пока нет.</p>}
    <input ref={replacementInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden disabled={busy}
      onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        const image = replacementImage.current;
        event.currentTarget.value = "";
        replacementImage.current = null;
        if (file && image?.product_id === product.id) void onReplace(image, file);
      }} />
    <div className="product-gallery-grid">
      {sorted.map((image, index) => {
        const src = image.external_url || (image.storage_path ? `${publicBase}${image.storage_path}` : "");
        const title = index === 0 ? "Обложка" : index === 1 ? "При наведении" : `Фото ${index + 1}`;
        return <article key={image.id}>
          <div className="gallery-editor-preview">
            <img src={src} alt={image.alt_text || `Фото ${index + 1}`} loading="lazy" decoding="async" />
            {index < 2 && <span>{title}</span>}
          </div>
          <input aria-label={`Описание фотографии ${index + 1}`} defaultValue={image.alt_text} onBlur={(event) => {
            if (event.target.value !== image.alt_text) void onUpdate(image, { alt_text: event.target.value });
          }} />
          <div className="gallery-editor-actions">
            <button type="button" disabled={busy || index === 0} aria-label="Переместить фото раньше" onClick={() => void move(image, -1)}>←</button>
            <button type="button" disabled={busy || index === sorted.length - 1} aria-label="Переместить фото позже" onClick={() => void move(image, 1)}>→</button>
            <button type="button" disabled={busy} onClick={() => void onDelete(image)}>Удалить</button>
            <button type="button" disabled={busy} aria-label={index === 0 ? "Изменить обложку" : `Изменить фото ${index + 1}`}
              onClick={() => {
                replacementImage.current = image;
                replacementInput.current?.click();
              }}>Изменить</button>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label>{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function TextArea({ label, value, onChange, rows = 5 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) { return <label className="admin-textarea">{label}<textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function LabeledSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) { return <label>{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }

function OrderStatusBadge({ status }: { status: string }) {
  const label = orderStatusOptions.find((option) => option.value === status)?.label ?? "Статус не указан";
  const tone = ["new", "awaiting_payment", "paid"].includes(status) ? "waiting"
    : status === "forming" ? "forming"
    : ["pickup_point_contact", "ready_to_ship"].includes(status) ? "pickup"
    : status === "shipped" ? "shipping"
    : status === "completed" ? "completed" : "cancelled";
  return <span className={`order-status order-status--${tone}`} title={label}>
    <OrderStatusIcon tone={tone} /><span>{label}</span>
  </span>;
}

function OrderStatusIcon({ tone }: { tone: string }) {
  if (tone === "shipping") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg>;
  if (tone === "pickup") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8Zm4 0V6a3 3 0 0 1 6 0v2" /></svg>;
  if (tone === "completed") return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16.5 9" /></svg>;
  if (tone === "cancelled") return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></svg>;
  if (tone === "forming") return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 8 8-4 8 4-8 4-8-4Zm0 0v9l8 4 8-4V8M12 12v9" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

async function optimizeImage(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  const maxSide = 2400;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 700_000 && file.type === "image/webp") { bitmap.close(); return file; }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d", { alpha: false })?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (!blob || (scale === 1 && blob.size >= file.size)) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
}
