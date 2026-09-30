/* ARCH prototype: view-only PDF viewer built on PDF.js (vendor/pdfjs, Mozilla, Apache-2.0).
   Pages are drawn from the real PDF (no page images). View-only deterrents:
     - a watermark with the viewer's name, email, date and time is drawn into every page
     - the pages blur when the window loses focus (e.g. when a snipping tool opens)
     - right-click, text selection, dragging, Ctrl+P / Ctrl+S / Ctrl+C are blocked; printing prints a notice
     - pages are drawn at screen resolution only
   No web page can fully block screenshots; the watermark makes a leaked copy traceable. */
(function () {
  var BASE = "vendor/pdfjs/";
  var DOCS = { "cidr-2025": "assets/docs/cidr-manuscript.pdf.js" }; // built-in sample documents
  var libP = null, docCache = {};

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = function () { reject(new Error("Couldn’t load " + src)); };
      document.head.appendChild(s);
    });
  }
  function lib() {
    if (libP) return libP;
    // The worker script runs on the page itself (a separate worker can't start from a file:// page)
    libP = loadScript(BASE + "pdf.min.js").then(function () { return loadScript(BASE + "pdf.worker.min.js"); }).then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = BASE + "pdf.worker.min.js";
      return window.pdfjsLib;
    });
    return libP;
  }
  function b64ToBytes(b64) {
    var bin = atob(b64), n = bin.length, out = new Uint8Array(n);
    for (var i = 0; i < n; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // source: { docId } | { fileKey } | { data: ArrayBuffer|Uint8Array }
  function bytesFor(source) {
    if (source.data) return Promise.resolve(new Uint8Array(source.data));
    if (source.docId) {
      var have = window.ARCH_DOCS && window.ARCH_DOCS[source.docId];
      return (have ? Promise.resolve() : loadScript(DOCS[source.docId])).then(function () { return b64ToBytes(window.ARCH_DOCS[source.docId]); });
    }
    if (source.fileKey) {
      return window.ARCH_FILES.get(source.fileKey).then(function (rec) {
        if (!rec) throw new Error("missing");
        return rec.blob.arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
      });
    }
    return Promise.reject(new Error("No PDF source"));
  }
  function load(source) {
    var id = source.docId ? "doc:" + source.docId : source.fileKey ? "file:" + source.fileKey : null;
    if (id && docCache[id]) return docCache[id];
    var p = Promise.all([lib(), bytesFor(source)]).then(function (r) {
      return r[0].getDocument({ data: r[1], isEvalSupported: false, disableAutoFetch: true }).promise;
    });
    if (id) { docCache[id] = p; p.catch(function () { delete docCache[id]; }); }
    return p;
  }

  // ---------- Watermark (drawn into the page pixels, so it can't be removed by editing the page)
  function stamp() {
    var u = (window.ARCH && ARCH.current && ARCH.current()) || {};
    var when = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
    return [u.name || "Guest", u.email || "", when].filter(Boolean).join("  ·  ");
  }
  function watermark(ctx, w, h, text, ratio) {
    ctx.save();
    var size = Math.max(11, Math.round(w / ratio / 34)) * ratio;
    ctx.font = "600 " + size + "px 'Source Sans 3', Arial, sans-serif";
    ctx.fillStyle = "rgba(113, 14, 29, 0.11)";
    ctx.textBaseline = "middle";
    var tw = ctx.measureText(text).width, stepX = tw + size * 3, stepY = size * 6;
    ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 6);
    var R = Math.sqrt(w * w + h * h);
    for (var y = -R, row = 0; y < R; y += stepY, row++) {
      for (var x = -R - (row % 2) * stepX / 2; x < R; x += stepX) ctx.fillText(text, x, y);
    }
    ctx.restore();
    // footer line, easy to read on a screenshot
    ctx.save();
    ctx.font = "600 " + Math.round(size * 0.8) + "px 'Source Sans 3', Arial, sans-serif";
    ctx.fillStyle = "rgba(113, 14, 29, 0.55)"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText("ARCH · View only · " + text, w / 2, h - size * 0.6);
    ctx.restore();
  }

  // Render one page into a canvas that is cssWidth wide (screen resolution only, capped at 1.5x)
  function renderPage(pdf, n, canvas, cssWidth, mark) {
    return pdf.getPage(n).then(function (page) {
      var base = page.getViewport({ scale: 1 });
      var ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      var scale = cssWidth / base.width;
      var vp = page.getViewport({ scale: scale * ratio });
      canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
      canvas.style.width = Math.floor(cssWidth) + "px";
      canvas.style.height = Math.floor(vp.height / ratio) + "px";
      var ctx = canvas.getContext("2d");
      return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
        if (mark !== false) watermark(ctx, canvas.width, canvas.height, mark || stamp(), ratio);
        page.cleanup();
      });
    });
  }

  // ---------- Deterrents
  var guards = 0;
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "arch-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("is-on"); }, 2800);
  }
  function inGuard(el) { return el && el.closest && el.closest(".pdf-guard"); }
  function shield(on) { document.documentElement.classList.toggle("pdf-shielded", on); }
  document.addEventListener("contextmenu", function (e) { if (inGuard(e.target)) { e.preventDefault(); toast("This document is view only."); } });
  document.addEventListener("dragstart", function (e) { if (inGuard(e.target)) e.preventDefault(); });
  document.addEventListener("selectstart", function (e) { if (inGuard(e.target)) e.preventDefault(); });
  document.addEventListener("keydown", function (e) {
    if (!document.querySelector(".pdf-guard")) return;
    var k = (e.key || "").toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (mod && (k === "p" || k === "s" || (k === "c" && document.querySelector(".pdf-viewer")))) {
      e.preventDefault(); toast(k === "p" ? "Printing is disabled for this document." : k === "s" ? "Saving is disabled for this document." : "Copying is disabled for this document.");
    }
  }, true);
  document.addEventListener("keyup", function (e) {
    if (e.key === "PrintScreen" && document.querySelector(".pdf-guard")) {
      shield(true); setTimeout(function () { shield(false); }, 1500);
      toast("Screenshots are discouraged. Every page carries your name and email.");
    }
  });
  window.addEventListener("blur", function () { if (document.querySelector(".pdf-guard")) shield(true); });
  window.addEventListener("focus", function () { shield(false); });
  document.addEventListener("visibilitychange", function () { if (document.hidden && document.querySelector(".pdf-guard")) shield(true); });
  window.addEventListener("beforeprint", function () { if (document.querySelector(".pdf-guard")) document.documentElement.classList.add("pdf-printing"); });
  window.addEventListener("afterprint", function () { document.documentElement.classList.remove("pdf-printing"); });

  // ---------- Inline preview (one page, e.g. the Document Detail preview)
  /* opts: { page, onReady(pdf) } — fills `box` with the rendered page */
  function preview(box, source, opts) {
    opts = opts || {};
    box.classList.add("pdf-guard", "pdf-preview");
    box.innerHTML = '<div class="pdf-loading">Loading document…</div>';
    var state = { pdf: null, page: opts.page || 1, canvas: document.createElement("canvas") };
    state.canvas.setAttribute("aria-label", opts.label || "Document page");
    state.canvas.setAttribute("role", "img");
    function draw() {
      var w = Math.max(200, box.clientWidth - (opts.inset || 0));
      return renderPage(state.pdf, state.page, state.canvas, w).then(function () {
        if (!state.canvas.parentNode) { box.innerHTML = ""; box.appendChild(state.canvas); }
      });
    }
    state.goto = function (n) { if (!state.pdf) return; state.page = Math.min(Math.max(1, n), state.pdf.numPages); return draw(); };
    return load(source).then(function (pdf) {
      state.pdf = pdf;
      return draw().then(function () {
        var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(draw, 200); });
        if (opts.onReady) opts.onReady(pdf, state);
        return state;
      });
    }).catch(function (err) {
      box.innerHTML = '<div class="pdf-loading pdf-loading--err">' + (err && err.message === "missing" ? "This file is no longer in this browser session." : "Couldn’t open the PDF.") + "</div>";
      throw err;
    });
  }

  // ---------- Full viewer (overlay)
  var viewerOpen = null;
  function openViewer(source, opts) {
    opts = opts || {};
    if (viewerOpen) viewerOpen.close();
    var last = document.activeElement;
    var v = document.createElement("div");
    v.className = "pdf-viewer pdf-guard"; v.setAttribute("role", "dialog"); v.setAttribute("aria-modal", "true"); v.setAttribute("aria-label", "Document viewer");
    v.innerHTML =
      '<div class="pdf-viewer__bar">' +
        '<p class="pdf-viewer__title"></p>' +
        '<div class="pdf-viewer__nav">' +
          '<button type="button" class="pv-btn" data-act="prev" aria-label="Previous page"><img src="assets/icon-left.svg" width="18" height="18" alt=""></button>' +
          '<label class="pv-page"><span class="visually-hidden">Page number</span><input type="text" inputmode="numeric" value="1" aria-label="Page number"> <span>of <b data-total>…</b></span></label>' +
          '<button type="button" class="pv-btn" data-act="next" aria-label="Next page"><img src="assets/icon-right.svg" width="18" height="18" alt=""></button>' +
          '<span class="pv-sep" aria-hidden="true"></span>' +
          '<button type="button" class="pv-btn" data-act="out" aria-label="Zoom out">−</button>' +
          '<span class="pv-zoom" data-zoom>100%</span>' +
          '<button type="button" class="pv-btn" data-act="in" aria-label="Zoom in">+</button>' +
        '</div>' +
        '<button type="button" class="pv-close" data-act="close" aria-label="Close viewer">&times;</button>' +
      '</div>' +
      '<p class="pdf-viewer__note">View only. Every page carries your name and email, so copies can be traced to your account.</p>' +
      '<div class="pdf-viewer__pages" tabindex="0"><div class="pdf-loading">Loading document…</div></div>' +
      '<div class="pdf-viewer__shield" aria-hidden="true"><p>Hidden while this window isn’t in focus.</p></div>';
    v.querySelector(".pdf-viewer__title").textContent = opts.title || "Document";
    document.body.appendChild(v); document.body.classList.add("modal-open");
    var pagesEl = v.querySelector(".pdf-viewer__pages"), input = v.querySelector(".pv-page input");
    var zoom = 1, pdf = null, slots = [], io = null, mark = stamp(), aspect = 1.294;

    function baseWidth() { return Math.min(pagesEl.clientWidth - 48, 900); }
    function slotWidth() { return Math.round(baseWidth() * zoom); }
    function layout() {
      var w = slotWidth();
      slots.forEach(function (s) { s.el.style.width = w + "px"; s.el.style.height = Math.round(w * s.aspect) + "px"; s.done = false; if (s.canvas) { s.canvas.remove(); s.canvas = null; } });
      v.querySelector("[data-zoom]").textContent = Math.round(zoom * 100) + "%";
      if (io) { slots.forEach(function (s) { io.unobserve(s.el); io.observe(s.el); }); }
    }
    function renderSlot(s) {
      if (s.done || s.busy) return;
      s.busy = true;
      var c = document.createElement("canvas"); c.setAttribute("role", "img"); c.setAttribute("aria-label", "Page " + s.n);
      renderPage(pdf, s.n, c, slotWidth(), mark).then(function () {
        s.busy = false; s.done = true;
        if (s.canvas) s.canvas.remove();
        s.canvas = c; s.el.appendChild(c);
      }, function () { s.busy = false; });
    }
    function drop(s) { if (s.canvas && !s.busy) { s.canvas.remove(); s.canvas = null; s.done = false; } }
    function current() {
      var top = pagesEl.scrollTop + pagesEl.clientHeight / 3, n = 1;
      for (var i = 0; i < slots.length; i++) { if (slots[i].el.offsetTop <= top) n = i + 1; else break; }
      return n;
    }
    function go(n) {
      if (!pdf) return;
      n = Math.min(Math.max(1, n), pdf.numPages);
      pagesEl.scrollTop = slots[n - 1].el.offsetTop - 16;
      input.value = n;
    }
    function close() {
      if (io) io.disconnect();
      v.remove(); document.body.classList.remove("modal-open"); viewerOpen = null;
      document.removeEventListener("keydown", onKey);
      if (last && last.focus) last.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") close();
      if (e.target === input) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(current() + 1); }
      if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(current() - 1); }
    }
    document.addEventListener("keydown", onKey);
    v.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b) return;
      var a = b.dataset.act;
      if (a === "close") close();
      if (a === "prev") go(current() - 1);
      if (a === "next") go(current() + 1);
      if (a === "in" || a === "out") {
        var at = current();
        zoom = Math.min(2, Math.max(0.5, Math.round((zoom + (a === "in" ? 0.25 : -0.25)) * 100) / 100));
        layout(); go(at);
      }
    });
    input.addEventListener("change", function () { go(parseInt(input.value, 10) || 1); });
    var st; pagesEl.addEventListener("scroll", function () { clearTimeout(st); st = setTimeout(function () { if (document.activeElement !== input) input.value = current(); }, 80); });
    var rt; window.addEventListener("resize", function onR() { if (!v.isConnected) return window.removeEventListener("resize", onR); clearTimeout(rt); rt = setTimeout(function () { var at = current(); layout(); go(at); }, 200); });

    load(source).then(function (doc) {
      pdf = doc;
      return pdf.getPage(1).then(function (p1) { var vp = p1.getViewport({ scale: 1 }); aspect = vp.height / vp.width; });
    }).then(function () {
      v.querySelector("[data-total]").textContent = pdf.numPages;
      pagesEl.innerHTML = "";
      for (var i = 1; i <= pdf.numPages; i++) {
        var el = document.createElement("div"); el.className = "pdf-slot"; el.dataset.n = i;
        pagesEl.appendChild(el); slots.push({ n: i, el: el, aspect: aspect });
      }
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var s = slots[+en.target.dataset.n - 1];
          if (en.isIntersecting) renderSlot(s); else drop(s);
        });
      }, { root: pagesEl, rootMargin: "800px 0px" });
      layout();
      pagesEl.focus();
      if (opts.page) go(opts.page);
    }).catch(function (err) {
      pagesEl.innerHTML = '<div class="pdf-loading pdf-loading--err">' + (err && err.message === "missing" ? "This file is no longer in this browser session." : "Couldn’t open the PDF.") + "</div>";
    });
    viewerOpen = { close: close, el: v };
    return viewerOpen;
  }

  // Page count without rendering (used after an upload)
  function pageCount(source) { return load(source).then(function (pdf) { return pdf.numPages; }); }

  // "PDF file" value with a View button when the real file is in this browser session
  function fileCell(label, key, title) {
    var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    return esc(label) + (key ? ' <button type="button" class="pdf-open" data-pdf-key="' + esc(key) + '" data-pdf-title="' + esc(title || label) + '">View PDF <img src="assets/icon-eye.svg" width="16" height="16" alt=""></button>'
      : ' <span class="pdf-none">(sample record, no file attached)</span>');
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-pdf-key]"); if (!b) return;
    e.preventDefault(); openViewer({ fileKey: b.dataset.pdfKey }, { title: b.dataset.pdfTitle });
  });

  window.ARCH_PDF = { fileCell: fileCell, load: load, preview: preview, open: openViewer, pageCount: pageCount, stamp: stamp };
})();
