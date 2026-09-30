/* ARCH prototype: header behaviour (pending badge + account dropdown). */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // Shared pages (Search Results, Document Detail) opened from the Staff & Faculty login:
    // show that account's menu and point catalog links at its own catalog.
    var user = window.ARCH && ARCH.current();
    var NAVS = {
      faculty: { home: "faculty-catalog.html", links: [["faculty-catalog.html", "Browse Repository"], ["faculty-dashboard.html", "Dashboard"], ["faculty-submit.html", "Submit Proposal"], ["faculty-proposals.html", "My Proposals"]] },
      instructor: { home: "instructor-catalog.html", links: [["instructor-catalog.html", "Browse Repository"], ["instructor-dashboard.html", "Dashboard"], ["instructor-upload.html", "Submit Completed Research"], ["instructor-submissions.html", "My Submissions"]] },
      uro: { home: "uro-catalog.html", links: [["uro-catalog.html", "Browse Repository"], ["uro-dashboard.html", "Dashboard"], ["uro-review.html", "Research Review"], ["uro-proposals.html", "Proposals"], ["uro-requests.html", "View Requests"], ["uro-users.html", "Users"]] }
    };
    var cfg = user && NAVS[user.kind];
    if (cfg) {
      var nav = document.querySelector(".main-nav");
      if (nav && nav.querySelector('a[href="catalog.html"]')) {
        nav.innerHTML = cfg.links.map(function (l, i) { return '<a href="' + l[0] + '"' + (i === 0 ? ' aria-current="page"' : "") + ">" + l[1] + "</a>"; }).join("");
      }
      document.querySelectorAll('a[href="catalog.html"]').forEach(function (a) { a.setAttribute("href", cfg.home); });
      document.querySelectorAll(".req-where").forEach(function (el) { el.hidden = true; });
    }

    // Pending view requests badge next to "My View Requests"
    function updateBadge() {
      var n = window.ARCH_REQUESTS ? ARCH_REQUESTS.pendingCount() : 0;
      document.querySelectorAll("[data-pending-count]").forEach(function (b) {
        b.textContent = n; b.hidden = !n;
        b.setAttribute("aria-label", n + " pending");
      });
    }
    updateBadge();
    document.addEventListener("arch:requests-changed", updateBadge);

    // Account dropdown
    var btn = document.querySelector(".user-menu"), menu = document.getElementById("account-menu");
    if (!btn || !menu) return;
    function setOpen(open) {
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open);
      if (open) { var first = menu.querySelector("[role=menuitem]"); if (first) first.focus(); }
    }
    btn.addEventListener("click", function (e) { e.stopPropagation(); setOpen(menu.hidden); });
    document.addEventListener("click", function (e) { if (!menu.hidden && !menu.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { setOpen(false); btn.focus(); } });

    menu.querySelector("[data-profile]").addEventListener("click", function () {
      var soon = this.querySelector(".account-menu__soon");
      soon.classList.add("is-flash");
      setTimeout(function () { soon.classList.remove("is-flash"); }, 900);
    });
  });
})();
