/* ============================================================
   trtinyhands · Yasal Sayfa Görünümü (legal-view.js)
   Veri: legal.js (LEGAL_PAGES, COMPANY)
   ============================================================ */
(function () {
  "use strict";
  const { $ } = YF;

  const root = $("#legalRoot");
  const params = new URLSearchParams(location.search);
  const slug = params.get("page") || LEGAL_PAGES[0].slug;
  const page = LEGAL_PAGES.find((p) => p.slug === slug) || LEGAL_PAGES[0];

  document.title = `${page.title} · trtinyhands`;

  const nav = LEGAL_PAGES.map(
    (p) =>
      `<a href="legal.html?page=${p.slug}" class="legal-nav__link ${
        p.slug === page.slug ? "active" : ""
      }">${p.title}</a>`
  ).join("");

  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Konum">
      <a href="index.html">Anasayfa</a><span>/</span> ${page.title}
    </nav>

    <div class="legal">
      <aside class="legal-nav" aria-label="Yasal sayfalar">
        <h4>Yasal Bilgiler</h4>
        ${nav}
      </aside>

      <article class="legal-content">
        <h1>${page.title}</h1>
        <p class="legal-updated">Son güncelleme: ${new Date().toLocaleDateString(
          "tr-TR",
          { year: "numeric", month: "long", day: "numeric" }
        )}</p>
        <div class="legal-notice">
          ⚠️ <strong>Taslak metin:</strong> Bu sayfa örnek şablondur. Yayına almadan önce
          firma bilgilerini (<code>assets/js/legal.js</code> içindeki <code>COMPANY</code>)
          doldurun ve bir hukuk danışmanına kontrol ettirin.
        </div>
        <div class="legal-body">${page.body}</div>
      </article>
    </div>`;

  window.scrollTo(0, 0);
})();
