/* ARCH prototype: instructor (authorized uploader) submissions "database" + helpers.
   Instructors submit completed Theses and Capstone Projects; a URO reviewer checks them
   before they become searchable. The 5 sample rows follow the Figma screens (C1 / F2 / C3).
   Anything submitted or resubmitted in the browser is kept in sessionStorage only. */
(function () {
  var KEY = "arch.submissions";

  // Status look-up (colours and icons from the Figma C1 cards / pills)
  var STATUS = {
    submitted: { label: "Submitted",             icon: "send",   bg: "#e4edf6", fg: "#264b73", note: "Waiting for a reviewer" },
    review:    { label: "Under Review",          icon: "clock",  bg: "#fbecc9", fg: "#7a4b00", note: "A URO reviewer is checking these" },
    returned:  { label: "Returned for Revision", icon: "undo",   bg: "#fbe3e3", fg: "#9b2226", note: "Needs changes from you" },
    approved:  { label: "Approved",              icon: "checkc", bg: "#e1f2e5", fg: "#1f6136", note: "Searchable in the repository" },
    archived:  { label: "Archived",              icon: "box",    bg: "#ece7e2", fg: "#57514b", note: "Stored in the repository" }
  };
  // Normal order; "returned" is only shown in the progress bar when it actually happened
  var STAGES = ["submitted", "review", "returned", "approved", "archived"];
  var TYPES = ["Thesis", "Capstone Project"];

  // Colleges and departments come from the shared list (js/colleges.js)
  var COLLEGES = ARCH_COLLEGES.map, collegeOf = ARCH_COLLEGES.collegeOf;

  var SEED = [
    { id: "s1", title: "Effects of Community Pantries on Household Food Security in Angeles City", type: "Thesis", submitted: "Sep 16, 2026", status: "review",
      creator: "Manalo, Patricia R.; Cruz, Daniel S.", subject: "Community pantries; Food security; Households", department: "Business Economics",
      abstract: "This thesis examines whether community pantries set up during and after the pandemic improved household food security in selected barangays of Angeles City.",
      file: "Community-Pantries-Food-Security-Thesis.pdf · 3.8 MB",
      history: [["review", "Sep 18, 2026"], ["submitted", "Sep 16, 2026", "You"]] },
    { id: "s2", title: "Mobile-Based Dengue Case Mapping for Barangay Health Workers", type: "Capstone Project", submitted: "Sep 12, 2026", status: "submitted",
      creator: "Manalo, Kristine P.; Ocampo, Paolo R.", subject: "dengue; GIS mapping; barangay health", department: "Information Technology", pages: 78,
      abstract: "A mobile application that helps barangay health workers log and visualize dengue case clusters in real time.",
      file: "Dengue-Case-Mapping-Capstone.pdf · 5.2 MB",
      history: [["submitted", "Sep 12, 2026", "You"]] },
    { id: "s3", title: "Structural Retrofitting Options for Pre-1990 School Buildings in Pampanga", type: "Thesis", submitted: "Sep 1, 2026", status: "returned",
      creator: "Villareal, Miguel A.; Santos, Kristine D.", subject: "Structural retrofitting; School buildings; Seismic safety", department: "Civil Engineering",
      abstract: "This thesis compares retrofitting options for public school buildings in Pampanga built before 1990.",
      file: "Structural-Retrofitting-Thesis.pdf · 6.1 MB",
      history: [["returned", "Sep 8, 2026", "Ana Dizon"], ["review", "Sep 3, 2026"], ["submitted", "Sep 1, 2026", "You"]],
      feedback: { by: "Ana Dizon · URO Admin", initials: "AD", date: "Sep 8, 2026",
        intro: "Thank you for your submission. Please make the changes below, then resubmit for review.",
        items: [
          "The abstract does not mention the retrofitting methods evaluated. Please add two or three sentences.",
          "Table 4 on page 52 is unreadable in the scanned copy. Please upload a clearer version.",
          "Please confirm the correct spelling of the second author’s surname (Villareal vs. Villareal-Cruz)."] } },
    { id: "s4", title: "Social Media Marketing Practices of Small Food Businesses in Angeles City", type: "Thesis", submitted: "Aug 18, 2026", status: "approved",
      creator: "Tan, Bianca L.; Mercado, John Carlo P.", subject: "Social media marketing; Food businesses; MSMEs", department: "Marketing Management",
      abstract: "This thesis describes how small food businesses in Angeles City use social media to reach customers and which practices relate to higher sales.",
      file: "Social-Media-Marketing-Food-Businesses-Thesis.pdf · 2.9 MB",
      history: [["approved", "Aug 27, 2026", "Ana Dizon"], ["review", "Aug 20, 2026"], ["submitted", "Aug 18, 2026", "You"]] },
    { id: "s5", title: "Web-Based Inventory and Order System for a Kapampangan Weaving Cooperative", type: "Capstone Project", submitted: "Aug 5, 2026", status: "archived",
      creator: "Pineda, Rhea Mae S.; Ocampo, Justin L.; Yabut, Carla D.", subject: "Inventory system; Weaving cooperative; Web application", department: "Computer Science",
      abstract: "A web-based system that helps a Kapampangan weaving cooperative track materials, finished products and customer orders.",
      file: "Weaving-Cooperative-Inventory-Capstone.pdf · 4.4 MB",
      history: [["archived", "Aug 24, 2026", "Ana Dizon"], ["approved", "Aug 14, 2026", "Ana Dizon"], ["review", "Aug 7, 2026"], ["submitted", "Aug 5, 2026", "You"]] }
  ];

  var KRISEAN = { owner: "kgtienzo@hau.edu.ph", uploader: "Krisean Tienzo", uploaderRole: "Thesis Instructor" };
  SEED.forEach(function (p) { Object.assign(p, KRISEAN); });

  // Completed research from other authorized uploaders. Only URO sees these.
  SEED.push(
    { id: "u1", title: "Chatbot-Assisted Enrollment Advising for First-Year Students", type: "Capstone Project", submitted: "Sep 21, 2026", status: "submitted",
      creator: "Aquino, Jerome B.; Sison, Patricia L.", subject: "chatbot; enrollment advising; first-year students", department: "Computer Science",
      abstract: "A web chatbot that answers common enrollment questions of first-year students and hands harder cases to an adviser.",
      file: "Enrollment-Advising-Chatbot-Capstone.pdf · 3.3 MB", owner: "jose.reyes@hau.edu.ph", uploader: "Jose Reyes", uploaderRole: "Authorized Uploader",
      history: [["submitted", "Sep 21, 2026", "Jose Reyes"]] },
    { id: "u2", title: "Recovery Strategies of Resorts in Clark After the Pandemic", type: "Thesis", submitted: "Sep 14, 2026", status: "review",
      creator: "Mendoza, Aira C.; Lim, Dominic R.", subject: "tourism recovery; resorts; Clark Freeport", department: "Tourism Management",
      abstract: "This thesis looks at how resorts in Clark rebuilt bookings after the pandemic and which strategies guests noticed most.",
      file: "Clark-Resort-Recovery-Thesis.pdf · 4.0 MB", owner: "uro.staff@hau.edu.ph", uploader: "URO Staff", uploaderRole: "University Research Office",
      history: [["review", "Sep 17, 2026", "Ana Dizon"], ["submitted", "Sep 14, 2026", "URO Staff"]] }
  );

  function readState() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || { added: [], changes: {} }; }
    catch (e) { return { added: [], changes: {} }; }
  }
  function writeState(s) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  // Every submission (URO view). Instructor pages only see their own through all().
  function everything() {
    var s = readState();
    var seed = SEED.map(function (p) { return Object.assign({}, p, s.changes[p.id] || {}); });
    return s.added.concat(seed); // newest first
  }
  function currentUser() { return (window.ARCH && ARCH.current && ARCH.current()) || {}; }
  function all() {
    var u = currentUser();
    if (u.kind === "instructor") return everything().filter(function (p) { return p.owner === u.email; });
    return everything();
  }
  function get(id) { return everything().filter(function (p) { return p.id === id; })[0]; }
  function today() { return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

  function add(p) {
    var s = readState(), u = currentUser();
    p.id = "n" + Date.now();
    p.owner = u.email; p.uploader = u.name; p.uploaderRole = u.role;
    p.submitted = today();
    p.status = "submitted";
    p.history = [["submitted", p.submitted, "You"]];
    s.added.unshift(p);
    writeState(s);
    return p;
  }

  function change(id, ch) {
    var s = readState();
    if (id.charAt(0) === "n") {
      s.added = s.added.map(function (x) { return x.id === id ? Object.assign(x, ch) : x; });
    } else {
      s.changes[id] = Object.assign(s.changes[id] || {}, ch);
    }
    writeState(s);
  }

  // Resubmit a returned submission (optionally with edited details and/or a new PDF)
  function resubmit(id, changes) {
    var p = get(id); if (!p) return;
    change(id, Object.assign({}, changes || {}, { status: "submitted", feedback: null, resubmitted: true,
      history: [["submitted", today(), "You · resubmitted"]].concat(p.history) }));
  }

  // ---- URO actions
  function startReview(id) { // opening a "Submitted" item puts it Under Review
    var p = get(id), u = currentUser(); if (!p || p.status !== "submitted") return;
    change(id, { status: "review", history: [["review", today(), u.name || "URO"]].concat(p.history) });
  }
  function approve(id, meta) {
    var p = get(id), u = currentUser(); if (!p) return;
    change(id, Object.assign({}, meta || {}, { status: "approved", feedback: null, history: [["approved", today(), u.name || "URO"]].concat(p.history) }));
  }
  function returnTo(id, items, meta) {
    var p = get(id), u = currentUser(); if (!p) return;
    var d = today();
    change(id, Object.assign({}, meta || {}, { status: "returned", history: [["returned", d, u.name || "URO"]].concat(p.history),
      feedback: { by: (u.name || "URO") + " · " + (u.role || "URO Admin"), initials: u.initials || "UR", date: d,
        intro: "Thank you for your submission. Please make the changes below, then resubmit for review.", items: items || [] } }));
  }

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function pill(status, size) {
    var st = STATUS[status] || STATUS.submitted, s = size || 16;
    return '<span class="status" style="background:' + st.bg + ';color:' + st.fg + '"><i class="ic" data-icon="' + st.icon + '" style="width:' + s + 'px;height:' + s + 'px"></i>' + st.label + "</span>";
  }

  function row(p) {
    var href = "instructor-submission.html?id=" + p.id;
    return '<div class="req-row sub-row" role="row" data-status="' + p.status + '">' +
      '<a class="req-row__doc" role="cell" href="' + href + '">' + esc(p.title) + "</a>" +
      '<span role="cell" class="sub-row__type">' + esc(p.type) + "</span>" +
      '<span role="cell" class="sub-row__date"><span class="m-label">Submitted </span>' + esc(p.submitted) + "</span>" +
      '<span role="cell" class="sub-row__status">' + pill(p.status) + "</span>" +
      '<span role="cell" class="sub-row__action"><a class="link-arrow" href="' + href + '">View <i class="ic" data-icon="right" style="width:18px;height:18px"></i></a></span>' +
      "</div>";
  }

  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "arch-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("is-on"); }, 2600);
  }

  window.ARCH_SUBMISSIONS = { STATUS: STATUS, STAGES: STAGES, TYPES: TYPES, COLLEGES: COLLEGES, collegeOf: collegeOf,
    all: all, everything: everything, get: get, add: add, resubmit: resubmit, startReview: startReview, approve: approve, returnTo: returnTo, pill: pill, row: row, esc: esc, toast: toast };
})();
