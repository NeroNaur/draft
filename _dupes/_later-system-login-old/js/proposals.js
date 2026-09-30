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

  function readState() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || { added: [], changes: {} }; }
    catch (e) { return { added: [], changes: {} }; }
  }
  function writeState(s) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  function all() {
    var s = readState();
    var seed = SEED.map(function (p) { return Object.assign({}, p, s.changes[p.id] || {}); });
    return s.added.concat(seed); // newest first
  }
  function get(id) { return all().filter(function (p) { return p.id === id; })[0]; }

  function today() {
    return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function add(p) {
    var s = readState();
    p.id = "n" + Date.now();
    p.submitted = today();
    p.status = "submitted";
    p.history = [["submitted", p.submitted, "You"]];
    s.added.unshift(p);
    writeState(s);
    return p;
  }

  function resubmit(id, fileLabel) {
    var s = readState(), p = get(id); if (!p) return;
    var d = today();
    var change = { status: "submitted", feedback: null, resubmitted: true,
      file: fileLabel || p.file, history: [["submitted", d, "You · resubmitted"]].concat(p.history) };
    if (id.charAt(0) === "n") {
      s.added = s.added.map(function (x) { return x.id === id ? Object.assign(x, change) : x; });
    } else {
      s.changes[id] = Object.assign(s.changes[id] || {}, change);
    }
    writeState(s);
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

  window.ARCH_PROPOSALS = { STATUS: STATUS, STAGES: STAGES, all: all, get: get, add: add, resubmit: resubmit, pill: pill, row: row, esc: esc, toast: toast };
})();
