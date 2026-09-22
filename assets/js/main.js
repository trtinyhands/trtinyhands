/* ============================================================
   trtinyhands · Mağaza / Ana Sayfa (main.js)
   Ortak sepet mantığı store.js (window.YF) içindedir.
   ============================================================ */
(function () {
  "use strict";
  const { $, emo, productCard, wireProductGrid, observeReveals } = YF;

  const state = { filter: "Tümü", query: "" };
  const grid = $("#productGrid");
  const emptyState = $("#emptyState");

  function renderProducts() {
    const list = PRODUCTS.filter((p) => {
      const matchCat = state.filter === "Tümü" || p.category === state.filter;
      const matchQ =
        !state.query ||
        p.title.toLowerCase().includes(state.query) ||
        p.category.toLowerCase().includes(state.query);
      return matchCat && matchQ;
    });
    grid.innerHTML = list.map(productCard).join("");
    emptyState.hidden = list.length > 0;
    if (!emptyState.hidden && !emptyState.dataset.ready) {
      emptyState.innerHTML = `${emo("🔍", "empty__icon")}Aramanıza uygun ürün bulunamadı.`;
      emptyState.dataset.ready = "1";
    }
    observeReveals();
  }

  function renderFilters() {
    $("#filters").innerHTML = CATEGORIES.map((c) => {
      const icon = CATEGORY_ICONS[c] ? emo(CATEGORY_ICONS[c]) : "";
      return `<button class="chip ${
        c === state.filter ? "active" : ""
      }" data-cat="${c}">${icon}${c}</button>`;
    }).join("");
  }

  $("#filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.filter = btn.dataset.cat;
    renderFilters();
    renderProducts();
  });

  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value.trim().toLowerCase();
    renderProducts();
  });

  /* Init */
  renderFilters();
  renderProducts();
  wireProductGrid(grid);
  observeReveals();
})();
