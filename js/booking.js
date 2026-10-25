/*
  Unbroken Closers — booking calendar.
  People pick a session, a day and a time; the request goes to Netlify Forms ("booking")
  and you confirm by email. Set calcom.username in config.js to swap in your live Cal.com calendar.
*/
(function () {
  var cfg = window.UC_CONFIG || {};
  var bk = cfg.booking || {};
  var root = document.getElementById("booking-app");
  if (!root) return;

  // Live Cal.com calendar: pick a session, then a real open time.
  // ?form=1 keeps the request form (handy if Cal.com is ever down).
  var cal = cfg.calcom || {};
  var wantForm = /[?&]form=1/.test(location.search);
  if (cal.username && !wantForm) { calMode(); return; }
  if (cfg.calendlyUrl && !wantForm) {
    root.innerHTML = '<div class="panel"><iframe src="' + cfg.calendlyUrl +
      '" title="Book a time with Unbroken Closers" style="width:100%;height:760px;border:0" loading="lazy"></iframe></div>';
    return;
  }

  function calMode() {
    var formEl = document.getElementById("booking-form");
    var types = formEl.querySelector(".session-types");
    var radios = formEl.querySelectorAll('input[name="session"]');
    var events = cal.events || {};
    var origin = cal.origin || "https://cal.com";
    var qsSession = new URLSearchParams(location.search).get("session");
    if (qsSession) { var m = formEl.querySelector('input[name="session"][value="' + qsSession + '"]'); if (m) m.checked = true; }

    var heroP = document.querySelector(".page-hero p");
    if (heroP) heroP.textContent = "Pick a session and an open time. You’ll get a confirmation and a calendar invite right away.";
    var wrap = document.createElement("div");
    wrap.className = "booking booking-cal";
    var left = document.createElement("div");
    left.className = "panel";
    left.innerHTML = '<h2>Choose a Session</h2>';
    left.appendChild(types);
    var note = document.createElement("div");
    note.className = "cal-note small";
    note.innerHTML = '<img src="img/book-cover.jpg" alt="" width="64" height="96" style="float:left;width:64px;height:auto;margin:0 0.75rem 0 0;border-radius:2px 4px 4px 2px;box-shadow:0 4px 10px rgba(0,0,0,0.2)"><p class="mb-0"><b>Free workshop?</b> You get a signed copy of LJ’s book. On site, he hands it to you; for video workshops, add your mailing address when you book.</p><div style="clear:both"></div>';
    left.appendChild(note);
    var right = document.createElement("div");
    right.className = "panel cal-panel";
    right.innerHTML = '<h2 class="cal-heading">Pick a Time</h2><div class="cal-frames"></div>' +
      '<p class="small muted cal-fallback" style="margin-top:0.75rem">Calendar not loading? <a class="text-link cal-open" target="_blank" rel="noopener" href="#">Open it in a new tab</a> or <a class="text-link" href="book.html?form=1">send a request instead</a>.</p>';
    wrap.appendChild(left); wrap.appendChild(right);
    root.innerHTML = "";
    root.appendChild(wrap);

    // Official Cal.com embed loader
    (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var c = C.Cal; var ar = arguments; if (!c.loaded) { c.ns = {}; c.q = c.q || []; d.head.appendChild(d.createElement("script")).src = A; c.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var ns = ar[1]; api.q = api.q || []; if (typeof ns === "string") { c.ns[ns] = c.ns[ns] || api; p(c.ns[ns], ar); p(c, ["initNamespace", ns]); } else p(c, ar); return; } p(c, ar); }; })(window, (cal.embedScript || "https://app.cal.com/embed/embed.js"), "init");

    var frames = right.querySelector(".cal-frames");
    var openLink = right.querySelector(".cal-open");
    var made = {};
    function show(key, label) {
      var slug = events[key] || events["default"] || "";
      var link = cal.username + (slug ? "/" + slug : "");
      openLink.href = origin.replace(/\/$/, "") + "/" + link;
      right.querySelector(".cal-heading").textContent = label ? "Pick a Time: " + label : "Pick a Time";
      Array.prototype.forEach.call(frames.children, function (f) { f.hidden = f.getAttribute("data-key") !== key; });
      if (made[key]) return;
      made[key] = true;
      var box = document.createElement("div");
      box.className = "cal-frame"; box.setAttribute("data-key", key); box.id = "cal-" + key;
      frames.appendChild(box);
      var ns = "uc" + key;
      window.Cal("init", ns, { origin: origin });
      window.Cal.ns[ns]("inline", { elementOrSelector: "#cal-" + key, calLink: link, config: { layout: "month_view", theme: "light" } });
      window.Cal.ns[ns]("ui", { hideEventTypeDetails: false, layout: "month_view", cssVarsPerTheme: { light: { "cal-brand": "#d0202a" } } });
      window.Cal.ns[ns]("on", { action: "bookingSuccessful", callback: function () {
        if (window.UC_track) { window.UC_track("booking_scheduled", { session: key }); window.UC_track("generate_lead", { source: "booking", session: key }); }
      } });
    }
    function current() {
      var r = Array.prototype.filter.call(radios, function (x) { return x.checked; })[0] || radios[0];
      return { key: r.value, label: r.getAttribute("data-label") };
    }
    radios.forEach(function (r) {
      r.addEventListener("change", function () {
        var c = current(); show(c.key, c.label);
        if (window.matchMedia("(max-width: 900px)").matches) right.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    var c0 = current(); show(c0.key, c0.label);
  }

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var form = document.getElementById("booking-form");
  var calGrid = document.getElementById("cal-grid");
  var calTitle = document.getElementById("cal-title");
  var prevBtn = document.getElementById("cal-prev");
  var nextBtn = document.getElementById("cal-next");
  var slotsEl = document.getElementById("slots");
  var hint = document.getElementById("slot-hint");
  var summary = document.getElementById("booking-summary");
  var dateInput = form.querySelector('[name="date"]');
  var timeInput = form.querySelector('[name="time"]');
  var status = form.querySelector(".form-status");

  var today = startOfDay(new Date());
  var first = addDays(today, bk.minNoticeDays || 0);
  var last = addDays(today, bk.daysAhead || 45);
  var view = new Date(first.getFullYear(), first.getMonth(), 1);
  var picked = { date: null, time: null };

  // Pre-select session from ?session=
  var qs = new URLSearchParams(location.search).get("session");
  if (qs) {
    var match = form.querySelector('input[name="session"][value="' + qs + '"]');
    if (match) match.checked = true;
  }

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function iso(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function slotsFor(d) {
    if ((bk.blockedDates || []).indexOf(iso(d)) !== -1) return [];
    return (bk.slots && bk.slots[d.getDay()]) || [];
  }
  function available(d) { return d >= first && d <= last && slotsFor(d).length > 0; }
  function pretty(d) { return DOW[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate(); }

  function renderCal() {
    calTitle.textContent = MONTHS[view.getMonth()] + " " + view.getFullYear();
    calGrid.innerHTML = "";
    DOW.forEach(function (d) {
      var el = document.createElement("div");
      el.className = "cal-dow"; el.textContent = d.charAt(0); el.setAttribute("aria-hidden", "true");
      calGrid.appendChild(el);
    });
    var startPad = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    for (var i = 0; i < startPad; i++) {
      var b = document.createElement("div"); b.className = "cal-blank"; calGrid.appendChild(b);
    }
    var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (var day = 1; day <= daysInMonth; day++) {
      (function (d) {
        var btn = document.createElement("button");
        btn.type = "button"; btn.className = "cal-day"; btn.textContent = d.getDate();
        btn.setAttribute("aria-label", pretty(d) + (available(d) ? "" : ", unavailable"));
        if (+d === +today) btn.classList.add("today");
        if (!available(d)) btn.disabled = true;
        btn.setAttribute("aria-pressed", picked.date && +picked.date === +d ? "true" : "false");
        btn.addEventListener("click", function () {
          picked.date = d; picked.time = null;
          renderCal(); renderSlots(); update();
          var firstSlot = slotsEl.querySelector(".slot");
          if (firstSlot) firstSlot.focus();
        });
        calGrid.appendChild(btn);
      })(new Date(view.getFullYear(), view.getMonth(), day));
    }
    var prevMonthEnd = new Date(view.getFullYear(), view.getMonth(), 0);
    var nextMonthStart = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    prevBtn.disabled = prevMonthEnd < first;
    nextBtn.disabled = nextMonthStart > last;
  }

  function renderSlots() {
    slotsEl.innerHTML = "";
    if (!picked.date) { hint.textContent = "Pick a day to see open times."; return; }
    hint.textContent = "Open times on " + pretty(picked.date) + ":";
    slotsFor(picked.date).forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "slot"; b.textContent = t;
      b.setAttribute("aria-pressed", picked.time === t ? "true" : "false");
      b.addEventListener("click", function () {
        picked.time = t;
        slotsEl.querySelectorAll(".slot").forEach(function (x) { x.setAttribute("aria-pressed", x.textContent === t ? "true" : "false"); });
        update();
        var name = form.querySelector('[name="name"]');
        if (name && window.matchMedia("(max-width: 900px)").matches) name.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      slotsEl.appendChild(b);
    });
  }

  function sessionLabel() {
    var s = form.querySelector('input[name="session"]:checked');
    return s ? s.getAttribute("data-label") : "";
  }

  function update() {
    dateInput.value = picked.date ? iso(picked.date) : "";
    timeInput.value = picked.time || "";
    if (picked.date && picked.time) {
      summary.hidden = false;
      summary.innerHTML = "<b>" + sessionLabel() + "</b><br>" + pretty(picked.date) + " at " + picked.time + " (Central Time)";
    } else {
      summary.hidden = true;
    }
  }

  prevBtn.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
  nextBtn.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });
  form.querySelectorAll('input[name="session"]').forEach(function (r) { r.addEventListener("change", update); });

  // Signed book for workshop managers: ask for a mailing address only for video workshops
  var mailBox = document.getElementById("book-mail"), whereSel = document.getElementById("b-where");
  function toggleMail() {
    if (!mailBox || !whereSel) return;
    var s = form.querySelector('input[name="session"]:checked');
    mailBox.hidden = !(s && s.value === "workshop" && /video/i.test(whereSel.value));
  }
  form.querySelectorAll('input[name="session"]').forEach(function (r) { r.addEventListener("change", toggleMail); });
  if (whereSel) whereSel.addEventListener("change", toggleMail);
  toggleMail();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = ""; status.className = "form-status";
    if (!picked.date || !picked.time) {
      status.className = "form-status error";
      status.textContent = "Pick a day and a time on the calendar first.";
      calGrid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!window.UC_validate(form)) return;
    form.querySelector('[name="session_label"]').value = sessionLabel();
    var sessionVal = (form.querySelector('input[name="session"]:checked') || {}).value;
    try {
      sessionStorage.setItem("uc_booking", JSON.stringify({
        session: sessionLabel(), date: iso(picked.date), time: picked.time, pretty: pretty(picked.date),
        length: (bk.lengths && bk.lengths[sessionVal]) || 30
      }));
    } catch (err) {}
    window.UC_submitForm(form, status);
  });
  form.querySelectorAll(".field input, .field select, .field textarea").forEach(function (input) {
    input.addEventListener("input", function () { var f = input.closest(".field"); if (f) f.classList.remove("invalid"); });
  });

  // Quick picks: the next three open times
  var qp = document.getElementById("quick-picks");
  if (qp) {
    var row = qp.querySelector(".quick-row"), found = 0;
    for (var d = new Date(first); d <= last && found < 3; d = addDays(d, 1)) {
      var times = available(d) ? slotsFor(d) : [];
      for (var t = 0; t < Math.min(1, times.length) && found < 3; t++) {
        (function (day, time) {
          var b = document.createElement("button");
          b.type = "button"; b.className = "slot quick";
          b.textContent = DOW[day.getDay()] + " " + (day.getMonth() + 1) + "/" + day.getDate() + ", " + time;
          b.addEventListener("click", function () {
            picked.date = day; picked.time = time;
            view = new Date(day.getFullYear(), day.getMonth(), 1);
            renderCal(); renderSlots();
            slotsEl.querySelectorAll(".slot").forEach(function (x) { x.setAttribute("aria-pressed", x.textContent === time ? "true" : "false"); });
            update();
            var name = form.querySelector('[name="name"]'); if (name) name.focus();
          });
          row.appendChild(b);
        })(new Date(d), times[t]);
        found++;
      }
      if (found >= 3) break;
    }
    qp.hidden = found === 0;
  }

  renderCal(); renderSlots(); update();
})();
