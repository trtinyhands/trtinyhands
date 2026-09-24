/* ============================================================
   trtinyhands · Ürün Detay Sayfası (detail.js)
   URL: detail.html?id=<ürün-id>
   ============================================================ */
(function () {
  "use strict";
  const { $, $$, fmt, emo, add, productMedia, badgesHTML, discountPct, stockInfo,
          productCard, wireProductGrid, observeReveals } = YF;

  const root = $("#detailRoot");
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const p = PRODUCTS.find((x) => x.id === id);

  /* ---- Ürün bulunamadıysa ---- */
  if (!p) {
    root.innerHTML = `
      <div class="notfound">
        <div class="emoji">${emo("🔍")}</div>
        <h1>Ürün bulunamadı</h1>
        <p>Aradığınız ürün kaldırılmış veya bağlantı hatalı olabilir.</p>
        <a class="btn btn--primary" href="index.html">Mağazaya geri dön</a>
      </div>`;
    return;
  }

  /* ---- SEO / başlık ---- */
  document.title = `${p.title} · trtinyhands`;

  /* ---- Yardımcılar ---- */
  const r = Math.round(p.rating);
  const stars = "★".repeat(r) + "☆".repeat(5 - r);
  const off = discountPct(p);

  const priceBlock = `
    <span class="now">${fmt(p.price)}</span>
    ${p.oldPrice ? `<span class="was">${fmt(p.oldPrice)}</span>` : ""}
    ${off ? `<span class="off">%${off} indirim</span>` : ""}`;

  const badges = badgesHTML(p, "badge");
  const st = stockInfo(p);
  const sold = st.level === "out";

  /* Teknik özellikler ürüne özeldir; boş bırakılanlar varsayılana düşer. */
  const specRows = [
    ["Boyut (yaklaşık)", p.size || DEFAULT_SPECS.size],
    ["Hangi yönden destekler?", p.material || DEFAULT_SPECS.material],
    ["Çocuk sağlığına uygun ve güvenli.", p.layer || DEFAULT_SPECS.layer],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div class="specs__row"><dt>${k}</dt><dd>${v}</dd></div>`)
    .join("");

  /* ---- Render ---- */
  root.innerHTML = `
    <nav class="breadcrumb reveal" aria-label="Konum">
      <a href="index.html">Mağaza</a><span>/</span>
      <a href="index.html">${p.category}</a><span>/</span>
      ${p.title}
    </nav>

    <section class="detail">
      <div class="detail__grid">
        <div class="gallery reveal">
          <div class="gallery__main">
            ${badges ? `<div class="gallery__badges">${badges}</div>` : ""}
            ${productMedia(p)}
          </div>
        </div>

        <div class="detail__info reveal">
          <span class="detail__cat">${p.category}</span>
          <h1 class="detail__title">${p.title}</h1>
          <div class="detail__rating">
            <span class="stars">${stars}</span> ${p.rating.toFixed(1)} · ${p.reviews} değerlendirme
          </div>
          <div class="detail__price">${priceBlock}</div>
          <p class="detail__stock detail__stock--${st.level}">
            <span class="detail__stock-dot" aria-hidden="true"></span>${st.label}
          </p>
          <p class="detail__desc">${p.desc}</p>

          <div class="buy-row">
            <div class="stepper">
              <button data-step="-1" aria-label="Adet azalt">−</button>
              <input id="qtyInput" type="text" value="1" inputmode="numeric" aria-label="Adet" />
              <button data-step="1" aria-label="Adet artır">+</button>
            </div>
            <button class="btn btn--primary" id="addBtn"${sold ? " disabled" : ""}>${
              sold ? "Şu an stokta yok" : `Sepete Ekle · ${fmt(p.price)}`
            }</button>
          </div>

          <dl class="specs">${specRows}</dl>
        </div>
      </div>
    </section>`;

  /* ---- Etkileşimler ---- */
  const qtyInput = $("#qtyInput");
  const maxQty = sold ? 1 : Math.min(99, st.qty == null ? 99 : st.qty);
  const clampQty = () => {
    let v = parseInt(qtyInput.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > maxQty) v = maxQty;
    qtyInput.value = v;
    return v;
  };

  root.addEventListener("click", (e) => {
    const step = e.target.closest("[data-step]");
    const addBtn = e.target.closest("#addBtn");

    if (step) {
      qtyInput.value = clampQty() + parseInt(step.dataset.step, 10);
      clampQty();
    }
    if (addBtn) {
      YF.flyToCart($(".gallery__main .card__emoji, .gallery__main .figure"));
      add(p.id, clampQty());
    }
  });

  qtyInput.addEventListener("change", clampQty);

  /* ---- İlgili ürünler ---- */
  let related = PRODUCTS.filter(
    (x) => x.category === p.category && x.id !== p.id
  );
  // Yeterli değilse diğer ürünlerle tamamla
  if (related.length < 4) {
    related = related.concat(
      PRODUCTS.filter((x) => x.id !== p.id && !related.includes(x))
    );
  }
  related = related.slice(0, 4);

  const relGrid = $("#relatedGrid");
  relGrid.innerHTML = related.map(productCard).join("");
  wireProductGrid(relGrid);
  $("#related").hidden = false;

  observeReveals();
  window.scrollTo(0, 0);
})();
