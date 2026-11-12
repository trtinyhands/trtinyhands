/* ============================================================
   trtinyhands · Ortak Mağaza Modülü (store.js)
   Hem ana sayfada hem ürün detay sayfasında kullanılır.
   window.YF üzerinden erişilir.
   ============================================================ */
window.YF = (function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const fmt = (n) => n.toLocaleString("tr-TR") + "₺";

  /* ---------------- Figür görselleri (OpenMoji) ----------------
     Sistem emojileri yerine OpenMoji'nin elle çizilmiş SVG setini kullanırız:
     her işletim sisteminde aynı görünür ve markanın el yapımı diline uyar.
     CDN'e ulaşılamazsa düz emoji karakterine geri düşer. */
  const OPENMOJI_BASE =
    "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/";

  // "🏎️" → "1F3CE"  (varyasyon seçici FE0F dosya adında yer almaz)
  function emojiCode(ch) {
    return [...ch]
      .map((c) => c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"))
      .filter((c) => c !== "FE0F" && c !== "200D")
      .join("-");
  }

  function emo(ch, cls = "", alt = "") {
    const src = OPENMOJI_BASE + emojiCode(ch) + ".svg";
    return `<img class="emo${cls ? " " + cls : ""}" src="${src}" alt="${alt}"
      onerror="this.outerHTML='<span class=&quot;emo emo--fallback${
        cls ? " " + cls : ""
      }&quot;>${ch}</span>'">`;
  }

  /* ---------------- Cart state ---------------- */
  let cart = load();

  /* Depodan okunan sepeti güvenilir hale getirir:
     - katalogda artık bulunmayan ürünleri atar (panelden silinmiş olabilir)
     - bozuk/negatif/kesirli adetleri ayıklar
     - tükenmiş ürünleri çıkarır, stok üstü adetleri stoka indirir
     Bunlar temizlenmezse rozet ürünü saymaya devam eder ama çekmecede
     satır görünmez; sepet silinemeyen bir hayaletle takılı kalır. */
  function sanitize(raw) {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    Object.keys(raw).forEach((id) => {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return;
      let q = Math.floor(Number(raw[id]));
      if (!Number.isFinite(q) || q < 1) return;
      const st = stockInfo(p);
      if (st.level === "out") return;
      if (st.qty != null && q > st.qty) q = st.qty;
      out[id] = q;
    });
    return out;
  }

  function load() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem("yf_cart"));
    } catch {
      raw = null;
    }
    const clean = sanitize(raw);
    // Ayıklama bir şey değiştirdiyse depoyu da düzelt
    if (JSON.stringify(clean) !== JSON.stringify(raw || {})) {
      try {
        localStorage.setItem("yf_cart", JSON.stringify(clean));
      } catch {}
    }
    return clean;
  }
  function save() {
    localStorage.setItem("yf_cart", JSON.stringify(cart));
  }
  const count = () => Object.values(cart).reduce((s, q) => s + q, 0);

  /* Sepeti depodan tazeler.
     Geri tuşuyla dönüldüğünde tarayıcı sayfayı bfcache'ten geri yükler:
     DOMContentLoaded yeniden tetiklenmez ve `cart` bellekte eski halde kalır.
     Bu yüzden pageshow/storage olaylarında yeniden okunur. */
  function syncFromStorage() {
    cart = load();
    renderCart();
  }
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) syncFromStorage();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "yf_cart") syncFromStorage();
  });

  function add(id, qty = 1) {
    const prod = PRODUCTS.find((x) => x.id === id);
    if (prod && stockInfo(prod).level === "out") {
      toast(`${prod.title} şu an stokta yok.`);
      return;
    }
    cart[id] = (cart[id] || 0) + qty;
    if (cart[id] < 1) delete cart[id];
    save();
    renderCart();
    cartPulse();
    const p = PRODUCTS.find((x) => x.id === id);
    if (p) toast(`${p.title} sepete eklendi ✓`);
  }

  // Animasyonu yeniden tetiklemek için sınıfı sıfırla + reflow
  function retrigger(el, cls) {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function cartPulse() {
    retrigger($("#cartCount"), "bump");
    retrigger($("#cartBtn"), "wiggle");
  }

  // Ürün figürünü sepet ikonuna doğru uçur
  function flyToCart(sourceEl) {
    const cartBtn = $("#cartBtn");
    if (!sourceEl || !cartBtn) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const s = sourceEl.getBoundingClientRect();
    const c = cartBtn.getBoundingClientRect();
    const fly = document.createElement("div");
    fly.className = "fly";
    fly.innerHTML = sourceEl.innerHTML.trim() || emo("🛒");
    const sx = s.left + s.width / 2;
    const sy = s.top + s.height / 2;
    fly.style.left = sx + "px";
    fly.style.top = sy + "px";
    document.body.appendChild(fly);
    const dx = c.left + c.width / 2 - sx;
    const dy = c.top + c.height / 2 - sy;
    requestAnimationFrame(() => {
      fly.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(.25) rotate(20deg)`;
      fly.style.opacity = "0.2";
    });
    const cleanup = () => fly.remove();
    fly.addEventListener("transitionend", cleanup, { once: true });
    setTimeout(cleanup, 950);
  }
  function setQty(id, delta) {
    cart[id] = (cart[id] || 0) + delta;
    if (cart[id] <= 0) delete cart[id];
    save();
    renderCart();
  }
  function remove(id) {
    delete cart[id];
    save();
    renderCart();
  }

  function renderCart() {
    const badge = $("#cartCount");
    if (badge) badge.textContent = count();

    const items = $("#cartItems");
    if (!items) return;

    const ids = Object.keys(cart);
    const totalEl = $("#cartTotal");
    const btn = $("#checkoutBtn");

    if (ids.length === 0) {
      items.innerHTML = `<div class="cart__empty"><span>${emo("🛒")}</span>Sepetiniz boş.<br>Beğendiğiniz figürleri ekleyin!</div>`;
      if (totalEl) totalEl.textContent = fmt(0);
      if (btn) btn.disabled = true;
      return;
    }

    let total = 0;
    const drawable = ids.filter((id) => PRODUCTS.some((x) => x.id === id));
    if (drawable.length === 0) {
      items.innerHTML = `<div class="cart__empty"><span>${emo("🛒")}</span>Sepetiniz boş.<br>Beğendiğiniz figürleri ekleyin!</div>`;
      if (totalEl) totalEl.textContent = fmt(0);
      if (btn) btn.disabled = true;
      return;
    }

    items.innerHTML = drawable
      .map((id) => {
        const p = PRODUCTS.find((x) => x.id === id);
        if (!p) return "";
        const qty = cart[id];
        total += p.price * qty;
        return `
        <div class="cart-line">
          <div class="cart-line__img">${productMedia(p)}</div>
          <div class="cart-line__info">
            <strong>${p.title}</strong>
            <small>${fmt(p.price)}</small>
            <div class="qty">
              <button data-dec="${id}" aria-label="Azalt">−</button>
              <span>${qty}</span>
              <button data-inc="${id}" aria-label="Artır">+</button>
            </div>
          </div>
          <button class="cart-line__remove" data-remove="${id}">Kaldır</button>
        </div>`;
      })
      .join("");

    if (totalEl) totalEl.textContent = fmt(total);
    if (btn) btn.disabled = false;
  }

  /* ---------------- Ürün medyası & etiketleri ---------------- */

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  /* Ürünün medya listesi: [{ type, src, poster }].
     Eski kayıtlarda tek bir `image` alanı vardı; onu da tek öğelik listeye
     çevirir, böylece sitenin tamamı tek biçimle çalışır. */
  function mediaList(p) {
    const raw = Array.isArray(p.media)
      ? p.media
      : p.image
      ? [{ type: "image", src: p.image }]
      : [];
    return raw
      .filter((m) => m && m.src)
      .map((m) => ({
        type: m.type === "video" ? "video" : "image",
        src: String(m.src),
        poster: m.poster || null,
      }));
  }

  /* Yalnızca fotoğraflar. Kartlar, sepet ve küçük önizlemeler bunu
     kullanır — videolar yalnızca ürün sayfasındaki galeride görünür. */
  const imageList = (p) => mediaList(p).filter((m) => m.type === "image");

  /* Tek bir medyanın durağan görüntüsü (ızgara, sepet, küçük görsel).
     Videolar burada oynatılmaz: kapak görseli + oynat işareti gösterilir.
     Dönen <img>/<video> kabın DOĞRUDAN çocuğu olmalıdır: `inset: 0` ile
     kabı doldurur, araya sarmalayıcı girerse boyut çöker. */
  function mediaThumb(m, alt = "") {
    if (!m || !m.src) return "";
    if (m.type !== "video") {
      return `<img class="figure" src="${esc(m.src)}" alt="${esc(alt)}" loading="lazy">`;
    }
    const inner = m.poster
      ? `<img class="figure" src="${esc(m.poster)}" alt="${esc(alt)}" loading="lazy">`
      : // Kapak yoksa tarayıcı ilk kareyi gösterir; yalnızca üstbilgi inilir.
        `<video class="figure" src="${esc(m.src)}" preload="metadata" muted playsinline></video>`;
    return `${inner}<span class="media-play" aria-hidden="true"></span>`;
  }

  /* Ürünün ilk FOTOĞRAFI, yoksa OpenMoji figürü. Sepet satırı, admin
     listesi ve sepete uçan kopya bunu kullanır. */
  function productMedia(p) {
    const first = imageList(p)[0];
    if (first) return mediaThumb(first, p.title);
    return `<span class="card__emoji">${emo(p.emoji, "", p.title)}</span>`;
  }

  const discountPct = (p) =>
    p.oldPrice && p.oldPrice > p.price
      ? Math.round((1 - p.price / p.oldPrice) * 100)
      : 0;

  /* Ürünün etiketleri + indirim varsa otomatik yüzde etiketi. */
  function badgeList(p) {
    const out = (p.badges || [])
      .filter((k) => BADGES[k])
      .map((k) => ({ label: BADGES[k].label, tone: BADGES[k].tone }));
    const off = discountPct(p);
    if (off > 0) out.unshift({ label: `%${off} İndirim`, tone: "sale" });
    if (stockInfo(p).level === "out") out.unshift({ label: "Tükendi", tone: "out" });
    return out;
  }

  /* Stok durumu: adet yoksa "stokta var" varsayılır. */
  function stockInfo(p) {
    const n = Number.isFinite(p.stock) ? p.stock : null;
    const low =
      typeof STOCK_LOW_THRESHOLD === "number" ? STOCK_LOW_THRESHOLD : 5;
    if (n === null) return { level: "in", label: "Stokta var", qty: null };
    if (n <= 0) return { level: "out", label: "Tükendi", qty: 0 };
    if (n <= low) return { level: "low", label: `Son ${n} adet`, qty: n };
    return { level: "in", label: "Stokta var", qty: n };
  }

  function badgesHTML(p, cls = "badge") {
    return badgeList(p)
      .map((b) => `<span class="${cls} ${cls}--${b.tone}">${b.label}</span>`)
      .join("");
  }

  /* ---------------- Medya karuseli (paylaşılan) ----------------
     Hem karttaki küçük galeri hem ürün sayfasındaki büyük galeri aynı
     sözleşmeyi kullanır, böylece tek bir tıklama yöneticisi ikisini de
     sürer:
       [data-gallery]   kap, açık olan medyayı data-index'te tutar
       [data-slide-i]   sıradaki medya (yalnızca biri .is-active)
       [data-slide]     bir önceki / bir sonraki düğmesi (-1 / 1)
       [data-goto]      noktalar ve küçük görseller (hedef sıra) */

  function slideItems(frame) {
    return $$("[data-slide-i]", frame);
  }

  /* Oynatılan videoyu durağan kapağına geri döndürür. */
  function resetSlide(s) {
    if (!s.classList.contains("is-playing")) return;
    s.classList.remove("is-playing");
    s.innerHTML = mediaThumb(
      { type: s.dataset.type, src: s.dataset.src, poster: s.dataset.poster || null },
      s.dataset.alt || ""
    );
  }

  function setSlide(frame, idx) {
    const slides = slideItems(frame);
    const n = slides.length;
    if (n < 2) return;
    const i = ((idx % n) + n) % n;
    frame.dataset.index = String(i);
    slides.forEach((s, j) => {
      // Başka bir medyaya geçerken video sussun
      if (j !== i) resetSlide(s);
      s.classList.toggle("is-active", j === i);
    });
    $$("[data-goto]", frame).forEach((d, j) =>
      d.classList.toggle("is-active", j === i)
    );
    const counter = $(".gallery__counter b", frame);
    if (counter) counter.textContent = String(i + 1);
  }

  /* Videoyu yerinde oynatır (yalnızca büyük galeride).
     Videolar siteye yüklenen kendi dosyalarımızdır (ör.
     assets/video/tanitim.mp4), gömülü oynatıcı yoktur. */
  function playSlide(s) {
    const src = s.dataset.src;
    if (!src) return;
    s.classList.add("is-playing");
    s.innerHTML = `<video class="figure" src="${esc(src)}" controls autoplay playsinline></video>`;
  }

  /* Karusel tıklamalarını yönetir. Olaylar kaba bağlanır, böylece içerik
     yeniden basıldığında (admin önizlemesi) yeniden bağlamak gerekmez. */
  function wireSlides(container) {
    if (!container || container.dataset.slidesWired) return;
    container.dataset.slidesWired = "1";
    container.addEventListener("click", (e) => {
      const frame = e.target.closest("[data-gallery]");
      if (!frame) return;

      const step = e.target.closest("[data-slide]");
      if (step) {
        e.preventDefault();
        setSlide(frame, Number(frame.dataset.index || 0) + Number(step.dataset.slide));
        return;
      }

      const goto = e.target.closest("[data-goto]");
      if (goto) {
        e.preventDefault();
        setSlide(frame, Number(goto.dataset.goto));
        return;
      }

      // Büyük galeride videonun üstüne tıklamak oynatır.
      const slide = e.target.closest(".gallery__slide");
      if (slide && slide.dataset.type === "video" && !slide.classList.contains("is-playing")) {
        e.preventDefault();
        playSlide(slide);
      }
    });
  }

  /* ---------------- Product card (paylaşılan) ----------------
     Kartta yalnızca fotoğraflar döner; videolar ürün sayfasındadır. */
  function cardMedia(p) {
    const list = imageList(p);
    if (!list.length) {
      return `<span class="card__emoji">${emo(p.emoji, "", p.title)}</span>`;
    }
    return `<div class="card__slides">${list
      .map(
        (m, i) => `<div class="card__slide${
          i === 0 ? " is-active" : ""
        }" data-slide-i="${i}">${mediaThumb(m, p.title)}</div>`
      )
      .join("")}</div>`;
  }

  function productCard(p, i = 0) {
    const price = p.oldPrice
      ? `<span class="was">${fmt(p.oldPrice)}</span>${fmt(p.price)}`
      : fmt(p.price);
    const delay = (i % 4) * 80; // satır içinde soldan sağa kaskad
    const badges = badgesHTML(p);
    const st = stockInfo(p);
    const sold = st.level === "out";
    const list = imageList(p);

    /* Oklar ve noktalar, kırpılan blob şeklinin DIŞINDAKİ çerçevede durur;
       `overflow: hidden` olan .card__media içinde kenarlardan kesilirlerdi. */
    const nav =
      list.length > 1
        ? `<button class="card__nav card__nav--prev" type="button" data-slide="-1"
             aria-label="Önceki görsel">‹</button>
           <button class="card__nav card__nav--next" type="button" data-slide="1"
             aria-label="Sonraki görsel">›</button>
           <div class="card__dots">${list
             .map(
               (m, j) =>
                 `<button class="card__dot${j === 0 ? " is-active" : ""}" type="button"
                    data-goto="${j}" aria-label="${j + 1}. görsel"></button>`
             )
             .join("")}</div>`
        : "";

    return `
      <article class="card reveal${sold ? " card--out" : ""}" data-id="${
      p.id
    }" style="--d:${delay}ms">
        <div class="card__frame" data-gallery data-index="0">
          <div class="card__media">
            ${cardMedia(p)}
            <a class="card__link" href="detail.html?id=${p.id}" aria-label="${esc(
      p.title
    )} detayları"></a>
          </div>
          ${nav}
        </div>
        <div class="card__info">
          <div class="card__badges">${
            badges ||
            `<span class="badge badge--ghost" aria-hidden="true">&nbsp;</span>`
          }</div>
          <span class="card__cat">${p.category}</span>
          <a class="card__title-link" href="detail.html?id=${p.id}"><h3 class="card__title">${p.title}</h3></a>
          <div class="card__price">${price}</div>
          <button class="card__add" data-add="${p.id}"${sold ? " disabled" : ""}>${
      sold ? "Tükendi" : "Sepete Ekle"
    }</button>
        </div>
      </article>`;
  }

  /* ---------------- Ürün sayfası galerisi (paylaşılan) ----------------
     Admin önizlemesi de bunu kullanır: iki yerde ayrı galeri kodu tutulmaz. */
  function galleryHTML(p, badges = "") {
    const list = mediaList(p);
    const badgeBar = badges ? `<div class="gallery__badges">${badges}</div>` : "";

    if (!list.length) {
      return `
        <div class="gallery">
          <div class="gallery__main">
            ${badgeBar}
            <span class="card__emoji">${emo(p.emoji, "", p.title)}</span>
          </div>
        </div>`;
    }

    const slides = list
      .map(
        (m, i) => `
        <div class="gallery__slide${i === 0 ? " is-active" : ""}" data-slide-i="${i}"
          data-type="${m.type}" data-src="${esc(m.src)}"
          data-poster="${esc(m.poster || "")}" data-alt="${esc(p.title)}">
          ${mediaThumb(m, p.title)}
        </div>`
      )
      .join("");

    const multi = list.length > 1;
    const nav = multi
      ? `<button class="gallery__nav gallery__nav--prev" type="button" data-slide="-1"
           aria-label="Önceki görsel">‹</button>
         <button class="gallery__nav gallery__nav--next" type="button" data-slide="1"
           aria-label="Sonraki görsel">›</button>
         <span class="gallery__counter"><b>1</b>/${list.length}</span>`
      : "";

    const thumbs = multi
      ? `<div class="gallery__thumbs">${list
          .map(
            (m, i) => `
          <button class="gallery__thumb${i === 0 ? " is-active" : ""}" type="button"
            data-goto="${i}" aria-label="${i + 1}. görsel">
            ${mediaThumb(m, p.title)}
          </button>`
          )
          .join("")}</div>`
      : "";

    return `
      <div class="gallery" data-gallery data-index="0">
        <div class="gallery__main">
          ${badgeBar}
          ${slides}
          ${nav}
        </div>
        ${thumbs}
      </div>`;
  }

  /* Ürün ızgarasındaki "sepete ekle" ve karusel tıklamalarını yönetir. */
  function wireProductGrid(container) {
    if (!container) return;
    wireSlides(container);
    container.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        e.preventDefault();
        // Uçan kopya o an açık olan görselden alınır
        const media = addBtn
          .closest(".card")
          ?.querySelector(".card__slide.is-active .figure, .card__emoji, .figure");
        flyToCart(media);
        add(addBtn.dataset.add);
      }
    });
  }

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ---------------- WhatsApp ile sipariş ----------------
     Sepet içeriğini okunabilir bir mesaja çevirip wa.me üzerinden açar. */
  const WHATSAPP_NUMBER = "905317722199"; // +90 531 772 21 99

  function orderMessage() {
    const ids = Object.keys(cart);
    if (ids.length === 0) return null;

    const lines = [];
    let total = 0;
    ids.forEach((id, i) => {
      const p = PRODUCTS.find((x) => x.id === id);
      if (!p) return;
      const qty = cart[id];
      const sub = p.price * qty;
      total += sub;
      lines.push(`${i + 1}. ${p.title} — ${qty} adet × ${fmt(p.price)} = ${fmt(sub)}`);
    });
    if (lines.length === 0) return null;

    return [
      "Merhaba! trtinyhands sitesinden sipariş vermek istiyorum.",
      "",
      "*Sipariş Özeti*",
      ...lines,
      "",
      `*Toplam: ${fmt(total)}*`,
      `Ürün adedi: ${count()}`,
      "",
      "Teslimat ve ödeme için bilgi alabilir miyim?",
    ].join("\n");
  }

  function sendOrderToWhatsApp() {
    const msg = orderMessage();
    if (!msg) {
      toast("Sepetiniz boş.");
      return;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
    toast("WhatsApp'a yönlendiriliyorsunuz...");
  }

  /* ---------------- Cart drawer UI ---------------- */
  let openCart = () => {};
  let closeCart = () => {};
  function initCartUI() {
    const cartEl = $("#cart");
    const overlay = $("#cartOverlay");
    if (!cartEl || !overlay) return;

    // Kapalıyken çekmece klavye/okuyucu için tamamen devre dışı olmalı;
    // aria-hidden tek başına odaklanmayı engellemez, bu yüzden inert de kullanılır.
    let lastFocused = null;
    // Çekmece açıkken sayfanın geri kalanı inert olur → Tab odağı içeride kalır.
    const pageParts = () => $$("body > header, body > main, body > footer");

    openCart = () => {
      lastFocused = document.activeElement;
      cartEl.classList.add("open");
      overlay.classList.add("open");
      cartEl.removeAttribute("aria-hidden");
      cartEl.removeAttribute("inert");
      pageParts().forEach((el) => el.setAttribute("inert", ""));
      $("#cartClose")?.focus();
    };
    closeCart = () => {
      pageParts().forEach((el) => el.removeAttribute("inert"));
      // Odak çekmecenin içindeyse, gizlemeden önce dışarı taşı
      if (cartEl.contains(document.activeElement)) {
        (lastFocused || $("#cartBtn"))?.focus();
      }
      cartEl.classList.remove("open");
      overlay.classList.remove("open");
      cartEl.setAttribute("aria-hidden", "true");
      cartEl.setAttribute("inert", "");
    };

    cartEl.setAttribute("inert", ""); // başlangıçta kapalı

    const cartBtn = $("#cartBtn");
    const cartClose = $("#cartClose");
    if (cartBtn) cartBtn.addEventListener("click", openCart);
    if (cartClose) cartClose.addEventListener("click", closeCart);
    overlay.addEventListener("click", closeCart);

    const itemsEl = $("#cartItems");
    if (itemsEl)
      itemsEl.addEventListener("click", (e) => {
        const inc = e.target.closest("[data-inc]");
        const dec = e.target.closest("[data-dec]");
        const rm = e.target.closest("[data-remove]");
        if (inc) setQty(inc.dataset.inc, 1);
        if (dec) setQty(dec.dataset.dec, -1);
        if (rm) remove(rm.dataset.remove);
      });

    const checkout = $("#checkoutBtn");
    if (checkout) checkout.addEventListener("click", sendOrderToWhatsApp);
  }

  /* ---------------- Header + mobile menu ---------------- */
  function initHeader() {
    /* Başlığın "kaydırıldı" görünümü. Histerezis var: açılma ve kapanma
       eşikleri farklı, böylece sınırın tam üstünde ufak hareketlerde
       zemin/gölge gidip gelmez. */
    const header = $("#header");
    if (header) {
      let on = false;
      const syncHeader = () => {
        const y = window.scrollY;
        if (!on && y > 40) {
          on = true;
          header.classList.add("scrolled");
        } else if (on && y < 16) {
          on = false;
          header.classList.remove("scrolled");
        }
      };
      window.addEventListener("scroll", syncHeader, { passive: true });
      syncHeader();
    }

    const nav = $("#nav");
    const ham = $("#hamburger");
    if (nav && ham) {
      ham.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        ham.classList.toggle("active", open);
        ham.setAttribute("aria-expanded", open);
      });
      $$("#nav a").forEach((a) =>
        a.addEventListener("click", () => {
          nav.classList.remove("open");
          ham.classList.remove("active");
          ham.setAttribute("aria-expanded", "false");
        })
      );
    }

    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------- Reveal on scroll ----------------
     IntersectionObserver tabanlı: scroll dinleyicisinden daha ucuz ve
     yeniden render'da birikmez. IO yoksa içerik asla gizli kalmaz. */
  function markIn(el) {
    el.classList.add("in");
    // Reveal bitince sınıfları kaldır: hover dönüşümü serbest kalsın
    el.addEventListener("transitionend", function done(e) {
      if (e.propertyName !== "transform") return;
      el.classList.remove("reveal", "in");
      el.removeEventListener("transitionend", done);
    });
  }

  let revealObserver = null;
  let fallbackHandler = null; // yalnızca IO çalışmazsa devreye girer

  // Görüş alanındaki bekleyenleri açar; kaç tanesini açtığını döner.
  function revealVisible() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    let n = 0;
    $$(".reveal:not(.in)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh - 40 && r.bottom > 0) {
        markIn(el);
        n++;
      }
    });
    return n;
  }

  // IO beklenmedik şekilde çalışmazsa scroll tabanlı yedeğe geç.
  function enableFallback() {
    if (fallbackHandler) return;
    fallbackHandler = () => {
      revealVisible();
      if ($$(".reveal:not(.in)").length === 0) {
        window.removeEventListener("scroll", fallbackHandler);
        window.removeEventListener("resize", fallbackHandler);
        fallbackHandler = null;
      }
    };
    window.addEventListener("scroll", fallbackHandler, { passive: true });
    window.addEventListener("resize", fallbackHandler, { passive: true });
  }

  function observeReveals() {
    const pending = $$(".reveal:not(.in)");
    if (pending.length === 0) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      pending.forEach((el) => el.classList.add("in"));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            markIn(entry.target);
            obs.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
      );
    }
    pending.forEach((el) => revealObserver.observe(el));

    // Güvenlik ağı: IO sessiz kalırsa içerik gizli kalmasın.
    setTimeout(() => {
      if (revealVisible() > 0) enableFallback();
    }, 1200);
  }

  /* ---------------- Kaydırma efektleri ----------------
     Tek bir rAF ile sınırlanmış scroll dinleyicisi:
     ilerleme çubuğu + tanıtım bandında hafif parallax. */
  function initScrollFx() {
    const bar = $("#scrollProgress");
    const figures = $(".band-figures");
    const intro = $(".intro-band .shop-intro");
    if (!bar && !figures && !intro) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;

      if (bar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
        bar.style.transform = `scaleX(${p})`;
      }

      if (!reduce) {
        // Figür katmanı metinden yavaş kayar → derinlik hissi
        if (figures) figures.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        if (intro) {
          const fade = Math.min(y / 440, 1);
          intro.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
          intro.style.opacity = String(1 - fade * 0.7);
        }
      }
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initCartUI();
    initHeader();
    initScrollFx();
    renderCart();
    observeReveals();
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCart();
        const nav = $("#nav");
        const ham = $("#hamburger");
        if (nav) nav.classList.remove("open");
        if (ham) ham.classList.remove("active");
      }
    });
  });

  /* ---------------- Public API ---------------- */
  return {
    $,
    $$,
    fmt,
    emo,
    esc,
    productMedia,
    mediaList,
    imageList,
    mediaThumb,
    galleryHTML,
    wireSlides,
    setSlide,
    badgesHTML,
    badgeList,
    discountPct,
    stockInfo,
    add,
    setQty,
    remove,
    renderCart,
    syncFromStorage,
    orderMessage,
    sendOrderToWhatsApp,
    productCard,
    wireProductGrid,
    observeReveals,
    initScrollFx,
    flyToCart,
    toast,
    openCart: () => openCart(),
    closeCart: () => closeCart(),
    get cart() {
      return cart;
    },
  };
})();
