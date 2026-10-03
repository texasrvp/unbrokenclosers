/* Unbroken Closers — shared behavior: nav, config-driven links, footer year. */
(function () {
  var cfg = window.UC_CONFIG || {};

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
        toggle.focus();
      }
    });
  }

  // Current page in nav
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(function (a) {
    var target = a.getAttribute("href");
    if (target === here || (here === "" && target === "index.html")) a.setAttribute("aria-current", "page");
  });

  // Config-driven links: <a data-link="softPitchUrl">
  document.querySelectorAll("[data-link]").forEach(function (el) {
    var key = el.getAttribute("data-link");
    var url = cfg[key];
    if (url) {
      el.setAttribute("href", url);
      if (/^https?:/.test(url)) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
    } else if (el.hasAttribute("data-hide-empty")) {
      el.hidden = true;
    }
  });

  // Email / phone
  document.querySelectorAll("[data-email]").forEach(function (el) {
    if (!cfg.email) return;
    el.setAttribute("href", "mailto:" + cfg.email);
    if (!el.textContent.trim()) el.textContent = cfg.email;
  });
  document.querySelectorAll("[data-phone]").forEach(function (el) {
    if (!cfg.phone) { el.closest("li") ? (el.closest("li").hidden = true) : (el.hidden = true); return; }
    el.setAttribute("href", "tel:" + cfg.phone.replace(/[^\d+]/g, ""));
    el.textContent = cfg.phone;
  });

  // Social links
  document.querySelectorAll("[data-social]").forEach(function (el) {
    var url = cfg.social && cfg.social[el.getAttribute("data-social")];
    var li = el.closest("li");
    if (url) { el.href = url; el.target = "_blank"; el.rel = "noopener"; }
    else if (li) li.hidden = true;
  });
  var socialList = document.querySelector(".social-list");
  if (socialList && !socialList.querySelector("li:not([hidden])")) {
    socialList.innerHTML = '<li class="small">Videos post on YouTube and TikTok soon.</li>';
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Simple Netlify form handler for any form with data-ajax
  document.querySelectorAll("form[data-ajax]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      var required = form.querySelectorAll("[required]");
      var ok = true;
      required.forEach(function (input) {
        var field = input.closest(".field");
        var valid = input.value.trim() !== "" && (input.type !== "email" || /.+@.+\..+/.test(input.value));
        if (field) field.classList.toggle("invalid", !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;
      window.UC_submitForm(form, status);
    });
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field) field.classList.remove("invalid");
      });
    });
  });

  window.UC_submitForm = function (form, status) {
    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
    var body = new URLSearchParams(new FormData(form)).toString();
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        location.href = form.getAttribute("action") || "thanks.html";
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        if (status) {
          status.className = "form-status error";
          status.textContent = "That didn't send. Check your connection and try again, or email " + (cfg.email || "us") + ".";
        }
      });
  };
})();
