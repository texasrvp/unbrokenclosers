/* Unbroken Closers — shared behavior for every page. */
(function () {
  var cfg = window.UC_CONFIG || {};

  /* ---------- Analytics (only if a GA4 ID is set) ---------- */
  window.UC_track = function (name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  };
  if (cfg.ga4Id) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4Id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.ga4Id);
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("book.html") === 0) window.UC_track("book_click", { from: location.pathname, label: a.textContent.trim() });
    else if (/^https?:/.test(href) && href.indexOf(location.host) === -1) window.UC_track("outbound_click", { url: href });
  });

  /* ---------- Announcement bar ---------- */
  var ann = cfg.announcement;
  var bar = document.getElementById("announce");
  if (bar && ann && ann.text) {
    var dismissed = false;
    try { dismissed = sessionStorage.getItem("uc_announce") === ann.text; } catch (e) {}
    if (!dismissed) {
      bar.querySelector(".announce-text").textContent = ann.text + " ";
      var link = bar.querySelector(".announce-link");
      if (ann.href && ann.linkText) { link.href = ann.href; link.textContent = ann.linkText; } else link.hidden = true;
      bar.hidden = false;
      bar.querySelector(".announce-close").addEventListener("click", function () {
        bar.hidden = true;
        try { sessionStorage.setItem("uc_announce", ann.text); } catch (e) {}
      });
    }
  }

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    };
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("open")); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); toggle.focus(); }
    });
  }

  /* ---------- Current page in nav ---------- */
  var here = location.pathname.split("/").pop() || "index.html";
  var section = document.body.getAttribute("data-section");
  document.querySelectorAll(".nav a").forEach(function (a) {
    var target = a.getAttribute("href");
    if (target === here || (section && target === section)) a.setAttribute("aria-current", "page");
  });

  /* ---------- Config-driven links ---------- */
  document.querySelectorAll("[data-link]").forEach(function (el) {
    var url = cfg[el.getAttribute("data-link")];
    if (url) {
      el.setAttribute("href", url);
      if (/^https?:/.test(url)) { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
    } else if (el.hasAttribute("data-hide-empty")) {
      el.hidden = true;
    }
  });
  document.querySelectorAll("[data-email]").forEach(function (el) {
    if (!cfg.email) return;
    el.setAttribute("href", "mailto:" + cfg.email);
    if (!el.textContent.trim()) el.textContent = cfg.email;
  });
  document.querySelectorAll("[data-phone]").forEach(function (el) {
    var li = el.closest("li");
    if (!cfg.phone) { if (li) li.hidden = true; else el.hidden = true; return; }
    el.setAttribute("href", "tel:" + cfg.phone.replace(/[^\d+]/g, ""));
    el.textContent = cfg.phone;
  });
  document.querySelectorAll("[data-social]").forEach(function (el) {
    var url = cfg.social && cfg.social[el.getAttribute("data-social")];
    var li = el.closest("li");
    if (url) { el.href = url; el.target = "_blank"; el.rel = "noopener"; }
    else if (li) li.hidden = true; else el.hidden = true;
  });
  var socialList = document.querySelector(".social-list");
  if (socialList && !socialList.querySelector("li:not([hidden])")) {
    socialList.innerHTML = '<li class="small">Videos post on YouTube and TikTok soon.</li>';
  }
  document.querySelectorAll("[data-show-if]").forEach(function (el) {
    var key = el.getAttribute("data-show-if").split(".");
    var v = cfg; key.forEach(function (k) { v = v ? v[k] : undefined; });
    el.hidden = !v;
  });
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Founding team spots ---------- */
  var spots = cfg.foundingSpots;
  document.querySelectorAll("[data-spots]").forEach(function (el) {
    if (!spots) { el.hidden = true; return; }
    var left = Math.max(0, spots.total - spots.taken);
    var meter = el.querySelector(".spots-meter");
    var label = el.querySelector(".spots-label");
    if (meter) {
      meter.innerHTML = "";
      for (var i = 0; i < spots.total; i++) {
        var seg = document.createElement("span");
        if (i < spots.taken) seg.className = "taken";
        meter.appendChild(seg);
      }
    }
    if (label) label.textContent = left > 0 ? left + " of " + spots.total + " founding spots left" : "Founding spots are full. Join the waitlist.";
  });

  /* ---------- Testimonials (only real ones from config) ---------- */
  var tWrap = document.getElementById("testimonials");
  if (tWrap) {
    var list = cfg.testimonials || [];
    if (list.length) {
      var grid = tWrap.querySelector(".quotes");
      list.forEach(function (t) {
        var fig = document.createElement("figure");
        fig.className = "quote";
        var q = document.createElement("blockquote"); q.textContent = t.quote;
        var cap = document.createElement("figcaption");
        var b = document.createElement("b"); b.textContent = t.name;
        cap.appendChild(b);
        if (t.role) { cap.appendChild(document.createElement("br")); cap.appendChild(document.createTextNode(t.role)); }
        fig.appendChild(q); fig.appendChild(cap); grid.appendChild(fig);
      });
      tWrap.hidden = false;
    }
  }

  /* ---------- Sticky mobile CTA + back to top ---------- */
  var sticky = document.getElementById("sticky-cta");
  var toTop = document.getElementById("to-top");
  var onScroll = function () {
    var y = window.scrollY;
    if (sticky) sticky.classList.toggle("show", y > 600);
    if (toTop) toTop.classList.toggle("show", y > 1200);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    var main = document.getElementById("main");
    if (main) { main.setAttribute("tabindex", "-1"); main.focus({ preventScroll: true }); }
  });

  /* ---------- Phone formatting ---------- */
  document.querySelectorAll('input[type="tel"]').forEach(function (input) {
    input.addEventListener("input", function () {
      var d = input.value.replace(/\D/g, "").slice(0, 10);
      if (d.length > 6) input.value = "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
      else if (d.length > 3) input.value = "(" + d.slice(0, 3) + ") " + d.slice(3);
      else input.value = d;
    });
  });

  /* ---------- Forms (Netlify) ---------- */
  window.UC_validate = function (form) {
    var ok = true;
    form.querySelectorAll("[required]").forEach(function (input) {
      if (input.type === "radio") return;
      var field = input.closest(".field");
      var valid = input.value.trim() !== "" && (input.type !== "email" || /.+@.+\..+/.test(input.value));
      if (field) field.classList.toggle("invalid", !valid);
      else input.setAttribute("aria-invalid", valid ? "false" : "true");
      if (!valid && ok) { input.focus(); ok = false; }
    });
    return ok;
  };

  window.UC_submitForm = function (form, status, onDone) {
    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
    var body = new URLSearchParams(new FormData(form)).toString();
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        window.UC_track("form_submit", { form: form.getAttribute("name") });
        if (onDone) { onDone(); if (btn) { btn.disabled = false; btn.textContent = label; } return; }
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

  document.querySelectorAll("form[data-reveal]").forEach(function (form) {
    var sel = form.getAttribute("data-reveal");
    var unlocked = false;
    try { unlocked = localStorage.getItem("uc_unlocked_" + sel) === "1"; } catch (e) {}
    var target = document.querySelector(sel);
    if (unlocked && target) target.hidden = false;
  });

  document.querySelectorAll("form[data-ajax]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = form.querySelector(".form-status");
      if (!window.UC_validate(form)) return;
      if (form.hasAttribute("data-inline")) {
        window.UC_submitForm(form, status, function () {
          form.reset();
          if (status) { status.className = "form-status ok"; status.textContent = form.getAttribute("data-success") || "Thanks. You're on the list."; }
          var reveal = form.getAttribute("data-reveal");
          var target = reveal && document.querySelector(reveal);
          if (target) {
            target.hidden = false;
            try { localStorage.setItem("uc_unlocked_" + reveal, "1"); } catch (e) {}
            var h = target.querySelector("h2");
            if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
          }
        });
      } else {
        window.UC_submitForm(form, status);
      }
    });
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field) field.classList.remove("invalid");
        input.removeAttribute("aria-invalid");
      });
    });
  });

  /* ---------- Focus trap helper for dialogs ---------- */
  window.UC_trapFocus = function (container) {
    function handler(e) {
      if (e.key !== "Tab") return;
      var items = container.querySelectorAll('button, a[href], iframe, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener("keydown", handler);
    return function () { container.removeEventListener("keydown", handler); };
  };

  /* ---------- Thanks page: booking details + add to calendar ---------- */
  var booked = document.getElementById("booked");
  if (booked) {
    var data = null;
    try { data = JSON.parse(sessionStorage.getItem("uc_booking") || "null"); } catch (e) {}
    if (data && data.date && data.time) {
      booked.querySelector(".booked-what").textContent = data.session;
      booked.querySelector(".booked-when").textContent = data.pretty + " at " + data.time + " Central Time";
      booked.hidden = false;
      booked.querySelector(".ics").addEventListener("click", function () {
        var m = data.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        var h = parseInt(m[1], 10) % 12 + (m[3].toUpperCase() === "PM" ? 12 : 0);
        var p = data.date.split("-");
        var pad = function (n) { return String(n).padStart(2, "0"); };
        var start = p[0] + p[1] + p[2] + "T" + pad(h) + m[2] + "00";
        var endMin = h * 60 + parseInt(m[2], 10) + (data.length || 30);
        var end = p[0] + p[1] + p[2] + "T" + pad(Math.floor(endMin / 60)) + pad(endMin % 60) + "00";
        var ics = [
          "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Unbroken Closers//Booking//EN", "BEGIN:VEVENT",
          "UID:" + Date.now() + "@unbrokenclosers.com",
          "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
          "DTSTART;TZID=America/Chicago:" + start, "DTEND;TZID=America/Chicago:" + end,
          "SUMMARY:" + data.session + " (requested) - Unbroken Closers",
          "DESCRIPTION:Requested time. LJ will confirm by email.",
          "END:VEVENT", "END:VCALENDAR"
        ].join("\r\n");
        var url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
        var a = document.createElement("a"); a.href = url; a.download = "unbroken-closers.ics";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      });
    }
  }
})();
