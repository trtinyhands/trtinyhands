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
  let mediaIndex = -1; // seçili medyanın sırası (düzenlenen)
  /* Kırpıcıya program eliyle görsel yüklerken onChange tetiklenir; bu
     bayrak o sırada gelen bildirimleri yok sayar, yoksa yeni seçilen
     medya kendi kendini ezerdi. */
  let suppressCrop = false;

  /* ---------------- Yardımcılar ----------------
     Kart/etiket/stok/medya mantığı store.js'ten (YF) gelir: mağaza ile
     önizlemenin birbirinden uzaklaşmaması için tek kaynak. */
  const { fmt, productMedia, mediaList, mediaThumb, galleryHTML, wireSlides,
          badgesHTML, discountPct, stockInfo, productCard } = YF;

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

  /* ---------------- Medya (görsel + video) ----------------
     Her ürün bir medya listesi tutar. Listeden bir öğe seçilir ve
     kırpıcı o öğeyi düzenler: görselde görselin kendisini, videoda
     kapak görselini. */
  const cur = () => products.find((x) => x.id === currentId) || null;
  const curMedia = () => {
    const p = cur();
    return p ? p.media[mediaIndex] || null : null;
  };

  function renderMediaStrip() {
    const p = cur();
    const strip = $("#mediaStrip");
    if (!p) {
      strip.innerHTML = "";
      return;
    }
    if (!p.media.length) {
      strip.innerHTML = `<p class="ad-media__empty">Henüz medya yok — aşağıdan görsel veya video ekleyin.</p>`;
      return;
    }
    /* "Kapak" rozeti ilk FOTOĞRAFA takılır, ilk sıradakine değil:
       videolar ana sayfadaki kartta görünmediği için kartı temsil eden
       her zaman ilk fotoğraftır. */
    const coverIdx = p.media.findIndex((m) => m.type === "image");
    strip.innerHTML = p.media
      .map((m, i) => {
        const tag = i === coverIdx ? "Kapak" : m.type === "video" ? "Video" : i + 1;
        const title =
          i === coverIdx
            ? "Kapak fotoğrafı — ana sayfadaki kartta bu görünür"
            : m.type === "video"
            ? "Video — yalnızca ürün sayfasında görünür"
            : `${i + 1}. sıra`;
        return `
        <button type="button" class="ad-media__item${
          i === mediaIndex ? " is-active" : ""
        }${m.type === "video" ? " ad-media__item--video" : ""}" data-media="${i}" title="${title}">
          <span class="ad-media__thumb">${mediaThumb(m, p.title)}</span>
          <span class="ad-media__tag">${tag}</span>
        </button>`;
      })
      .join("");
  }

  function renderMediaEdit() {
    const m = curMedia();
    const box = $("#mediaEdit");
    if (!m) {
      box.hidden = true;
      return;
    }
    box.hidden = false;

    const isVideo = m.type === "video";
    $("#videoUrlRow").hidden = !isVideo;
    $("#mediaEditHint").textContent = isVideo
      ? "Videonun kapak görseli — ürün sayfasındaki küçük görselde bu görünür. Boş bırakırsanız videonun ilk karesi kullanılır. Videolar ana sayfadaki kartta görünmez."
      : "Kart oranı 4:5. Görseli sürükleyerek konumlandırın, tekerlek veya kaydırıcıyla yakınlaştırın.";
    if (isVideo) {
      $("#f_videoUrl").value = m.src;
      checkVideo(m.src);
    } else {
      checkVideo(null);
    }

    // Yükleme sürerken seçim değişirse bildirim yanlış medyaya yazılmasın
    suppressCrop = true;
    const release = () => (suppressCrop = false);
    const src = isVideo ? m.poster : m.src;
    if (src) {
      cropper.load(src).then(release, () => {
        cropper.clear();
        release();
      });
    } else {
      cropper.clear();
      release();
    }
  }

  /* Video dosyası gerçekten yerinde mi? Yol elle yazıldığı için harf
     hatası kolay oluyor; dosya yoksa panelde sessiz bir boşluk yerine
     açık bir uyarı çıkar. Son isteğin sonucu geçerlidir. */
  let videoProbe = 0;
  function checkVideo(src) {
    const el = $("#videoCheck");
    if (!el) return;
    const id = ++videoProbe;
    if (!src) {
      el.textContent = "";
      el.className = "ad-video-check";
      return;
    }
    el.textContent = "Dosya aranıyor…";
    el.className = "ad-video-check";
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      if (id !== videoProbe) return;
      el.textContent = `Dosya bulundu · ${Math.round(v.duration)} sn`;
      el.className = "ad-video-check is-ok";
    };
    v.onerror = () => {
      if (id !== videoProbe) return;
      el.textContent = "Bu yolda video yok — dosyayı siteye yüklediniz mi?";
      el.className = "ad-video-check is-bad";
    };
    v.src = src;
  }

  function selectMedia(i) {
    const p = cur();
    mediaIndex = p && p.media[i] ? i : -1;
    renderMediaStrip();
    renderMediaEdit();
  }

  /* Medya listesi değişti: taslağı kaydet ve her yeri tazele. */
  function afterMediaChange() {
    markDirty();
    saveDraft();
    renderMediaStrip();
    renderPreview();
    renderList();
  }

  /* Seçilen dosyaları varsayılan kırpmayla listeye ekler; sonuncusu
     ince ayar için kırpıcıda açık kalır. */
  async function addImages(files) {
    const p = cur();
    if (!p) return;
    suppressCrop = true;
    let added = 0;
    for (const file of files) {
      try {
        await cropper.load(file);
        const url = await cropper.toDataURL();
        if (!url) continue;
        p.media.push({ type: "image", src: url, poster: null });
        added++;
      } catch {
        toast("Görsel açılamadı.");
      }
    }
    if (!added) {
      suppressCrop = false;
      return;
    }
    selectMedia(p.media.length - 1); // bayrağı kendi penceresiyle devralır
    afterMediaChange();
  }

  function addVideo() {
    const p = cur();
    if (!p) return;
    const url = prompt(
      "Video dosyasının yolu:\n\n" +
        "Videoyu sitenizde assets/video/ klasörüne yükleyin, sonra\n" +
        "dosya adını buraya yazın. Örnek:\n\n" +
        "assets/video/tanitim.mp4",
      "assets/video/.mp4"
    );
    if (!url || !url.trim()) return;
    p.media.push({ type: "video", src: url.trim(), poster: null });
    selectMedia(p.media.length - 1);
    afterMediaChange();
  }

  function moveMedia(delta) {
    const p = cur();
    const j = mediaIndex + delta;
    if (!p || !p.media[mediaIndex] || j < 0 || j >= p.media.length) return;
    [p.media[mediaIndex], p.media[j]] = [p.media[j], p.media[mediaIndex]];
    mediaIndex = j;
    renderMediaStrip();
    afterMediaChange();
  }

  function deleteMedia() {
    const p = cur();
    if (!p || !p.media[mediaIndex]) return;
    p.media.splice(mediaIndex, 1);
    selectMedia(Math.min(mediaIndex, p.media.length - 1));
    afterMediaChange();
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
    selectMedia(0);

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
      ["Yaş aralığı", p.layer || DEFAULT_SPECS.layer],
    ]
      .filter(([, v]) => v)
      .map(([k, v]) => `<div class="specs__row"><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
      .join("");

    $("#previewDetail").innerHTML = `
      ${galleryHTML(p, badges)}
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

  /* Medya listesini okunabilir biçimde yazar. Görseller data URL olarak
     gömülüdür, bu yüzden satırlar uzundur. */
  function mediaLiteral(p) {
    const list = p.media || [];
    if (!list.length) return "[]";
    return `[\n${list
      .map(
        (m) =>
          `      { type: ${jsString(m.type)}, src: ${jsString(m.src)}${
            m.poster ? `, poster: ${jsString(m.poster)}` : ""
          } },`
      )
      .join("\n")}\n    ]`;
  }

  function buildProductsFile() {
    const items = products
      .map(
        (p) => `  {
    id: ${jsString(p.id)},
    title: ${jsString(p.title)},
    category: ${jsString(p.category)},
    emoji: ${jsString(p.emoji || "📦")},
    media: ${mediaLiteral(p)},
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
        selectMedia(-1);
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
      // Eski kayıtlardaki tek `image` alanı da listeye çevrilir
      media: mediaList(p),
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
      selectMedia(-1);
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

    // Medya listesi
    $("#mediaStrip").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-media]");
      if (btn) selectMedia(Number(btn.dataset.media));
    });

    $("#imageInput").addEventListener("change", async (e) => {
      const files = [...e.target.files];
      e.target.value = "";
      if (files.length) await addImages(files);
    });

    $("#videoAdd").addEventListener("click", addVideo);
    $("#mediaUp").addEventListener("click", () => moveMedia(-1));
    $("#mediaDown").addEventListener("click", () => moveMedia(1));
    $("#mediaDelete").addEventListener("click", () => {
      const m = curMedia();
      if (!m) return;
      const what = m.type === "video" ? "Video" : "Görsel";
      if (confirm(`${what} bu üründen silinsin mi?`)) deleteMedia();
    });

    let videoTypeTimer;
    $("#f_videoUrl").addEventListener("input", () => {
      const m = curMedia();
      if (!m || m.type !== "video") return;
      m.src = $("#f_videoUrl").value.trim();
      afterMediaChange();
      // Her tuşta dosya aramak yerine yazmayı bitirmesini bekle
      clearTimeout(videoTypeTimer);
      videoTypeTimer = setTimeout(() => checkVideo(m.src), 450);
    });

    /* Sürükle bırak — hem listenin hem kırpıcının üstüne bırakılabilir.
       (Liste boşken kırpıcı gizli olur, o yüzden ikisi de hedeftir.) */
    function wireDrop(el) {
      ["dragenter", "dragover"].forEach((ev) =>
        el.addEventListener(ev, (e) => {
          e.preventDefault();
          el.classList.add("is-drop");
        })
      );
      ["dragleave", "drop"].forEach((ev) =>
        el.addEventListener(ev, (e) => {
          e.preventDefault();
          el.classList.remove("is-drop");
        })
      );
      el.addEventListener("drop", async (e) => {
        const files = [...(e.dataTransfer?.files || [])].filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length) await addImages(files);
      });
    }
    wireDrop($("#cropper"));
    wireDrop($("#mediaStrip"));

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

    /* Kırpıcıdaki her oynama seçili medyaya işlenir: görselde görselin
       kendisi, videoda kapak görseli güncellenir. */
    cropper.onChange((url) => {
      if (suppressCrop) return;
      const m = curMedia();
      if (!m) return;
      if (m.type === "video") m.poster = url;
      else if (url) m.src = url;
      else return; // görselde boş bildirim: silme ayrı düğmeyle yapılır
      afterMediaChange();
    });

    // Önizlemedeki galeriler mağazanınkiyle aynı kodu kullanır
    wireSlides($("#previewCard"));
    wireSlides($("#previewDetail"));

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
