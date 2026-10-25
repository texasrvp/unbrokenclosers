/* Unbroken Closers — shared behavior for every page. */
(function () {
  var cfg = window.UC_CONFIG || {};

  /* ---------- Analytics (only if a GA4 ID is set) ---------- */
  window.UC_track = function (name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  };
  function loadAnalytics() {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4Id);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.ga4Id, { anonymize_ip: true });
  }
  if (cfg.ga4Id) {
    var consent = null;
    try { consent = localStorage.getItem("uc_consent"); } catch (e) {}
    if (consent === "yes") loadAnalytics();
    else if (consent !== "no") {
      var cb = document.createElement("div");
      cb.className = "consent";
      cb.setAttribute("role", "region");
      cb.setAttribute("aria-label", "Analytics consent");
      cb.innerHTML = '<p>We use Google Analytics to see which pages help people most. No ads, no selling your data. <a href="privacy.html">Privacy policy</a></p>' +
        '<div class="btn-row"><button type="button" class="btn btn-stripe" data-c="yes">Accept</button><button type="button" class="btn btn-ghost" data-c="no">No thanks</button></div>';
      document.body.appendChild(cb);
      cb.addEventListener("click", function (e) {
        var b = e.target.closest("[data-c]");
        if (!b) return;
        var v = b.getAttribute("data-c");
        try { localStorage.setItem("uc_consent", v); } catch (err) {}
        if (v === "yes") loadAnalytics();
        cb.remove();
      });
    }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (a.hasAttribute("data-track")) window.UC_track(a.getAttribute("data-track"), { from: location.pathname, label: a.textContent.trim() });
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
      document.body.classList.toggle("nav-open", open);
    };
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
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
  if (socialList && !socialList.querySelector("li:not([hidden])")) socialList.hidden = true;

  /* ---------- Photo of LJ (shown only if img/lj.jpg exists) ---------- */
  if (cfg.photo) {
    var probe = new Image();
    probe.onload = function () {
      document.querySelectorAll(".portrait").forEach(function (box) {
        if (box.querySelector("img")) return;
        var img = document.createElement("img");
        img.src = cfg.photo; img.alt = "Coach LJ"; img.width = 800; img.height = 1000; img.loading = "lazy";
        box.appendChild(img);
        var fb = box.querySelector("[data-photo-fallback]"); if (fb) fb.hidden = true;
      });
      document.querySelectorAll("img[data-photo]").forEach(function (img) { img.src = cfg.photo; img.hidden = false; });
    };
    probe.src = cfg.photo;
  }

  /* ---------- Videos menu link: hidden until videos are published ---------- */
  if (!cfg.showVideos) {
    document.querySelectorAll('a[href="videos.html"]').forEach(function (a) {
      var li = a.closest("li"); if (li) li.hidden = true; else a.hidden = true;
    });
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
      var valid = input.type === "checkbox" ? input.checked : (input.value.trim() !== "" && (input.type !== "email" || /.+@.+\..+/.test(input.value)));
      if (field) field.classList.toggle("invalid", !valid);
      else input.setAttribute("aria-invalid", valid ? "false" : "true");
      if (!valid && ok) { input.focus(); ok = false; }
    });
    return ok;
  };

  /* ---------- Follow-up emails (Netlify function + Resend) ---------- */
  // Forms that start the 5-email follow-up. Netlify Forms still records every signup.
  var NURTURE = { newsletter: "rep", assessment: "rep", "objection-card": "rep", fears: "rep" };
  window.UC_nurture = function (form, extra) {
    var track = NURTURE[form.getAttribute("name")];
    if (!cfg.emailFollowUp || !track) return Promise.resolve(null);
    var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value : ""; };
    var body = { track: track, email: get("email"), name: get("name"), area: get("top_key"), role: get("role"), company_url: get("company_url"), source: form.getAttribute("name") + " " + location.pathname };
    if (extra) Object.keys(extra).forEach(function (k) { body[k] = extra[k]; });
    return fetch("/api/nurture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { d.httpOk = r.ok; return d; }); })
      .catch(function () { return null; });
  };

  window.UC_submitForm = function (form, status, onDone) {
    var btn = form.querySelector('button[type="submit"]');
    var label = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
    var body = new URLSearchParams(new FormData(form)).toString();
    fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        var fname = form.getAttribute("name");
        window.UC_track("form_submit", { form: fname });
        window.UC_track("generate_lead", { source: fname, from: location.pathname });
        if (fname === "booking") {
          var sv = (form.querySelector('input[name="session"]:checked') || {}).value;
          window.UC_track("booking_request", { session: sv });
          if (sv === "workshop") window.UC_track("book_offer_claim", { from: location.pathname });
        }
        window.UC_nurture(form);
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

  /* ---------- Copy buttons ---------- */
  function copyText(text, btn) {
    var done = function () {
      var old = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = old; }, 1600);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    else fallback();
    function fallback() {
      var ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "absolute"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      ta.remove();
    }
  }
  window.UC_copy = copyText;
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy], [data-copy-url]");
    if (!b) return;
    if (b.hasAttribute("data-copy-url")) return copyText(b.getAttribute("data-copy-url"), b);
    var text = Array.prototype.map.call(document.querySelectorAll(b.getAttribute("data-copy")), function (el) { return el.textContent.trim(); }).join("\n\n");
    copyText(text, b);
  });

  /* ---------- Reading progress on articles ---------- */
  var prog = document.querySelector(".read-progress span");
  var article = document.querySelector("article.prose");
  if (prog && article) {
    var onRead = function () {
      var r = article.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var pct = total > 0 ? Math.min(100, Math.max(0, -r.top / total * 100)) : 100;
      prog.style.width = pct + "%";
    };
    window.addEventListener("scroll", onRead, { passive: true });
    onRead();
  }

  /* ---------- Events page ---------- */
  var evList = document.getElementById("events-list");
  if (evList) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var events = (cfg.events || []).filter(function (ev) { return new Date(ev.date + "T00:00:00") >= today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    if (!events.length) document.getElementById("events-empty").hidden = false;
    events.forEach(function (ev) {
      var d = new Date(ev.date + "T00:00:00");
      var card = document.createElement("article");
      card.className = "event";
      var mon = d.toLocaleString("en-US", { month: "short" });
      card.innerHTML = '<div class="event-date"><b></b><span></span></div><div class="event-body"><h2></h2><p class="event-meta"></p></div><a class="btn btn-stripe"></a>';
      card.querySelector(".event-date b").textContent = d.getDate();
      card.querySelector(".event-date span").textContent = mon;
      card.querySelector("h2").textContent = ev.title;
      card.querySelector(".event-meta").textContent = [ev.time, ev.venue, ev.city, ev.price].filter(Boolean).join(" · ");
      var a = card.querySelector("a"); a.href = ev.href || "book.html?session=bootcamp"; a.textContent = "Reserve a seat";
      evList.appendChild(card);
    });
  }

  /* ---------- Hall of Fame ---------- */
  var hof = document.getElementById("hall-of-fame");
  if (hof && (cfg.hallOfFame || []).length) {
    var grid = hof.querySelector(".hof-grid");
    cfg.hallOfFame.forEach(function (w) {
      var el = document.createElement("div"); el.className = "hof";
      var m = document.createElement("span"); m.className = "hof-month"; m.textContent = w.month;
      var n = document.createElement("b"); n.textContent = w.name;
      var c = document.createElement("span"); c.textContent = w.company || "";
      el.appendChild(m); el.appendChild(n); el.appendChild(c); grid.appendChild(el);
    });
    hof.hidden = false;
  }

  /* ---------- Referral tracking ---------- */
  var refParam = new URLSearchParams(location.search).get("ref");
  if (refParam) {
    try { localStorage.setItem("uc_ref", JSON.stringify({ ref: refParam.slice(0, 80), at: Date.now() })); } catch (e) {}
  }
  var refSaved = null;
  try {
    refSaved = JSON.parse(localStorage.getItem("uc_ref") || "null");
    if (refSaved && Date.now() - refSaved.at > 90 * 864e5) { localStorage.removeItem("uc_ref"); refSaved = null; }
  } catch (e) {}
  if (refSaved) document.querySelectorAll('input[name="referred_by"]').forEach(function (i) { i.value = refSaved.ref; });

  var refMake = document.getElementById("ref-make");
  if (refMake) {
    var refName = document.getElementById("ref-name");
    var makeLink = function () {
      var slug = refName.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!slug) { refName.setAttribute("aria-invalid", "true"); refName.focus(); return; }
      refName.removeAttribute("aria-invalid");
      var base = (cfg.siteUrl || location.origin).replace(/\/$/, "");
      document.getElementById("ref-link").textContent = base + "/?ref=" + slug;
      document.getElementById("ref-out").hidden = false;
      window.UC_track("referral_link_made");
    };
    refMake.addEventListener("click", makeLink);
    refName.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); makeLink(); } });
    document.getElementById("ref-copy").addEventListener("click", function (e) {
      copyText(document.getElementById("ref-link").textContent, e.currentTarget);
    });
  }

  /* ---------- Thanks page copy per form ---------- */
  var tTitle = document.getElementById("thanks-title");
  if (tTitle) {
    var f = new URLSearchParams(location.search).get("f");
    var copy = {
      awards: ["Quote request received.", "We'll send pricing and a digital proof within one business day. Nothing prints until you approve it."],
      nominate: ["Nomination received.", "Thank you for recognizing someone who earned it. LJ will reach out to their manager soon."],
      results: ["Thank you for sharing.", "LJ reads every one. If you checked the box to share, he\u2019ll confirm the exact wording with you before anything goes up."],
      referral: ["Thanks for the introduction.", "LJ will reach out to them within a few days and let them know you sent us. We\u2019ll keep you posted."]
    }[f];
    if (copy) {
      tTitle.textContent = copy[0];
      document.getElementById("thanks-text").textContent = copy[1];
      var bk = document.getElementById("booked"); if (bk) bk.remove();
    }
  }

  /* ---------- Sticky action bar on phones: assessment + book ---------- */
  var pageName = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "");
  if (["book", "thanks", "404"].indexOf(pageName) === -1) {
    var bar2 = document.getElementById("sticky-cta");
    if (!bar2) {
      bar2 = document.createElement("div"); bar2.className = "sticky-cta"; bar2.id = "sticky-cta";
      document.body.appendChild(bar2); document.body.classList.add("has-sticky");
    }
    var isManagerPage = /^(index|programs|dealerships|insurance|fi|workshop|home-services|advertising-sales|team-scorecard|awards|wall)$/.test(pageName);
    var second = isManagerPage
      ? '<a class="btn btn-ghost" href="team-scorecard.html" data-track="sticky_scorecard">Score my team</a>'
      : '<a class="btn btn-ghost" href="assessment.html" data-track="sticky_assessment">3-min assessment</a>';
    bar2.classList.add("sticky-two");
    bar2.innerHTML = second + '<a class="btn btn-stripe" href="book.html?session=workshop" data-track="sticky_book">Book a call</a>';
    if (!sticky) { sticky = bar2; onScroll(); }
  }

  /* ---------- More analytics: Skool joins, practice drills, downloads ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a"); if (!a) return;
    var href = a.getAttribute("href") || "";
    if (/skool\.com\/unbroken-closers[^/]*\/about/.test(href)) window.UC_track("skool_join_click", { from: location.pathname });
    else if (/skool\.com/.test(href)) window.UC_track("skool_login_click", { from: location.pathname });
    if (a.hasAttribute("data-practice")) window.UC_track("practice_click", { objection: a.getAttribute("data-practice"), from: location.pathname });
    if (/\.pdf($|\?)/.test(href)) window.UC_track("file_download", { file: href });
  });

  /* ---------- "Practice this objection" links into the Fresh Up trainer ---------- */
  window.UC_practiceUrl = function (text, industry) {
    var base = cfg.practiceUrl || "https://freshupleads.com/train";
    var q = "objection=" + encodeURIComponent(text) + (industry ? "&industry=" + encodeURIComponent(industry) : "") + "&utm_source=unbrokenclosers";
    return base + (base.indexOf("?") === -1 ? "?" : "&") + q;
  };
  document.querySelectorAll("a[data-practice]").forEach(function (a) {
    a.href = window.UC_practiceUrl(a.getAttribute("data-practice"), a.getAttribute("data-industry"));
    a.target = "_blank"; a.rel = "noopener";
  });

  /* ---------- 90-second hello video ---------- */
  var hv = cfg.helloVideo || {};
  document.querySelectorAll("[data-hello-video]").forEach(function (box) {
    var frame = box.querySelector(".hello-frame");
    if (!frame || !(hv.youtubeId || hv.vimeoId || hv.mp4)) { box.hidden = true; return; }
    box.hidden = false;
    if (hv.mp4) {
      var v = document.createElement("video");
      v.controls = true; v.preload = "none"; v.playsInline = true; v.src = hv.mp4; if (hv.poster) v.poster = hv.poster;
      v.setAttribute("aria-label", "A 90-second hello from LJ");
      v.addEventListener("play", function () { window.UC_track("video_play", { video: "hello" }); }, { once: true });
      frame.appendChild(v);
      return;
    }
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "hello-play";
    btn.setAttribute("aria-label", "Play LJ's 90-second hello video");
    if (hv.youtubeId) btn.style.backgroundImage = "url(https://i.ytimg.com/vi/" + encodeURIComponent(hv.youtubeId) + "/hqdefault.jpg)";
    else if (hv.poster) btn.style.backgroundImage = "url(" + hv.poster + ")";
    btn.innerHTML = '<span class="hello-icon" aria-hidden="true"></span>';
    btn.addEventListener("click", function () {
      var src = hv.youtubeId
        ? "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(hv.youtubeId) + "?autoplay=1&rel=0"
        : "https://player.vimeo.com/video/" + encodeURIComponent(hv.vimeoId) + "?autoplay=1";
      frame.innerHTML = '<iframe src="' + src + '" title="A 90-second hello from LJ" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      window.UC_track("video_play", { video: "hello" });
    });
    frame.appendChild(btn);
  });

  /* ---------- Credibility strip numbers (only real ones from config) ---------- */
  var cred = cfg.credentials || {};
  document.querySelectorAll("[data-cred]").forEach(function (el) {
    var v = cred[el.getAttribute("data-cred")];
    var item = el.closest("li") || el;
    if (v === null || v === undefined || v === "") { item.hidden = true; return; }
    el.textContent = typeof v === "number" ? v.toLocaleString("en-US") + (el.hasAttribute("data-plus") ? "+" : "") : v;
  });

  /* ---------- Closer of the Month Wall ---------- */
  var wall = document.getElementById("winners-wall");
  if (wall) {
    var winners = (cfg.hallOfFame || []).slice().reverse();
    var empty = document.getElementById("wall-empty");
    if (!winners.length) { if (empty) empty.hidden = false; }
    winners.forEach(function (w) {
      var card = document.createElement("article"); card.className = "winner";
      var ph = document.createElement("div"); ph.className = "winner-photo";
      if (w.photo) { var im = document.createElement("img"); im.src = w.photo; im.alt = w.name; im.loading = "lazy"; im.width = 400; im.height = 400; ph.appendChild(im); }
      else { ph.textContent = String(w.name || "?").split(" ").map(function (x) { return x.charAt(0); }).join("").slice(0, 2).toUpperCase(); ph.setAttribute("aria-hidden", "true"); }
      var body = document.createElement("div"); body.className = "winner-body";
      var mo = document.createElement("span"); mo.className = "winner-month"; mo.textContent = (w.award || "Closer of the Month") + " · " + (w.month || "");
      var nm = document.createElement("h3"); nm.textContent = w.name;
      var co = document.createElement("p"); co.className = "winner-co"; co.textContent = w.company || "";
      body.appendChild(mo); body.appendChild(nm); body.appendChild(co);
      if (w.why) { var why = document.createElement("p"); why.className = "winner-why"; why.textContent = w.why; body.appendChild(why); }
      var share = document.createElement("button"); share.type = "button"; share.className = "as-tool winner-share"; share.textContent = "Copy link to share";
      share.addEventListener("click", function () { copyText((cfg.siteUrl || location.origin) + "/wall.html#" + slugify(w.name + " " + (w.month || "")), share); });
      body.appendChild(share);
      card.id = slugify(w.name + " " + (w.month || ""));
      card.appendChild(ph); card.appendChild(body); wall.appendChild(card);
    });
  }
  function slugify(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
})();
