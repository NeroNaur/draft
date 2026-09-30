/* ARCH prototype: full-document view requests (front-end only).
   One shared list: the requester sees their own rows in My View Requests, and URO sees every
   row in the View Request Queue. Sample rows come from the Figma (E4 and D4). Anything new
   or decided in this browser tab is kept in sessionStorage, so it disappears when the tab closes. */
(function () {
  var KEY = "arch.viewRequests.v3";
  var KURT = "ktsicat1@student.hau.edu.ph";

  var SEED = [
    // Kurt's own requests (E4 · My View Requests)
    { id: "k1", docId: "weaving", title: "Traditional Kapampangan Weaving Techniques: A Documentation", email: KURT, by: "Kurt Sicat", byLabel: "Student, BSIT", date: "Sep 15, 2026", status: "pending" },
    { id: "k2", docId: "nursing", title: "Effects of Simulation-Based Learning on the Clinical Competence of Nursing Students", email: KURT, by: "Kurt Sicat", byLabel: "Student, BSIT", date: "Sep 4, 2026", status: "approved", decided: "Sep 5, 2026" },
    { id: "k3", docId: "seismic", title: "Seismic Performance of Low-Rise Reinforced Concrete Buildings in Central Luzon", email: KURT, by: "Kurt Sicat", byLabel: "Student, BSIT", date: "Aug 30, 2026", status: "denied", decided: "Sep 1, 2026",
      reason: "This request could not be verified against an active HAU account. Please submit again from your HAU email." },
    // Other requesters (D4 · View Request Queue). The Figma's 4th row asked for "Structural Retrofitting…",
    // which is still Returned for Revision in the uploader view (not in the repository), so it points to an approved thesis instead.
    { id: "q1", docId: "bsba", title: "Employability of BSBA Graduates of HAU, Batch 2023", email: "mtorres@student.hau.edu.ph", by: "Mikaela Torres", byLabel: "Student, BSBA-4", date: "Sep 15, 2026", status: "pending" },
    { id: "q2", docId: "weaving", title: "Traditional Kapampangan Weaving Techniques: A Documentation", email: "rbuenaventura@hau.edu.ph", by: "Realyn Buenaventura", byLabel: "Faculty, CAS", date: "Sep 14, 2026", status: "pending" },
    { id: "q3", docId: "ofw", title: "Financial Resilience of OFW Families in Pampanga", email: "cdizon@student.hau.edu.ph", by: "Christian Dizon", byLabel: "Student, BSA-3", date: "Sep 12, 2026", status: "pending" },
    { id: "q4", docId: "socmed", title: "Social Media Marketing Practices of Small Food Businesses in Angeles City", email: "pmanlapig@hau.edu.ph", by: "Engr. Paolo Manlapig", byLabel: "Faculty, SOE", date: "Sep 10, 2026", status: "pending" },
    { id: "q5", docId: "nursing", title: "Effects of Simulation-Based Learning on the Clinical Competence of Nursing Students", email: "areyes@student.hau.edu.ph", by: "Angel Reyes", byLabel: "Student, BSN-2", date: "Sep 4, 2026", status: "approved", decided: "Sep 6, 2026" },
    { id: "q6", docId: "seismic", title: "Seismic Performance of Low-Rise Reinforced Concrete Buildings in Central Luzon", email: "", by: "Unknown external requester", byLabel: "", date: "Aug 30, 2026", status: "denied", decided: "Sep 1, 2026",
      reason: "The requester could not be matched to an HAU account." }
  ];

  function readState() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || { added: [], changes: {} }; }
    catch (e) { return { added: [], changes: {} }; }
  }
  function writeState(s) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function today() { return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  function me() { return (window.ARCH && ARCH.current && ARCH.current()) || {}; }

  // Every request, newest first (URO)
  function everything() {
    var s = readState();
    var seed = SEED.map(function (r) { return Object.assign({}, r, s.changes[r.id] || {}); });
    return s.added.map(function (r) { return Object.assign({}, r, s.changes[r.id] || {}); }).concat(seed);
  }
  // The signed-in person's own requests
  function list() {
    var email = me().email;
    return everything().filter(function (r) { return r.email && r.email === email; });
  }
  function find(docId) { return list().filter(function (r) { return r.docId === docId; })[0]; }

  function add(req) {
    var s = readState(), u = me();
    var old = find(req.docId);
    // a new request replaces the same person's earlier request for that document
    if (old) { s.added = s.added.filter(function (r) { return r.id !== old.id; }); if (s.changes[old.id]) delete s.changes[old.id]; }
    req.id = "r" + Date.now();
    req.email = u.email; req.by = u.name; req.byLabel = u.role || "";
    req.date = today();
    req.status = "pending";
    s.added.unshift(req);
    writeState(s);
    return req;
  }

  // URO decision: "approved" or "denied" (with a reason)
  function decide(id, status, reason) {
    var s = readState();
    s.changes[id] = { status: status, decided: today(), reason: status === "denied" ? (reason || "") : "" };
    writeState(s);
    document.dispatchEvent(new Event("arch:requests-changed"));
  }

  function pendingCount() { return list().filter(function (r) { return r.status === "pending"; }).length; }
  function pendingAll() { return everything().filter(function (r) { return r.status === "pending"; }).length; }

  window.ARCH_REQUESTS = { list: list, everything: everything, find: find, add: add, decide: decide, pendingCount: pendingCount, pendingAll: pendingAll };
})();
