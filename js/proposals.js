/* ARCH prototype: faculty proposals "database" + shared helpers for the faculty pages.
   The 6 sample proposals come from the Figma screens. Anything submitted or resubmitted
   in the browser is kept in sessionStorage, so it disappears when the tab is closed. */
(function () {
  var KEY = "arch.proposals";

  // Status look-up (colours and icons from the Figma status pills / timeline)
  var STATUS = {
    submitted: { label: "Submitted",       icon: "send",   bg: "#e4edf6", fg: "#264b73" },
    review:    { label: "For Review",      icon: "eye",    bg: "#fbecc9", fg: "#7a4b00" },
    turnitin:  { label: "For Turnitin",    icon: "file",   bg: "#ece3f7", fg: "#5b3a8a" },
    peer:      { label: "For Peer Review", icon: "users",  bg: "#dcf1f2", fg: "#0c5f66" },
    irb:       { label: "For IRB",         icon: "shield", bg: "#fce6cc", fg: "#8a4b06" },
    approved:  { label: "Approved",        icon: "checkc", bg: "#e1f2e5", fg: "#1f6136" },
    declined:  { label: "Declined",        icon: "x",      bg: "#fbe3e3", fg: "#9b2226" }
  };
  // Normal review order (Declined can happen after any stage)
  var STAGES = ["submitted", "review", "turnitin", "peer", "irb", "approved"];

  var SBA = "School of Business and Accountancy";
  var ADRIAN = { owner: "apsarmiento@hau.edu.ph", faculty: "Adrian Sarmiento", college: SBA };
  var SEED = [
    { id: "p1", title: "Effects of Digital Marketing Adoption on MSME Growth in Angeles City", submitted: "Sep 10, 2026", status: "peer",
      type: "Applied Research", department: SBA, coauthors: "None", file: "Digital-Marketing-Adoption-MSME-Proposal.pdf · 2.1 MB",
      history: [["peer", "Sep 24, 2026"], ["turnitin", "Sep 18, 2026"], ["review", "Sep 12, 2026"], ["submitted", "Sep 10, 2026", "You"]] },
    { id: "p2", title: "Community Resilience Practices Among Flood-Prone Barangays in Pampanga", submitted: "Sep 2, 2026", status: "irb",
      type: "Action Research", department: SBA, coauthors: "None", file: "Community-Resilience-Proposal.pdf · 1.6 MB",
      history: [["irb", "Sep 26, 2026"], ["peer", "Sep 19, 2026"], ["turnitin", "Sep 11, 2026"], ["review", "Sep 5, 2026"], ["submitted", "Sep 2, 2026", "You"]] },
    { id: "p3", title: "Blended Learning Readiness of Senior High School Teachers in Central Luzon", submitted: "Sep 15, 2026", status: "turnitin",
      type: "Basic Research", department: SBA, coauthors: "None", file: "Blended-Learning-Readiness-Proposal.pdf · 1.2 MB",
      history: [["turnitin", "Sep 23, 2026"], ["review", "Sep 17, 2026"], ["submitted", "Sep 15, 2026", "You"]] },
    { id: "p4", title: "Cost-Benefit Analysis of Rooftop Solar for HAU Campus Buildings", submitted: "Sep 18, 2026", status: "review",
      type: "Applied Research", department: SBA, coauthors: "None", file: "Rooftop-Solar-CBA-Proposal.pdf · 2.4 MB",
      history: [["review", "Sep 21, 2026"], ["submitted", "Sep 18, 2026", "You"]] },
    { id: "p5", title: "Consumer Trust in Online Sari-Sari Store Platforms", submitted: "Aug 20, 2026", status: "declined",
      type: "Research", department: SBA, coauthors: "None", file: "Consumer-Trust-Sari-Sari-Proposal.pdf · 1.8 MB",
      history: [["declined", "Sep 3, 2026", "Ana Dizon"], ["turnitin", "Aug 28, 2026"], ["review", "Aug 22, 2026"], ["submitted", "Aug 20, 2026", "You"]],
      feedback: { by: "Ana Dizon · URO Admin", initials: "AD", date: "Sep 3, 2026", items: [
        "The research questions overlap closely with an existing HAU study. Please clarify the distinct contribution.",
        "The proposed methodology needs a clearer sampling plan for the target MSMEs."] } },
    { id: "p6", title: "Financial Resilience of OFW Families in Pampanga", submitted: "Jul 30, 2026", status: "approved",
      type: "Basic Research", department: SBA, coauthors: "None", file: "OFW-Financial-Resilience-Proposal.pdf · 1.9 MB",
      history: [["approved", "Sep 8, 2026"], ["irb", "Aug 29, 2026"], ["peer", "Aug 19, 2026"], ["turnitin", "Aug 10, 2026"], ["review", "Aug 3, 2026"], ["submitted", "Jul 30, 2026", "You"]] }
  ];

  SEED.forEach(function (p) { Object.assign(p, ADRIAN); });

  // Other faculty's proposals (from the Figma D3 Proposal Management screen). Only URO sees these.
  var SEA = "School of Engineering and Architecture";
  var OTHERS = [
    { id: "o1", title: "Digital Literacy Programs for Senior Citizens in Angeles City", submitted: "Sep 14, 2026", status: "turnitin",
      type: "Action Research", owner: "tmocampo@hau.edu.ph", faculty: "Prof. Teresa Ocampo", college: "School of Arts and Sciences", department: "School of Arts and Sciences", coauthors: "None",
      file: "Digital-Literacy-Senior-Citizens-Proposal.pdf · 1.4 MB", history: [["turnitin", "Sep 22, 2026"], ["review", "Sep 16, 2026"], ["submitted", "Sep 14, 2026", "Faculty"]] },
    { id: "o2", title: "Water Quality Monitoring of the Abacan River Using Low-Cost Sensors", submitted: "Sep 25, 2026", status: "submitted",
      type: "Applied Research", owner: "rcastillo@hau.edu.ph", faculty: "Dr. Ramon Castillo", college: SEA, department: SEA, coauthors: "None",
      file: "Abacan-River-Water-Quality-Proposal.pdf · 2.2 MB", history: [["submitted", "Sep 25, 2026", "Faculty"]] },
    { id: "o3", title: "Reading Comprehension Interventions for Grade 4 Learners in Angeles City", submitted: "Sep 27, 2026", status: "submitted",
      type: "Action Research", owner: "gtolentino@hau.edu.ph", faculty: "Grace Tolentino", college: "School of Education", department: "School of Education", coauthors: "None",
      file: "Reading-Comprehension-Grade4-Proposal.pdf · 1.1 MB", history: [["submitted", "Sep 27, 2026", "Faculty"]] }
  ];

  function readState() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || { added: [], changes: {} }; }
    catch (e) { return { added: [], changes: {} }; }
  }
  function writeState(s) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  // Every proposal (URO view). Faculty pages only see their own through all().
  function everything() {
    var s = readState();
    var seed = SEED.concat(OTHERS).map(function (p) { return Object.assign({}, p, s.changes[p.id] || {}); });
    return s.added.concat(seed); // newest first
  }
  function currentUser() { return (window.ARCH && ARCH.current && ARCH.current()) || {}; }
  function all() {
    var u = currentUser();
    if (u.kind === "faculty") return everything().filter(function (p) { return p.owner === u.email; });
    return everything();
  }
  function get(id) { return everything().filter(function (p) { return p.id === id; })[0]; }

  function today() {
    return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function add(p) {
    var s = readState();
    var u = currentUser();
    p.id = "n" + Date.now();
    p.owner = u.email; p.faculty = u.name;
    p.college = String(p.department || "").split(" · ")[0];
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

  function resubmit(id, fileLabel, fileKey) {
    var p = get(id); if (!p) return;
    change(id, { status: "submitted", feedback: null, resubmitted: true, fileKey: fileKey || p.fileKey,
      file: fileLabel || p.file, history: [["submitted", today(), "You · resubmitted"]].concat(p.history) });
  }

  // URO updates a proposal's status. Declining needs feedback items for the faculty member.
  function setStatus(id, status, items) {
    var p = get(id); if (!p || p.status === status) return;
    var u = currentUser(), d = today();
    var ch = { status: status, history: [[status, d, u.name || "URO"]].concat(p.history) };
    if (status === "declined") {
      ch.feedback = { by: (u.name || "URO") + " · " + (u.role || "URO Admin"), initials: u.initials || "UR", date: d, items: items || [] };
    } else {
      ch.feedback = null;
    }
    change(id, ch);
  }

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function pill(status, size) {
    var st = STATUS[status] || STATUS.submitted, s = size || 16;
    return '<span class="status" style="background:' + st.bg + ';color:' + st.fg + '"><i class="ic" data-icon="' + st.icon + '" style="width:' + s + 'px;height:' + s + 'px"></i>' + st.label + "</span>";
  }

  function row(p) {
    return '<div class="req-row prop-row" role="row" data-status="' + p.status + '">' +
      '<a class="req-row__doc" role="cell" href="faculty-proposal.html?id=' + p.id + '">' + esc(p.title) + "</a>" +
      '<span role="cell"><span class="m-label">Submitted </span>' + esc(p.submitted) + "</span>" +
      '<span role="cell">' + pill(p.status) + "</span>" +
      '<span role="cell"><a class="link-arrow" href="faculty-proposal.html?id=' + p.id + '">View <i class="ic" data-icon="right" style="width:18px;height:18px"></i></a></span>' +
      "</div>";
  }

  // Small toast used by the faculty pages
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "arch-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("is-on"); }, 2600);
  }

  window.ARCH_PROPOSALS = { STATUS: STATUS, STAGES: STAGES, all: all, everything: everything, get: get, add: add, resubmit: resubmit, setStatus: setStatus, pill: pill, row: row, esc: esc, toast: toast };
})();
