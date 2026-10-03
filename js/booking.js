/*
  Unbroken Closers — booking calendar.
  People pick a session, a day and a time; the request goes to Netlify Forms ("booking")
  and you confirm by email. Set calendlyUrl in config.js to swap in a live calendar instead.
*/
(function () {
  var cfg = window.UC_CONFIG || {};
  var bk = cfg.booking || {};
  var root = document.getElementById("booking-app");
  if (!root) return;

  // Live scheduler swap
  if (cfg.calendlyUrl) {
    root.innerHTML = '<div class="panel"><iframe src="' + cfg.calendlyUrl +
      '" title="Book a time with Unbroken Closers" style="width:100%;height:760px;border:0" loading="lazy"></iframe></div>';
    return;
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
