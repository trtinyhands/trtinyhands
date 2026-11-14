/* ============================================================
   trtinyhands · Görsel Kırpma Aracı (cropper.js)
   ------------------------------------------------------------
   Bağımsız, kütüphanesiz bir kırpıcı. Sabit en-boy oranlı bir
   çerçeve içinde görseli kaydırıp yakınlaştırmanızı sağlar ve
   sonucu sıkıştırılmış bir data URL olarak döner.

   Kullanım:
     const c = Cropper.create(container, { aspect: 4/5 });
     await c.load(file);            // File | Blob | data URL
     const dataUrl = await c.toDataURL();
   ============================================================ */
window.Cropper = (function () {
  "use strict";

  /* Dışa aktarılan görselin uzun kenarı ve kalite.
     Görseller products.js içine gömüldüğü için boyut önemli. */
  const MAX_EDGE = 1000;
  const QUALITY = 0.82;

  function create(container, opts = {}) {
    const aspect = opts.aspect || 4 / 5;

    container.classList.add("cropper");
    container.innerHTML = `
      <div class="cropper__stage" data-stage>
        <canvas data-canvas></canvas>
        <div class="cropper__empty" data-empty>
          <strong>Görsel yok</strong>
          <span>Dosya seçin veya buraya sürükleyin</span>
        </div>
      </div>
      <div class="cropper__controls" data-controls hidden>
        <label class="cropper__zoom">
          <span>Yakınlaştır</span>
          <input type="range" data-zoom min="1" max="4" step="0.01" value="1" />
        </label>
        <button type="button" class="btn-ghost" data-reset>Sıfırla</button>
      </div>`;

    const stage = container.querySelector("[data-stage]");
    const canvas = container.querySelector("[data-canvas]");
    const empty = container.querySelector("[data-empty]");
    const controls = container.querySelector("[data-controls]");
    const zoomInput = container.querySelector("[data-zoom]");
    const ctx = canvas.getContext("2d");

    let img = null;
    let zoom = 1;
    let offset = { x: 0, y: 0 }; // görselin merkezden kayması (ekran pikseli)
    let drag = null;
    let view = { w: 300, h: 300 / aspect }; // son çizilen sahne boyutu
    const listeners = [];

    stage.style.aspectRatio = String(aspect);

    /* ---- Çizim ---- */
    function sizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const w = stage.clientWidth || 320;
      const h = w / aspect;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      view = { w, h };
      return view;
    }

    // Görseli çerçeveyi dolduracak şekilde ölçekler (cover)
    function baseScale(w, h) {
      return Math.max(w / img.naturalWidth, h / img.naturalHeight);
    }

    // Boşluk kalmasın diye kaydırmayı sınırlar
    function clampOffset(w, h) {
      const s = baseScale(w, h) * zoom;
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      const maxX = Math.max(0, (dw - w) / 2);
      const maxY = Math.max(0, (dh - h) / 2);
      offset.x = Math.min(maxX, Math.max(-maxX, offset.x));
      offset.y = Math.min(maxY, Math.max(-maxY, offset.y));
    }

    function draw() {
      const { w, h } = sizeCanvas();
      ctx.clearRect(0, 0, w, h);
      if (!img) return;
      clampOffset(w, h);
      const s = baseScale(w, h) * zoom;
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, (w - dw) / 2 + offset.x, (h - dh) / 2 + offset.y, dw, dh);
      emit();
    }

    /* ---- Etkileşim ---- */
    function onPointerDown(e) {
      if (!img) return;
      drag = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("is-dragging");
    }
    function onPointerMove(e) {
      if (!drag) return;
      offset.x = drag.ox + (e.clientX - drag.x);
      offset.y = drag.oy + (e.clientY - drag.y);
      draw();
    }
    function onPointerUp(e) {
      if (!drag) return;
      drag = null;
      stage.classList.remove("is-dragging");
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch {}
    }
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);

    stage.addEventListener(
      "wheel",
      (e) => {
        if (!img) return;
        e.preventDefault();
        setZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
      },
      { passive: false }
    );

    zoomInput.addEventListener("input", () => setZoom(parseFloat(zoomInput.value)));
    container.querySelector("[data-reset]").addEventListener("click", reset);

    const ro = new ResizeObserver(() => draw());
    ro.observe(stage);

    function setZoom(z) {
      zoom = Math.min(4, Math.max(1, z));
      zoomInput.value = String(zoom);
      draw();
    }
    function reset() {
      zoom = 1;
      offset = { x: 0, y: 0 };
      zoomInput.value = "1";
      draw();
    }

    /* ---- Değişiklik bildirimi (canlı önizleme için) ---- */
    let emitTimer = null;
    function emit() {
      if (listeners.length === 0) return;
      clearTimeout(emitTimer);
      emitTimer = setTimeout(async () => {
        const url = await toDataURL();
        listeners.forEach((fn) => fn(url));
      }, 120);
    }
    function onChange(fn) {
      listeners.push(fn);
    }

    /* ---- Yükleme ---- */
    function fileToDataURL(file) {
      return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = () => rej(new Error("Dosya okunamadı"));
        fr.readAsDataURL(file);
      });
    }

    async function load(src) {
      const url = typeof src === "string" ? src : await fileToDataURL(src);
      await new Promise((res, rej) => {
        const el = new Image();
        el.onload = () => {
          img = el;
          res();
        };
        el.onerror = () => rej(new Error("Görsel açılamadı"));
        el.src = url;
      });
      empty.hidden = true;
      controls.hidden = false;
      reset();
    }

    function clear() {
      img = null;
      empty.hidden = false;
      controls.hidden = true;
      reset();
      listeners.forEach((fn) => fn(null));
    }

    /* ---- Dışa aktarma ---- */
    async function toDataURL() {
      if (!img) return null;
      const outW = Math.round(aspect >= 1 ? MAX_EDGE : MAX_EDGE * aspect);
      const outH = Math.round(aspect >= 1 ? MAX_EDGE / aspect : MAX_EDGE);

      const out = document.createElement("canvas");
      out.width = outW;
      out.height = outH;
      const octx = out.getContext("2d");
      octx.imageSmoothingQuality = "high";

      // Ekrandaki yerleşimi çıktı ölçeğine taşı.
      // clientWidth yerine son çizim boyutu kullanılır: öğe gizliyken 0 döner.
      const { w, h } = view;
      const k = outW / w;
      const s = baseScale(w, h) * zoom * k;
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      octx.drawImage(
        img,
        (outW - dw) / 2 + offset.x * k,
        (outH - dh) / 2 + offset.y * k,
        dw,
        dh
      );

      // WebP belirgin şekilde daha küçük; desteklenmezse JPEG'e düşer
      const webp = out.toDataURL("image/webp", QUALITY);
      if (webp.startsWith("data:image/webp")) return webp;
      return out.toDataURL("image/jpeg", QUALITY);
    }

    function destroy() {
      ro.disconnect();
    }

    return { load, clear, reset, toDataURL, onChange, destroy, hasImage: () => !!img };
  }

  return { create };
})();
