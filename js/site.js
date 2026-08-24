document.documentElement.classList.add("js");
  // Current year
  document.getElementById("year").textContent = new Date().getFullYear();

  // Mobile nav toggle
  (function () {
    var btn = document.getElementById("nav-toggle");
    var nav = document.getElementById("primary-nav");
    if (!btn || !nav) return;
    // F14 parity with nav.js: Escape, outside-tap, scroll lock.
    function setOpen(o) {
      nav.classList.toggle("nav--open", o);
      btn.setAttribute("aria-expanded", o ? "true" : "false");
      btn.setAttribute("aria-label", o ? "Close menu" : "Open menu");
      document.body.style.overflow = o ? "hidden" : "";
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains("nav--open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("nav--open")) setOpen(false);
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("nav--open") && !nav.contains(e.target)
          && e.target !== btn && !btn.contains(e.target)) setOpen(false);
    });
  })();

  // Scroll reveal
  (function () {
    var els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 25% 0px" }
    );
    els.forEach(function (el) { io.observe(el); });
  })();
