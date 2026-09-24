/* ============================================================
   trtinyhands · Ürün Yönetim Paneli (admin.js)
   ------------------------------------------------------------
   Site statik olduğu için kaydedecek bir sunucu yok. Akış şudur:

     1. Burada ürünleri düzenlersiniz (taslak tarayıcıda saklanır)
     2. "products.js İndir" ile dosyayı üretirsiniz
     3. Dosyayı sitenizdeki assets/js/ klasörüne yüklersiniz

   Yüklediğiniz an değişiklikler tüm ziyaretçilerde görünür.
   ============================================================ */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const DRAFT_KEY = "yf_admin_draft";

  /* ---------------- Durum ---------------- */
  let products = [];
  let currentId = null;
  let dirty = false;
  let cropper = null;
  let pendingImage = null; // kırpıcıdan gelen son data URL

  /* ---------------- Yardımcılar ----------------
     Kart/etiket/stok mantığı store.js'ten (YF) gelir: mağaza ile
     önizlemenin birbirinden uzaklaşmaması için tek kaynak. */
  const { fmt, productMedia, badgesHTML, discountPct, stockInfo, productCard } = YF;

  function slugify(str) {
    const map = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", İ: "i" };
    return (str || "")
      .toLowerCase()
      .replace(/[çğıöşüİ]/g, (c) => map[c] || c)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 20);
  }

  /* Başlıktan çakışmayan bir kimlik üretir. */
  function newId(title) {
    const base = slugify(title) || "urun";
    let id = base;
    let n = 2;
    while (products.some((p) => p.id === id)) id = `${base}-${n++}`;
    return id;
  }

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  /* ---------------- Taslak deposu ---------------- */
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(products));
      updateStorageMeter();
    } catch (e) {
      toast("Depo doldu! Görselleri küçültün veya ürün silin.");
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      return Array.isArray(arr) && arr.length ? arr : null;
    } catch {
      return null;
    }
  }

  function updateStorageMeter() {
    const bytes = new Blob([localStorage.getItem(DRAFT_KEY) || ""]).size;
    const mb = bytes / (1024 * 1024);
    const pct = Math.min(100, Math.round((mb / 5) * 100));
    const el = $("#storageMeter");
    el.textContent = `Taslak: ${mb.toFixed(2)} MB`;
    el.classList.toggle("is-warn", pct >= 75);
  }

  function markDirty() {
    dirty = true;
    $("#dirtyBar").hidden = false;
  }

  /* ---------------- Liste ---------------- */
  function renderList() {
    const q = $("#listSearch").value.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );

    $("#listItems").innerHTML = list
      .map((p) => {
        const i = products.indexOf(p);
        const off = discountPct(p);
        return `
        <div class="ad-item ${p.id === currentId ? "is-active" : ""}" data-id="${p.id}">
          <div class="ad-item__thumb">${productMedia(p)}</div>
          <div class="ad-item__info">
            <strong>${esc(p.title)}</strong>
            <small>${esc(p.category)} · ${fmt(p.price)}${off ? ` · %${off}` : ""}</small>
            <small class="ad-item__stock ad-item__stock--${stockInfo(p).level}">${
          stockInfo(p).label
        }</small>
            <div class="ad-item__badges">${badgesHTML(p)}</div>
          </div>
          <div class="ad-item__move">
            <button type="button" data-move-up="${i}" ${i === 0 ? "disabled" : ""} aria-label="Yukarı taşı">↑</button>
            <button type="button" data-move-down="${i}" ${
          i === products.length - 1 ? "disabled" : ""
        } aria-label="Aşağı taşı">↓</button>
          </div>
        </div>`;
      })
      .join("");

    $("#listCount").textContent = `${products.length} ürün${
      q ? ` · ${list.length} eşleşme` : ""
    }`;
  }

  /* ---------------- Form ---------------- */
  function renderBadgePicker(selected) {
    $("#badgePicker").innerHTML = Object.entries(BADGES)
      .map(
        ([key, b]) => `
        <label class="ad-badge-opt">
          <input type="checkbox" value="${key}" ${
          selected.includes(key) ? "checked" : ""
        } />
          <span class="badge badge--${b.tone}">${b.label}</span>
        </label>`
      )
      .join("");
  }

  function renderCategoryList() {
    const cats = [...new Set(products.map((p) => p.category))].sort();
    $("#categoryList").innerHTML = cats
      .map((c) => `<option value="${esc(c)}"></option>`)
      .join("");
  }

  function openProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    currentId = id;

    $("#editorEmpty").hidden = true;
    $("#form").hidden = false;
    $("#preview").hidden = false;
    $("#formTitle").textContent = p.title || "Ürünü Düzenle";

    $("#f_title").value = p.title || "";
    $("#f_category").value = p.category || "";
    $("#f_desc").value = p.desc || "";
    $("#f_price").value = p.price ?? "";
    $("#f_oldPrice").value = p.oldPrice ?? "";
    $("#f_emoji").value = p.emoji || "";
    $("#f_size").value = p.size || "";
    $("#f_material").value = p.material || "";
    $("#f_layer").value = p.layer || "";
    $("#f_rating").value = p.rating ?? "";
    $("#f_reviews").value = p.reviews ?? "";
    $("#f_stock").value = p.stock ?? "";

    renderBadgePicker(p.badges || []);
    renderCategoryList();

    pendingImage = p.image || null;
    if (p.image) cropper.load(p.image);
    else cropper.clear();

    renderList();
    renderPreview();
  }

  /* Formdaki değerleri ürüne yazar. */
  function collect() {
    const p = products.find((x) => x.id === currentId);
    if (!p) return null;

    p.title = $("#f_title").value.trim();
    p.category = $("#f_category").value.trim() || "Diğer";
    p.desc = $("#f_desc").value.trim();
    p.price = Number($("#f_price").value) || 0;

    const old = $("#f_oldPrice").value.trim();
    p.oldPrice = old === "" ? null : Number(old) || null;

    p.emoji = $("#f_emoji").value.trim() || "📦";
    p.size = $("#f_size").value.trim();
    p.material = $("#f_material").value.trim();
    p.layer = $("#f_layer").value.trim();

    const rating = $("#f_rating").value.trim();
    p.rating = rating === "" ? 5 : Math.min(5, Math.max(0, Number(rating) || 0));
    p.reviews = Number($("#f_reviews").value) || 0;

    const stock = $("#f_stock").value.trim();
    p.stock = stock === "" ? 0 : Math.max(0, Math.floor(Number(stock) || 0));

    p.badges = $$("#badgePicker input:checked").map((i) => i.value);
    p.image = pendingImage;
    return p;
  }

  /* ---------------- Önizleme ---------------- */
  function renderPreview() {
    const p = products.find((x) => x.id === currentId);
    if (!p) return;

    const badges = badgesHTML(p);

    /* Kartı sitenin kendi fonksiyonu üretir — böylece önizleme
       mağazadan asla ayrışamaz. Pastel ton ve blob şekli ızgaradaki
       sıraya bağlı (:nth-child) olduğu için, ürünü gerçek sırasına
       denk düşürecek kadar görünmez kardeş ekleriz. */
    const idx = Math.max(0, products.indexOf(p));
    const ghosts = Array.from(
      { length: idx % 6 },
      () => '<article class="card ad-preview__ghost"></article>'
    ).join("");
    $("#previewCard").innerHTML = ghosts + productCard(p, 0);

    const r = Math.round(p.rating || 0);
    const off = discountPct(p);
    const rows = [
      ["Boyut (yaklaşık)", p.size || DEFAULT_SPECS.size],
      ["Hangi yönden destekler?", p.material || DEFAULT_SPECS.material],
      ["Çocuk sağlığına uygun ve güvenli.", p.layer || DEFAULT_SPECS.layer],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `<div class="specs__row"><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
      .join("");

    $("#previewDetail").innerHTML = `
      <div class="gallery__main">
        ${badges ? `<div class="gallery__badges">${badges}</div>` : ""}
        ${productMedia(p)}
      </div>
      <div class="ad-preview__info">
        <span class="detail__cat">${esc(p.category)}</span>
        <h1 class="detail__title">${esc(p.title) || "Ürün adı"}</h1>
        <div class="detail__rating">
          <span class="stars">${"★".repeat(r)}${"☆".repeat(5 - r)}</span>
          ${Number(p.rating || 0).toFixed(1)} · ${p.reviews || 0} değerlendirme
        </div>
        <div class="detail__price">
          <span class="now">${fmt(p.price)}</span>
          ${p.oldPrice ? `<span class="was">${fmt(p.oldPrice)}</span>` : ""}
          ${off ? `<span class="off">%${off} indirim</span>` : ""}
        </div>
        <p class="detail__stock detail__stock--${stockInfo(p).level}">
          <span class="detail__stock-dot" aria-hidden="true"></span>${stockInfo(p).label}
        </p>
        <p class="detail__desc">${esc(p.desc)}</p>
        <dl class="specs">${rows}</dl>
      </div>`;

    const sp = $("#stockPreview");
    if (sp) {
      const si = stockInfo(p);
      sp.textContent =
        si.level === "out"
          ? "Ürün sayfasında “Tükendi” görünür ve sepete eklenemez."
          : si.level === "low"
          ? `Ürün sayfasında “${si.label}” uyarısı görünür (kehribar).`
          : `Ürün sayfasında “${si.label}” görünür (yeşil).`;
      sp.className = "ad-stock-preview ad-stock-preview--" + si.level;
    }

    const info = $("#discountInfo");
    if (off > 0) {
      info.textContent = `%${off} indirim · ${fmt(p.oldPrice - p.price)} kazanç · "İndirim" etiketi otomatik eklenir.`;
      info.hidden = false;
    } else if (p.oldPrice && p.oldPrice <= p.price) {
      info.textContent = "Eski fiyat, satış fiyatından yüksek olmalı.";
      info.hidden = false;
    } else {
      info.hidden = true;
    }
  }

  /* Form değişince: topla → kaydet → önizle */
  function onFormChange() {
    if (!currentId) return;
    collect();
    markDirty();
    saveDraft();
    renderPreview();
    renderList();
    renderCategoryList();
    const p = products.find((x) => x.id === currentId);
    $("#formTitle").textContent = p.title || "Ürünü Düzenle";
  }

  /* ---------------- products.js üretimi ---------------- */
  function jsString(v) {
    return JSON.stringify(v == null ? "" : String(v));
  }

  function buildProductsFile() {
    const items = products
      .map(
        (p) => `  {
    id: ${jsString(p.id)},
    title: ${jsString(p.title)},
    category: ${jsString(p.category)},
    emoji: ${jsString(p.emoji || "📦")},
    image: ${p.image ? jsString(p.image) : "null"},
    price: ${Number(p.price) || 0},
    oldPrice: ${p.oldPrice ? Number(p.oldPrice) : "null"},
    rating: ${Number(p.rating) || 0},
    reviews: ${Number(p.reviews) || 0},
    stock: ${Number.isFinite(p.stock) ? p.stock : 0},
    badges: [${(p.badges || []).map(jsString).join(", ")}],
    size: ${jsString(p.size)},
    material: ${jsString(p.material)},
    layer: ${jsString(p.layer)},
    desc: ${jsString(p.desc)},
  }`
      )
      .join(",\n");

    const badgeDefs = Object.entries(BADGES)
      .map(([k, b]) => `  ${jsString(k)}: { label: ${jsString(b.label)}, tone: ${jsString(b.tone)} },`)
      .join("\n");

    const iconDefs = Object.entries(CATEGORY_ICONS)
      .map(([k, v]) => `  ${jsString(k)}: ${jsString(v)},`)
      .join("\n");

    return `/* ============================================================
   trtinyhands · Veri Katmanı
   ------------------------------------------------------------
   BU DOSYA ADMIN PANELİ TARAFINDAN ÜRETİLMİŞTİR (admin.html).
   Elle düzenleyebilirsiniz, ancak panelden yeni bir dışa aktarma
   yaptığınızda üzerine yazılır.

   Üretim tarihi: ${new Date().toLocaleString("tr-TR")}
   Ürün sayısı:   ${products.length}
   ============================================================ */

const PRODUCTS = [
${items},
];

/* Yeni ürün eklerken admin panelinde ön dolu gelen değerler. */
const DEFAULT_SPECS = {
  size: ${jsString(DEFAULT_SPECS.size)},
  material: ${jsString(DEFAULT_SPECS.material)},
  layer: ${jsString(DEFAULT_SPECS.layer)},
};

/* Bu adede kadar "Son N adet" uyarısı gösterilir. */
const STOCK_LOW_THRESHOLD = ${
      typeof STOCK_LOW_THRESHOLD === "number" ? STOCK_LOW_THRESHOLD : 5
    };

/* Ürün etiketleri. */
const BADGES = {
${badgeDefs}
};

/* Kategori filtresi figürleri. */
const CATEGORY_ICONS = {
${iconDefs}
};

const CATEGORIES = ["Tümü", ...new Set(PRODUCTS.map((p) => p.category))];
`;
  }

  function exportFile() {
    if (products.length === 0) {
      toast("Dışa aktarılacak ürün yok.");
      return;
    }
    const blob = new Blob([buildProductsFile()], {
      type: "application/javascript;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.js";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    dirty = false;
    $("#dirtyBar").hidden = true;
    toast("products.js indirildi — assets/js/ klasörüne yükleyin.");
  }

  /* products.js metnini çalıştırıp içindeki ürün dizisini döner. */
  function parseProductsFile(text) {
    const fn = new Function(
      `${text}\n return { PRODUCTS, DEFAULT_SPECS: typeof DEFAULT_SPECS !== "undefined" ? DEFAULT_SPECS : null };`
    );
    const data = fn();
    if (!Array.isArray(data.PRODUCTS) || data.PRODUCTS.length === 0) {
      throw new Error("PRODUCTS bulunamadı");
    }
    return data.PRODUCTS;
  }

  /* Sitede yayında olan products.js'i önbelleği atlayarak okur.
     Sayfadaki <script> etiketi eski (önbellekteki) sürümü yüklemiş olabilir;
     sunucuya ulaşılamazsa ona geri düşülür.
     Dosya çift tıklanarak (file://) açıldıysa tarayıcılar fetch'i CORS
     nedeniyle engeller ve konsola hata basar; o durumda hiç denenmez —
     zaten önbellek yoktur, <script> etiketi diskteki güncel dosyayı okur. */
  async function loadSiteProducts() {
    if (location.protocol === "file:") return PRODUCTS;
    try {
      const res = await fetch(`assets/js/products.js?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(res.status);
      return parseProductsFile(await res.text());
    } catch {
      return PRODUCTS;
    }
  }

  /* Dışa aktarılmış bir products.js dosyasını geri okur. */
  function importFile(file) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        products = parseProductsFile(fr.result).map(normalize);
        currentId = null;
        $("#form").hidden = true;
        $("#preview").hidden = true;
        $("#editorEmpty").hidden = false;
        saveDraft();
        renderList();
        renderCategoryList();
        toast(`${products.length} ürün içe aktarıldı.`);
      } catch (e) {
        toast("Dosya okunamadı — geçerli bir products.js mi?");
      }
    };
    fr.readAsText(file);
  }

  /* Eksik alanları tamamlar (eski sürümlerden gelen veriler için). */
  function normalize(p) {
    return {
      id: p.id || newId(p.title),
      title: p.title || "",
      category: p.category || "Diğer",
      emoji: p.emoji || "📦",
      image: p.image || null,
      price: Number(p.price) || 0,
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      rating: typeof p.rating === "number" ? p.rating : 5,
      reviews: Number(p.reviews) || 0,
      stock: Number.isFinite(p.stock) ? Math.max(0, Math.floor(p.stock)) : 10,
      badges: Array.isArray(p.badges)
        ? p.badges
        : p.badge
        ? [slugify(p.badge)]
        : [],
      size: p.size || "",
      material: p.material || "",
      layer: p.layer || "",
      desc: p.desc || "",
    };
  }

  /* ---------------- Olaylar ---------------- */
  function wire() {
    // Liste
    $("#listItems").addEventListener("click", (e) => {
      const up = e.target.closest("[data-move-up]");
      const down = e.target.closest("[data-move-down]");
      if (up || down) {
        const i = Number((up || down).dataset.moveUp ?? (up || down).dataset.moveDown);
        const j = up ? i - 1 : i + 1;
        if (j < 0 || j >= products.length) return;
        [products[i], products[j]] = [products[j], products[i]];
        markDirty();
        saveDraft();
        renderList();
        return;
      }
      const row = e.target.closest("[data-id]");
      if (row) openProduct(row.dataset.id);
    });

    $("#listSearch").addEventListener("input", renderList);

    // Yeni ürün
    $("#newBtn").addEventListener("click", () => {
      const p = normalize({
        title: "Yeni Ürün",
        category: products[0]?.category || "Fantastik",
        price: 0,
        size: DEFAULT_SPECS.size,
        material: DEFAULT_SPECS.material,
        layer: DEFAULT_SPECS.layer,
        rating: 5,
        stock: 10,
      });
      p.id = newId(p.title);
      products.unshift(p);
      markDirty();
      saveDraft();
      renderList();
      openProduct(p.id);
      $("#f_title").focus();
      $("#f_title").select();
    });

    // Silme
    $("#deleteBtn").addEventListener("click", () => {
      const p = products.find((x) => x.id === currentId);
      if (!p) return;
      if (!confirm(`"${p.title}" silinsin mi? Bu işlem geri alınamaz.`)) return;
      products = products.filter((x) => x.id !== currentId);
      currentId = null;
      $("#form").hidden = true;
      $("#preview").hidden = true;
      $("#editorEmpty").hidden = false;
      markDirty();
      saveDraft();
      renderList();
      toast("Ürün silindi.");
    });

    // Form alanları
    $("#form").addEventListener("input", onFormChange);
    $("#form").addEventListener("change", onFormChange);
    $("#form").addEventListener("submit", (e) => e.preventDefault());

    // Görsel
    $("#imageInput").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await cropper.load(file);
      } catch {
        toast("Görsel açılamadı.");
      }
      e.target.value = "";
    });

    $("#imageClear").addEventListener("click", () => {
      cropper.clear();
      pendingImage = null;
      onFormChange();
    });

    // Sürükle bırak
    const drop = $("#cropper");
    ["dragenter", "dragover"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.add("is-drop");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.remove("is-drop");
      })
    );
    drop.addEventListener("drop", async (e) => {
      const file = [...(e.dataTransfer?.files || [])].find((f) =>
        f.type.startsWith("image/")
      );
      if (!file) return;
      try {
        await cropper.load(file);
      } catch {
        toast("Görsel açılamadı.");
      }
    });

    // Dışa / içe aktarma
    $("#exportBtn").addEventListener("click", exportFile);
    $("#importBtn").addEventListener("click", () => $("#importInput").click());
    $("#importInput").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (f) importFile(f);
      e.target.value = "";
    });

    // Kaydedilmemiş değişiklik uyarısı
    window.addEventListener("beforeunload", (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    });
  }

  /* ---------------- Başlangıç ---------------- */
  async function init() {
    cropper = Cropper.create($("#cropper"), { aspect: 4 / 5 });
    cropper.onChange((url) => {
      pendingImage = url;
      if (currentId) {
        const p = products.find((x) => x.id === currentId);
        if (p) {
          p.image = url;
          markDirty();
          saveDraft();
          renderPreview();
          renderList();
        }
      }
    });

    wire();
    $("#listCount").textContent = "Sitedeki ürünler okunuyor…";

    /* Kaynak her zaman sitedeki güncel ürünlerdir. Tarayıcıda bunlardan
       farklı bir taslak kaldıysa hangisiyle devam edileceği sorulur. */
    const site = (await loadSiteProducts()).map(normalize);
    const draft = loadDraft();
    const draftDiffers =
      draft && JSON.stringify(draft.map(normalize)) !== JSON.stringify(site);

    if (
      draftDiffers &&
      confirm(
        "Bu tarayıcıda sitedeki ürünlerden farklı, kaydedilmemiş bir taslak var.\n\n" +
          "Tamam → taslaktan devam et\nİptal → sitedeki güncel ürünleri yükle (taslak silinir)"
      )
    ) {
      products = draft.map(normalize);
      markDirty();
      toast("Kaydedilmemiş taslağınız geri yüklendi.");
    } else {
      products = site;
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      toast(`Sitedeki ${products.length} ürün yüklendi.`);
    }

    renderList();
    renderCategoryList();
    updateStorageMeter();
  }

  init();
})();
