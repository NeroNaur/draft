/* ARCH prototype: search over the repository documents (js/documents.js), plus the
   Browse Catalog hero filters and "New Studies" cards shared by every catalog page.
   Needs js/colleges.js and js/documents.js loaded first. */
(function () {
  var C = window.ARCH_COLLEGES, DOCS = window.ARCH_DOCUMENTS;
  var TYPES = ["Thesis", "Capstone Project", "Dissertation", "Faculty Research"];
  var STOP = { a: 1, an: 1, and: 1, "in": 1, of: 1, on: 1, the: 1, to: 1, "for": 1, with: 1, by: 1, at: 1, from: 1, among: 1 };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function terms(q) {
    return norm(q).split(/[^a-z0-9]+/).filter(function (t) { return t && !STOP[t]; });
  }

  // Score one document against the search terms; 0 = not a match (every term must appear somewhere)
  var FIELDS = [["title", 6], ["keywords", 4], ["authors", 4], ["department", 3], ["college", 2], ["type", 2], ["year", 2], ["abstract", 1]];
  // With `any`, a document only needs one of the terms (used when no document has them all)
  function score(doc, ts, any) {
    if (!ts.length) return 1;
    var total = 0;
    for (var i = 0; i < ts.length; i++) {
      var hit = 0;
      FIELDS.forEach(function (f) { if (norm(doc[f[0]]).indexOf(ts[i]) > -1) hit += f[1]; });
      if (!hit && !any) return 0;
      total += hit;
    }
    return total;
  }

  /* filters: { q, types:[], colleges:[], department, from, to, author, sort }
     skip: a filter name to ignore (used for the counts next to each checkbox)
     If no document has every search word, the documents with any of them are returned,
     and the list gets `partial = true`. */
  function run(f, skip) {
    var out = match(f, skip, false);
    if (!out.length && terms(f.q).length > 1) { out = match(f, skip, true); out.partial = out.length > 0; }
    return out;
  }
  function match(f, skip, any) {
    var ts = terms(f.q), author = norm(f.author).trim();
    var from = +f.from || C.firstYear, to = +f.to || C.lastYear;
    var out = [];
    DOCS.list.forEach(function (d) {
      if (skip !== "types" && f.types && f.types.length && f.types.indexOf(d.type) < 0) return;
      if (skip !== "colleges" && f.colleges && f.colleges.length && f.colleges.indexOf(d.college) < 0) return;
      if (f.department && d.department !== f.department) return;
      if (+d.year < from || +d.year > to) return;
      if (author && norm(d.authors).indexOf(author) < 0) return;
      var s = score(d, ts, any);
      if (s) out.push({ doc: d, score: s });
    });
    var sort = f.sort || (ts.length ? "relevant" : "newest");
    out.sort(function (a, b) {
      var A = a.doc, B = b.doc;
      if (sort === "relevant" && b.score !== a.score) return b.score - a.score;
      if (sort === "oldest" && A.year !== B.year) return A.year - B.year;
      if (sort === "title") return A.title.localeCompare(B.title);
      if (A.year !== B.year) return B.year - A.year;
      return A.title.localeCompare(B.title);
    });
    return out.map(function (r) { return r.doc; });
  }

  // Wrap the search terms in <mark> (text is escaped first)
  function highlight(text, q) {
    var html = esc(text), ts = terms(q).filter(function (t) { return t.length > 1; });
    if (!ts.length) return html;
    var re = new RegExp("(" + ts.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")", "gi");
    return html.replace(/(<[^>]*>)|([^<]+)/g, function (m, tag, txt) { return tag || txt.replace(re, "<mark>$1</mark>"); });
  }
  function summary(text) {
    text = String(text || "");
    if (text.length <= 220) return text;
    return text.slice(0, 220).replace(/\s+\S*$/, "") + "…";
  }

  // One document card (Browse "New Studies" and Search Results)
  function card(d, opt) {
    opt = opt || {};
    var h = opt.heading || "h3", url = DOCS.url(d.id), q = opt.q || "";
    return '<article class="card doc-card' + (opt.gold ? " doc-card--gold" : "") + '">' +
      '<div class="meta"><span class="tag">' + esc(d.type) + '</span><span>' + esc(d.year) + '</span></div>' +
      '<' + h + ' class="doc-card__title"><a href="' + url + '">' + highlight(d.title, q) + '</a></' + h + '>' +
      '<p class="doc-card__authors">' + highlight(d.authors, q) + '</p>' +
      '<p class="doc-card__college">' + esc(d.college) + ' · ' + esc(d.department) + '</p>' +
      (opt.summary ? '<p class="doc-card__summary">' + highlight(summary(d.abstract), q) + '</p>' : "") +
      '<a class="link-arrow" href="' + url + '">View details <img src="assets/icon-right.svg" width="18" height="18" alt=""></a>' +
      '</article>';
  }

  // Browse Catalog pages: fill the hero filters, "Browse by document type" counts and "New Studies"
  function initCatalog() {
    var form = document.querySelector(".hero-search");
    if (form) {
      var col = form.querySelector('select[name="college"]'), dept = form.querySelector('select[name="department"]');
      var year = form.querySelector('select[name="year"]'), type = form.querySelector('select[name="type"]');
      C.fillColleges(col, "", "All colleges");
      C.fillDepartments(dept, "", "", "All departments");
      C.fillYears(year, "", "Any year");
      type.innerHTML = "";
      type.add(new Option("All document types", ""));
      TYPES.forEach(function (t) { type.add(new Option(t, t)); });
      col.addEventListener("change", function () { C.fillDepartments(dept, col.value, dept.value, "All departments"); });
      // Choosing a department first picks its college for you
      dept.addEventListener("change", function () {
        if (dept.value && !col.value) { col.value = C.collegeOf(dept.value); C.fillDepartments(dept, col.value, dept.value, "All departments"); }
      });
      [col, dept, year, type].forEach(function (s) {
        function mark() { s.classList.toggle("has-value", !!s.value); s.title = s.options[s.selectedIndex] ? s.options[s.selectedIndex].text : ""; }
        s.addEventListener("change", mark); mark();
      });
      // Leave empty filters out of the results URL
      form.addEventListener("submit", function () {
        [col, dept, year, type].forEach(function (s) { s.disabled = !s.value; });
        setTimeout(function () { [col, dept, year, type].forEach(function (s) { s.disabled = false; }); }, 0);
      });
    }
    document.querySelectorAll("[data-type-count]").forEach(function (el) {
      var n = DOCS.list.filter(function (d) { return d.type === el.getAttribute("data-type-count"); }).length;
      el.textContent = n + (n === 1 ? " document" : " documents");
    });
    var recent = document.querySelector("[data-new-studies]");
    if (recent) recent.innerHTML = run({}).slice(0, 3).map(function (d) { return card(d); }).join("");
  }

  window.ARCH_SEARCH = { TYPES: TYPES, run: run, card: card, esc: esc, terms: terms, initCatalog: initCatalog };
})();
