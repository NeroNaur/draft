/* ARCH prototype: URO admin helpers — system-account list (D5), pop-ups and small utilities.
   Changes are kept in sessionStorage only. */
(function () {
  var KEY = "arch.users";
  var ROLES = ["Admin", "Authorized Uploader", "Faculty"];
  var URO = "University Research Office";

  // System accounts only (issued by URO). General users sign in through Knimbus SSO and are not listed.
  var SEED = [
    { id: "u-mv", name: "Martin Villanueva", email: "mcvillanueva@hau.edu.ph", office: URO, role: "Admin" },
    { id: "u-ad", name: "Ana Dizon", email: "ana.dizon@hau.edu.ph", office: URO, role: "Admin" },
    { id: "u-kt", name: "Krisean Tienzo", email: "kgtienzo@hau.edu.ph", office: "School of Computing", role: "Authorized Uploader" },
    { id: "u-jr", name: "Jose Reyes", email: "jose.reyes@hau.edu.ph", office: "School of Computing", role: "Authorized Uploader" },
    { id: "u-as", name: "Adrian Sarmiento", email: "apsarmiento@hau.edu.ph", office: "School of Business and Accountancy", role: "Faculty" },
    { id: "u-lf", name: "Dr. Liza Fernandez", email: "liza.fernandez@hau.edu.ph", office: "School of Business and Accountancy", role: "Faculty" },
    { id: "u-rc", name: "Dr. Ramon Castillo", email: "ramon.castillo@hau.edu.ph", office: "School of Engineering and Architecture", role: "Faculty" },
    { id: "u-gt", name: "Grace Tolentino", email: "grace.tolentino@hau.edu.ph", office: "School of Education", role: "Faculty" },
    { id: "u-to", name: "Prof. Teresa Ocampo", email: "teresa.ocampo@hau.edu.ph", office: "School of Arts and Sciences", role: "Faculty" }
  ];
  var OFFICES = [URO].concat(ARCH_COLLEGES.names);

  function readState() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || { added: [], roles: {} }; }
    catch (e) { return { added: [], roles: {} }; }
  }
  function writeState(s) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  function users() {
    var s = readState();
    return SEED.concat(s.added).map(function (u) { return Object.assign({}, u, s.roles[u.id] ? { role: s.roles[u.id] } : {}); });
  }
  function saveRoles(map) { var s = readState(); Object.keys(map).forEach(function (id) { s.roles[id] = map[id]; }); writeState(s); }
  function addUser(u) {
    var s = readState();
    u.id = "u-" + Date.now();
    s.added.push(u); writeState(s); return u;
  }
  function initials(name) {
    var parts = String(name).replace(/^(Dr\.|Prof\.|Engr\.)\s+/i, "").trim().split(/\s+/);
    return ((parts[0] || "")[0] + ((parts.length > 1 ? parts[parts.length - 1] : "")[0] || "")).toUpperCase();
  }

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function daysSince(dateStr) {
    var d = new Date(dateStr); if (isNaN(d)) return 0;
    var now = new Date(); now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((now - d) / 86400000));
  }
  function byNewest(a, b) { return new Date(b.submitted || b.date) - new Date(a.submitted || a.date); }

  // ---------- Pop-up (same look as the Request Full Access pop-up)
  var lastFocus = null, current = null;
  function closeModal() {
    if (!current) return;
    current.remove(); current = null; document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  }
  /* opts: { title, desc, doc, body (html), submitLabel, submitIcon, danger, onOpen(form), onSubmit(form) -> true closes } */
  function modal(opts) {
    closeModal();
    lastFocus = document.activeElement;
    var m = document.createElement("div");
    m.className = "modal"; m.id = "admin-modal";
    m.innerHTML = '<div class="modal__backdrop" data-close></div>' +
      '<div class="modal__dialog card" role="dialog" aria-modal="true" aria-labelledby="am-title">' +
      '<button class="modal__close" type="button" data-close aria-label="Close">&times;</button>' +
      '<h2 class="modal__title" id="am-title">' + esc(opts.title) + '</h2>' +
      (opts.desc ? '<p class="modal__desc">' + esc(opts.desc) + '</p>' : "") +
      (opts.doc ? '<div class="modal__doc"><span class="modal__doc-label">' + esc(opts.docLabel || "Document") + '</span><p>' + esc(opts.doc) + '</p></div>' : "") +
      '<form novalidate class="am-form">' + (opts.body || "") +
      '<div class="modal__actions"><button class="btn btn--outline-maroon" type="button" data-close>Cancel</button>' +
      '<button class="btn btn--maroon" type="submit">' + (opts.submitIcon ? '<i class="ic" data-icon="' + opts.submitIcon + '"></i>' : "") + esc(opts.submitLabel || "Save") + '</button></div>' +
      '</form></div>';
    document.body.appendChild(m); document.body.classList.add("modal-open"); current = m;
    m.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
    var form = m.querySelector("form");
    form.addEventListener("submit", function (e) { e.preventDefault(); if (opts.onSubmit(form)) closeModal(); });
    if (opts.onOpen) opts.onOpen(form);
    if (window.ARCH_ICONS) ARCH_ICONS.hydrate(m);
    var first = form.querySelector("input, select, textarea"); if (first) first.focus();
    return m;
  }
  document.addEventListener("keydown", function (e) {
    if (!current) return;
    if (e.key === "Escape") closeModal();
    if (e.key === "Tab") { // keep focus inside the pop-up
      var f = current.querySelectorAll("button, select, textarea, input");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* Numbered feedback comments (Return to uploader / Decline proposal).
     opts: { title, desc, doc, submitLabel, submitIcon, onSubmit(items) } */
  function commentsModal(opts) {
    function item(n) {
      return '<div class="cm-item"><span class="fb-item__num">' + n + '</span>' +
        '<textarea class="input" rows="2" aria-label="Comment ' + n + '" placeholder="What should be changed?"></textarea>' +
        (n > 1 ? '<button class="cm-remove" type="button" aria-label="Remove comment ' + n + '">&times;</button>' : "") + '</div>';
    }
    return modal({
      title: opts.title, desc: opts.desc, doc: opts.doc, submitLabel: opts.submitLabel, submitIcon: opts.submitIcon,
      body: '<div class="field"><span class="field__label">Comments *</span><div class="cm-list">' + item(1) + '</div>' +
        '<button class="text-link cm-add" type="button">+ Add another comment</button><p class="field__error cm-error"></p></div>',
      onOpen: function (form) {
        var listEl = form.querySelector(".cm-list");
        function renumber() {
          listEl.querySelectorAll(".cm-item").forEach(function (el, i) {
            el.querySelector(".fb-item__num").textContent = i + 1;
            el.querySelector("textarea").setAttribute("aria-label", "Comment " + (i + 1));
          });
        }
        form.querySelector(".cm-add").addEventListener("click", function () {
          listEl.insertAdjacentHTML("beforeend", item(listEl.children.length + 1));
          listEl.lastElementChild.querySelector("textarea").focus();
        });
        listEl.addEventListener("click", function (e) {
          var b = e.target.closest(".cm-remove"); if (!b) return;
          b.parentNode.remove(); renumber();
        });
        listEl.addEventListener("input", function () { form.querySelector(".cm-error").textContent = ""; });
      },
      onSubmit: function (form) {
        var items = [].map.call(form.querySelectorAll(".cm-list textarea"), function (t) { return t.value.trim(); }).filter(Boolean);
        if (!items.length) { form.querySelector(".cm-error").textContent = "Write at least one comment."; form.querySelector(".cm-list textarea").focus(); return false; }
        opts.onSubmit(items); return true;
      }
    });
  }

  window.ARCH_ADMIN = { ROLES: ROLES, OFFICES: OFFICES, users: users, saveRoles: saveRoles, addUser: addUser, initials: initials,
    esc: esc, daysSince: daysSince, byNewest: byNewest, modal: modal, commentsModal: commentsModal, closeModal: closeModal };
})();
