/* ARCH prototype: logins, session and page guard (front-end only).
   Session "kind":
     "general" - signed in through the Knimbus login (students + faculty, view only)
     "faculty"    - signed in through the Staff & Faculty (system) login as faculty
     "instructor" - signed in through the Staff & Faculty (system) login as a thesis/capstone instructor
     "uro"        - signed in through the Staff & Faculty (system) login as a University Research Office admin */
(function () {
  var KEY = "arch.session";
  var STUDENT_DOMAIN = "@student.hau.edu.ph";
  var EMPLOYEE_DOMAIN = "@hau.edu.ph";
  var HOME = { general: "catalog.html", faculty: "faculty-catalog.html", instructor: "instructor-catalog.html", uro: "uro-catalog.html" };
  var LOGIN = { general: "login.html", faculty: "system-login.html", instructor: "system-login.html", uro: "system-login.html" };
  var memory = null; // fallback if browser storage is blocked

  function save(user, remember) {
    memory = user;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(user));
      if (remember) localStorage.setItem(KEY, JSON.stringify(user)); else localStorage.removeItem(KEY);
    } catch (e) {}
  }
  function load() {
    try {
      var raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return memory;
  }
  function norm(email) { return String(email || "").trim().toLowerCase(); }
  function match(list, email, password) {
    return (list || []).filter(function (a) { return a.email.toLowerCase() === email && a.password === password; })[0];
  }

  window.ARCH = {
    home: HOME,
    current: load,

    /* Knimbus login (login.html) — Knimbus accounts only */
    login: function (email, password) {
      email = norm(email);
      if (!email.endsWith(STUDENT_DOMAIN) && !email.endsWith(EMPLOYEE_DOMAIN)) {
        return { ok: false, field: "email", message: "Please use your HAU email (@student.hau.edu.ph or @hau.edu.ph)." };
      }
      var m = match(window.ARCH_KNIMBUS_ACCOUNTS, email, password);
      if (!m) return { ok: false, field: "password", message: "Incorrect email or password." };
      var user = { kind: "general", email: m.email, name: m.name, initials: m.initials, role: m.role };
      save(user, false);
      return { ok: true, user: user, redirect: HOME.general };
    },

    /* Staff & Faculty login (system-login.html) — URO-issued system accounts only */
    systemLogin: function (email, password, remember) {
      email = norm(email);
      if (email.indexOf("@") === -1) email += EMPLOYEE_DOMAIN; // allow "j.reyes" style usernames
      var m = match(window.ARCH_SYSTEM_ACCOUNTS, email, password);
      if (!m) return { ok: false, field: "password", message: "Incorrect email or password. Use the credentials issued to you by the University Research Office." };
      if (!HOME[m.role]) {
        return { ok: false, kind: "info", field: "email", message: "Credentials accepted (" + m.label + "), but the " + m.label + " view isn\x27t available in this prototype yet." };
      }
      var user = { kind: m.role, email: m.email, name: m.name, firstName: m.firstName, initials: m.initials, role: m.label };
      save(user, remember);
      return { ok: true, user: user, redirect: HOME[m.role] };
    },

    /* Call in <head> of a protected page with the session kinds allowed there. */
    guard: function (kinds) {
      var allowed = [].concat(kinds || []);
      var user = load();
      if (!user || !user.kind) { location.replace(LOGIN[allowed[0]] || "index.html"); return; }
      if (allowed.length && allowed.indexOf(user.kind) === -1) { location.replace(HOME[user.kind] || "index.html"); return; }
      document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("[data-user-name]").forEach(function (el) { el.textContent = user.name; });
        document.querySelectorAll("[data-user-first]").forEach(function (el) { el.textContent = user.firstName || user.name; });
        document.querySelectorAll("[data-user-initials]").forEach(function (el) { el.textContent = user.initials; });
        document.querySelectorAll("[data-user-role]").forEach(function (el) { el.textContent = user.role; });
        document.querySelectorAll("[data-user-email]").forEach(function (el) { el.textContent = user.email; });
      });
    }
  };
})();
