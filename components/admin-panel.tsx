"use client";
/* eslint-disable @next/next/no-img-element -- Admin thumbnails can use arbitrary saved external URLs. */

import { FormEvent, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
type ContentRow = { key: string; content: Record<string, unknown>; published: boolean; updated_at?: string };
type DocumentRow = { slug: string; title: string; body: string; published: boolean; updated_at?: string };
type ImageRow = { id: string; product_id: string; storage_path: string | null; external_url: string | null; alt_text: string; sort_order: number };

const nav: Array<{ id: Section; label: string }> = [
  { id: "dashboard", label: "Обзор" }, { id: "orders", label: "Заказы" },
  { id: "products", label: "Товары" }, { id: "categories", label: "Категории" },
  { id: "collections", label: "Коллекции" }, { id: "content", label: "Блоки сайта" },
  { id: "documents", label: "Документы" },
];

const contentTemplates: Record<string, Record<string, unknown>> = {
  hero: { eyebrow: "JE TIKI · Хабаровск", title: "Украшения из дерева с берегов Амура", intro: "Три коллекции о природе, знаках и памяти места.", cta: "Перейти в каталог" },
  home_intro: { eyebrow: "О JE TIKI", title: "Современные предметы, в которых слышен Дальний Восток.", paragraph1: "Мы работаем с дальневосточными породами дерева.", paragraph2: "Источники форм — орнамент, природа Приамурья и простая геометрия." },
  city_wood: { eyebrow: "Материал с адресом", title: "Город продолжает жить в дереве.", text: "Часть материала JE TIKI — древесина японских вязов, которые удаляют в Хабаровске как аварийные деревья. Мы отбираем пригодные фрагменты и забираем их в мастерскую.", note: "Вместо того чтобы оказаться среди отходов, дерево получает новую форму — украшения и небольшие объекты, сделанные в том же городе, где оно росло." },
  about: { eyebrow: "Мастерская", title: "JE TIKI создаёт украшения и небольшие объекты в Хабаровске.", paragraph1: "Тёплые, тактильные вещи с локальным характером.", paragraph2: "Создаём также сувениры и небольшие серии для событий и бизнеса." },
  contacts: { phone: "89147771252", footer_text: "Украшения из дерева с берегов Амура" },
};

const contentFieldLabels: Record<string, string> = {
  eyebrow: "Надпись над заголовком", title: "Заголовок", intro: "Вводный текст", cta: "Текст кнопки",
  paragraph1: "Первый абзац", paragraph2: "Второй абзац", number: "Номер", line: "Короткая подпись",
  description: "Описание", text: "Основной текст", note: "Дополнительный текст", phone: "Телефон",
  footer_text: "Подпись в подвале",
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
  const [productCollectionFilter, setProductCollectionFilter] = useState("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const productEditorRef = useRef<HTMLDivElement>(null);
  const closeProductEditor = useCallback(() => setSelectedProduct(null), []);
  const hasSelectedProduct = selectedProduct !== null;

  useModalFocus({ active: mobileEditorOpen, containerRef: productEditorRef, onClose: closeProductEditor });

  const loadData = useCallback(async () => {
    if (!supabase) return;
    const [p, o, c, co, sc, d, im] = await Promise.all([
      supabase.from("products").select("id,slug,name,subtitle,description,price,old_price,orderable,status,featured,stock_quantity,category_id,collection_id,material,wood_type,metal,dimensions,care,updated_at").order("updated_at", { ascending: false }),
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
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
      if (signInError) { setError("Не удалось войти. Проверьте почту и пароль."); return; }
      await verifyAdmin();
    } catch {
      setError("Не удалось подключиться. Проверьте интернет и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => PromiseLike<{ error: { message: string } | null }>, success: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await action();
      if (result.error) setError(`Ошибка: ${result.error.message}`); else { setMessage(success); await loadData(); }
    } catch {
      setError("Не удалось выполнить действие. Проверьте подключение и попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
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
    }), [categories, collections, productCategoryFilter, productCollectionFilter, products]);

  if (authState === "loading") return <main id="main-content" className="admin-loading"><p>Загружаем панель управления…</p></main>;
  if (authState === "login") return (
    <main id="main-content" className="admin-login section-shell">
      <p className="eyebrow">JE TIKI / Управление</p><h1>Вход в панель</h1>
      <form onSubmit={signIn}>
        <label>Электронная почта<input required name="email" type="email" autoComplete="username" /></label>
        <label>Пароль<input required name="password" type="password" autoComplete="current-password" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={busy} type="submit">{busy ? "Входим…" : "Войти"}</button>
      </form>
    </main>
  );

  return (
    <main id="main-content" className="admin-app">
      <aside className="admin-sidebar">
        <div><p className="eyebrow">JE TIKI</p><h1>Управление</h1></div>
        <nav aria-label="Разделы панели">{nav.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => setSection(item.id)}>{item.label}</button>)}</nav>
        <button className="admin-signout" onClick={async () => { await supabase?.auth.signOut(); setAuthState("login"); }}>Выйти</button>
      </aside>
      <div className="admin-workspace">
        <header className="admin-toolbar"><div><p className="eyebrow">Панель магазина</p><h2>{nav.find((item) => item.id === section)?.label}</h2></div><button className="secondary-button" disabled={busy} onClick={() => void refreshData()}>Обновить</button></header>
        {(message || error) && <div className={error ? "admin-alert error" : "admin-alert"} role={error ? "alert" : "status"}>{error || message}</div>}

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
          <p className="admin-help">Здесь отображаются все заказы с сайта. Меняйте этап, оплату, доставку и трек-номер — данные сохраняются в Supabase.</p>
          <OrderList orders={orders} onSave={async (order) => run(() => supabase!.from("orders").update({ status: order.status, payment_status: order.payment_status, shipping_status: order.shipping_status, tracking_number: order.tracking_number, tracking_url: order.tracking_url }).eq("id", order.id), "Заказ обновлён.")} busy={busy} />
        </section>}

        {section === "products" && <section className="admin-section admin-split">
          <div className="admin-list"><button className="admin-add" onClick={() => setSelectedProduct({ id: "", slug: "new-product", name: "Новый товар", subtitle: "", description: "", price: 1000, old_price: null, orderable: true, status: "draft", featured: false, stock_quantity: 0, category_id: categories[0]?.id ?? null, collection_id: collections[0]?.id ?? "", material: "", wood_type: "", metal: "", dimensions: "", care: "", updated_at: "" })}>+ Добавить товар</button>
            <div className="admin-product-filters">
              <label>Коллекция<select value={productCollectionFilter} onChange={(event) => setProductCollectionFilter(event.target.value)}><option value="all">Все коллекции</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></label>
              <label>Вид товара<select value={productCategoryFilter} onChange={(event) => setProductCategoryFilter(event.target.value)}><option value="all">Все виды</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            </div>
            <p className="admin-product-count">Показано: {filteredProducts.length}</p>
            {filteredProducts.map((product) => { const cover = images.filter((image) => image.product_id === product.id).sort((a, b) => a.sort_order - b.sort_order)[0]; const src = cover?.external_url || (cover?.storage_path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/product-media/${cover.storage_path}` : ""); return <button key={product.id} className={`admin-product-row${selectedProduct?.id === product.id ? " active" : ""}`} onClick={() => setSelectedProduct(product)}>{src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <span className="admin-product-placeholder" aria-hidden="true">—</span>}<span><strong>{product.name}</strong><small>{collections.find((item) => item.id === product.collection_id)?.name} · {categories.find((item) => item.id === product.category_id)?.name}</small><small>{money(product.price)} · {product.status}</small></span></button>; })}
          </div>
          <ProductEditor editorRef={productEditorRef} value={selectedProduct} categories={categories} collections={collections} images={images.filter((image) => image.product_id === selectedProduct?.id)} busy={busy} onChange={setSelectedProduct} onClose={closeProductEditor} onSave={async (product) => {
            if (!product.collection_id) { setError("Выберите коллекцию товара."); return; }
            const payload = { slug: product.slug, name: product.name, subtitle: product.subtitle, description: product.description, price: product.price, old_price: product.old_price, orderable: product.orderable, status: product.status, featured: product.featured, stock_quantity: product.stock_quantity, category_id: product.category_id, collection_id: product.collection_id, material: product.material, wood_type: product.wood_type, metal: product.metal, dimensions: product.dimensions, care: product.care };
            const id = product.id;
            await run(() => id ? supabase!.from("products").update(payload).eq("id", id) : supabase!.from("products").insert(payload), id ? "Товар сохранён." : "Товар создан.");
          }} onUpload={async (files, productId) => {
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
          }} onUpdateImage={async (image, patch) => run(() => supabase!.from("product_images").update(patch).eq("id", image.id), "Галерея обновлена.")} onDeleteImage={async (image) => run(async () => { if (image.storage_path) await supabase!.storage.from("product-media").remove([image.storage_path]); return supabase!.from("product_images").delete().eq("id", image.id); }, "Фотография удалена.")} />
        </section>}

        {section === "categories" && <section className="admin-section"><p className="admin-help">Категории управляют фильтрами каталога.</p><div className="admin-rows">
          {categories.map((category) => <CategoryEditor key={category.id} value={category} busy={busy} onSave={(value) => run(() => supabase!.from("categories").update(value).eq("id", value.id), "Категория сохранена.")} />)}
          <CategoryEditor value={{ id: "", slug: "new-category", name: "Новая категория", sort_order: categories.length * 10 + 10, published: false }} busy={busy} onSave={(value) => run(() => supabase!.from("categories").insert({ slug: value.slug, name: value.name, sort_order: value.sort_order, published: value.published }), "Категория создана.")} />
        </div></section>}

        {section === "collections" && <section className="admin-section"><p className="admin-help">У каждой коллекции есть широкая обложка и собственные товары. Принадлежность товара меняется в редакторе товара — оставить товар без коллекции нельзя.</p><div className="admin-rows">
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

        {section === "content" && <section className="admin-section"><p className="admin-help">Редактируйте только видимый текст. Системные названия полей и структура блока защищены и сохраняются автоматически.</p><div className="admin-rows">
          {Object.entries(contentTemplates).map(([key, template]) => <ContentEditor key={key} contentKey={key} value={content.find((item) => item.key === key) ?? { key, content: template, published: true }} busy={busy} onSave={(value) => run(() => supabase!.from("site_content").upsert(value, { onConflict: "key" }), "Блок сайта сохранён и уже доступен витрине.")} />)}
        </div></section>}

        {section === "documents" && <section className="admin-section"><p className="admin-help">Здесь можно обновить текст документа или временно снять его с публикации. После изменения проверьте документ целиком.</p><div className="admin-rows">{documents.map((document) => <DocumentEditor key={document.slug} value={document} busy={busy} onSave={(value) => run(() => supabase!.from("legal_documents").update({ title: value.title, body: value.body, published: value.published }).eq("slug", value.slug), "Документ сохранён.")} />)}</div></section>}

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

function ProductEditor({ editorRef, value, categories, collections, images, busy, onChange, onClose, onSave, onUpload, onUpdateImage, onDeleteImage }: { editorRef: RefObject<HTMLDivElement | null>; value: ProductRow | null; categories: CategoryRow[]; collections: CollectionRow[]; images: ImageRow[]; busy: boolean; onChange: (value: ProductRow) => void; onClose: () => void; onSave: (value: ProductRow) => Promise<void>; onUpload: (files: File[], productId: string) => Promise<void>; onUpdateImage: (image: ImageRow, patch: Partial<ImageRow>) => Promise<void>; onDeleteImage: (image: ImageRow) => Promise<void> }) {
  if (!value) return <div className="admin-editor admin-product-editor admin-empty">Выберите товар слева.</div>;
  const set = <K extends keyof ProductRow>(key: K, next: ProductRow[K]) => onChange({ ...value, [key]: next });
  return <div ref={editorRef} tabIndex={-1} className="admin-editor admin-product-editor"><header className="admin-product-editor-header"><button data-modal-initial-focus type="button" className="admin-product-editor-back" onClick={onClose} aria-label="Вернуться к списку товаров">←</button><div><p>Редактор товара</p><h3>{value.id ? value.name : "Новый товар"}</h3></div></header><div className="admin-form-grid">
    <Field label="Название" value={value.name} onChange={(v) => set("name", v)} /><Field label="Slug (адрес)" value={value.slug} onChange={(v) => set("slug", v)} />
    <Field label="Подзаголовок" value={value.subtitle ?? ""} onChange={(v) => set("subtitle", v)} /><label>Категория<select value={value.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Коллекция<select required value={value.collection_id} onChange={(e) => set("collection_id", e.target.value)}><option value="" disabled>Выберите коллекцию</option>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></label>
    <Field label="Цена, ₽" type="number" value={String(value.price)} onChange={(v) => set("price", Number(v) || 1000)} /><Field label="Остаток" type="number" value={String(value.stock_quantity)} onChange={(v) => set("stock_quantity", Number(v) || 0)} />
    <Select label="Публикация" value={value.status} options={["draft","published","archived"]} onChange={(v) => set("status", v as ProductRow["status"])} /><Field label="Материал" value={value.material ?? ""} onChange={(v) => set("material", v)} />
    <Field label="Порода дерева" value={value.wood_type ?? ""} onChange={(v) => set("wood_type", v)} /><Field label="Металл" value={value.metal ?? ""} onChange={(v) => set("metal", v)} /><Field label="Размеры" value={value.dimensions ?? ""} onChange={(v) => set("dimensions", v)} />
  </div><TextArea label="Описание" value={value.description ?? ""} onChange={(v) => set("description", v)} /><TextArea label="Уход" value={value.care ?? ""} onChange={(v) => set("care", v)} /><div className="admin-checks"><label><input type="checkbox" checked={value.orderable} onChange={(e) => set("orderable", e.target.checked)} /> Можно заказать</label><label><input type="checkbox" checked={value.featured} onChange={(e) => set("featured", e.target.checked)} /> На главной</label></div><ProductGallery product={value} images={images} busy={busy} onUpload={onUpload} onUpdate={onUpdateImage} onDelete={onDeleteImage} /><div className="admin-product-editor-savebar"><button className="primary-button" disabled={busy} onClick={() => void onSave(value)}>{busy ? "Сохраняем…" : "Сохранить товар"}</button></div></div>;
}

function CategoryEditor({ value, onSave, busy }: { value: CategoryRow; onSave: (value: CategoryRow) => Promise<void>; busy: boolean }) { const [row, setRow] = useState(value); useEffect(() => setRow(value), [value]); return <article className="admin-inline-editor"><div className="admin-form-grid"><Field label="Название" value={row.name} onChange={(name) => setRow({ ...row, name })} /><Field label="Slug" value={row.slug} onChange={(slug) => setRow({ ...row, slug })} /><Field label="Порядок" type="number" value={String(row.sort_order)} onChange={(v) => setRow({ ...row, sort_order: Number(v) || 0 })} /></div><label className="check"><input type="checkbox" checked={row.published} onChange={(e) => setRow({ ...row, published: e.target.checked })} /> Опубликована</label><button className="secondary-button" disabled={busy} onClick={() => void onSave(row)}>Сохранить</button></article>; }
function CollectionEditor({ value, products, onSave, onUploadHero, busy }: { value: CollectionRow; products: ProductRow[]; onSave: (value: CollectionRow) => Promise<void>; onUploadHero: (file: File, collectionId: string) => Promise<void>; busy: boolean }) { const [row, setRow] = useState(value); useEffect(() => setRow(value), [value]); const assigned = products.filter((product) => product.collection_id === row.id); return <article className="admin-inline-editor"><h3>{row.name}</h3>{row.hero_image_url && <img className="collection-editor-hero" src={row.hero_image_url} alt="" />}<div className="admin-form-grid"><Field label="Название" value={row.name} onChange={(name) => setRow({ ...row, name })} /><Field label="Slug" value={row.slug} onChange={(slug) => setRow({ ...row, slug })} /><Field label="Порядок" type="number" value={String(row.sort_order)} onChange={(sort_order) => setRow({ ...row, sort_order: Number(sort_order) || 0 })} /><Field label="Ссылка на широкую обложку" value={row.hero_image_url ?? ""} onChange={(hero_image_url) => setRow({ ...row, hero_image_url })} /></div><TextArea label="Описание" value={row.description ?? ""} onChange={(description) => setRow({ ...row, description })} /><label className={`secondary-button gallery-upload ${!row.id ? "disabled" : ""}`}>Загрузить широкую обложку<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={!row.id || busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUploadHero(file, row.id); event.target.value = ""; }} /></label><details><summary>Товары коллекции ({assigned.length})</summary><div className="admin-product-checks">{assigned.length ? assigned.map((product) => <span key={product.id}>{product.name}</span>) : <span>Товаров пока нет.</span>}</div></details><label className="check"><input type="checkbox" checked={row.published} onChange={(e) => setRow({ ...row, published: e.target.checked })} /> Опубликована</label><button className="secondary-button" disabled={busy} onClick={() => void onSave(row)}>Сохранить коллекцию</button></article>; }
function ContentEditor({ contentKey, value, onSave, busy }: { contentKey: string; value: ContentRow; onSave: (value: ContentRow) => Promise<void>; busy: boolean }) { const template = contentTemplates[contentKey] ?? {}; const editableKeys = Object.keys(template); const makeFields = () => Object.fromEntries(editableKeys.map((key) => [key, String(value.content[key] ?? template[key] ?? "")])); const [fields, setFields] = useState<Record<string, string>>(makeFields); const [published, setPublished] = useState(value.published); useEffect(() => { setFields(makeFields()); setPublished(value.published); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, contentKey]); return <article className="admin-inline-editor"><h3>{contentBlockTitle(contentKey)}</h3><div className="admin-content-fields">{editableKeys.map((key) => { const label = contentFieldLabels[key] ?? key; const fieldValue = fields[key] ?? ""; const multiline = fieldValue.length > 80 || ["intro", "description", "text", "note", "paragraph1", "paragraph2"].includes(key); return multiline ? <TextArea key={key} label={label} rows={4} value={fieldValue} onChange={(next) => setFields({ ...fields, [key]: next })} /> : <Field key={key} label={label} value={fieldValue} onChange={(next) => setFields({ ...fields, [key]: next })} />; })}</div><label className="check"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Показывать блок на сайте</label><button className="secondary-button" disabled={busy} onClick={() => void onSave({ key: contentKey, content: { ...value.content, ...fields }, published })}>Сохранить блок</button></article>; }

function contentBlockTitle(key: string) { return ({ hero: "Первый экран", home_intro: "Вступление о бренде", city_wood: "Городское дерево", about: "О мастерской", contacts: "Контакты и подвал" } as Record<string, string>)[key] ?? key; }
function DocumentEditor({ value, onSave, busy }: { value: DocumentRow; onSave: (value: DocumentRow) => Promise<void>; busy: boolean }) { const [row, setRow] = useState(value); useEffect(() => setRow(value), [value]); return <article className="admin-inline-editor"><p className="eyebrow">/{row.slug}</p><Field label="Заголовок" value={row.title} onChange={(title) => setRow({ ...row, title })} /><TextArea label="Текст документа" rows={14} value={row.body ?? ""} onChange={(body) => setRow({ ...row, body })} /><label className="check"><input type="checkbox" checked={row.published} onChange={(e) => setRow({ ...row, published: e.target.checked })} /> Опубликован</label><button className="secondary-button" disabled={busy} onClick={() => void onSave(row)}>Сохранить документ</button></article>; }
function ProductGallery({ product, images, busy, onUpload, onUpdate, onDelete }: { product: ProductRow; images: ImageRow[]; busy: boolean; onUpload: (files: File[], productId: string) => Promise<void>; onUpdate: (image: ImageRow, patch: Partial<ImageRow>) => Promise<void>; onDelete: (image: ImageRow) => Promise<void> }) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/product-media/`;
  const move = async (image: ImageRow, direction: -1 | 1) => {
    const index = sorted.findIndex((item) => item.id === image.id); const target = sorted[index + direction]; if (!target) return;
    await Promise.all([onUpdate(image, { sort_order: target.sort_order }), onUpdate(target, { sort_order: image.sort_order })]);
  };
  return <section className="product-gallery-editor" aria-labelledby="product-gallery-title"><div className="product-gallery-heading"><div><h4 id="product-gallery-title">Фотографии товара</h4><p>{images.length} из 10 · №1 — обложка, №2 — white box при наведении</p></div><label className={`secondary-button gallery-upload ${!product.id || images.length >= 10 ? "disabled" : ""}`}>Добавить фото<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={!product.id || busy || images.length >= 10} onChange={(event) => { const files = Array.from(event.target.files ?? []).slice(0, 10 - images.length); if (files.length) void onUpload(files, product.id); event.target.value = ""; }} /></label></div>
    {!product.id && <p className="admin-empty">Сначала сохраните новый товар.</p>}
    {product.id && !images.length && <p className="admin-empty">Фотографий пока нет. Можно загрузить до 10 изображений.</p>}
    <div className="product-gallery-grid">{sorted.map((image, index) => { const src = image.external_url || (image.storage_path ? `${publicBase}${image.storage_path}` : ""); return <article key={image.id}><div className="gallery-editor-preview"><img src={src} alt={image.alt_text || `Фото ${index + 1}`} loading="lazy" decoding="async" />{index < 2 && <span>{index === 0 ? "Обложка" : "При наведении"}</span>}</div><input aria-label={`Описание фотографии ${index + 1}`} defaultValue={image.alt_text} onBlur={(event) => { if (event.target.value !== image.alt_text) void onUpdate(image, { alt_text: event.target.value }); }} /><div className="gallery-editor-actions"><button type="button" disabled={busy || index === 0} aria-label="Переместить фото раньше" onClick={() => void move(image, -1)}>←</button><button type="button" disabled={busy || index === sorted.length - 1} aria-label="Переместить фото позже" onClick={() => void move(image, 1)}>→</button><button type="button" className="danger" disabled={busy} onClick={() => void onDelete(image)}>Удалить</button></div></article>; })}</div>
  </section>;
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label>{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function TextArea({ label, value, onChange, rows = 5 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) { return <label className="admin-textarea">{label}<textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></label>; }
function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label>{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
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
