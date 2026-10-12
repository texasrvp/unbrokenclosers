/* Team Readiness Scorecard page. Scores instantly in the browser; the emailed report is built on the server. */
(function () {
  var quiz = document.getElementById("sc-quiz");
  if (!quiz || !window.UC_SCORE) return;
  var cfg = window.UC_CONFIG || {};
  var resultBox = document.getElementById("sc-result");
  var emailForm = document.getElementById("sc-email");
  var bar = document.getElementById("sc-bar");
  var status = document.getElementById("sc-status");
  var data = null, last = null, answers = [];
  var KEY = "uc_scorecard_v1";

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }
  var qs = quiz.querySelectorAll(".sc-q");

  // Restore answers in progress
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && saved.a) saved.a.forEach(function (v, i) { var r = quiz.querySelector('input[name="q' + i + '"][value="' + v + '"]'); if (r) r.checked = true; });
    if (saved && saved.size) quiz.querySelector("#sc-size").value = saved.size;
  } catch (e) {}

  function read() {
    answers = [];
    qs.forEach(function (q, i) { var c = quiz.querySelector('input[name="q' + i + '"]:checked'); answers.push(c ? +c.value : 0); });
    var done = answers.filter(Boolean).length;
    bar.style.width = (done / qs.length * 100) + "%";
    try { localStorage.setItem(KEY, JSON.stringify({ a: answers, size: quiz.querySelector("#sc-size").value })); } catch (e) {}
    return done;
  }
  quiz.addEventListener("change", function (e) {
    read();
    var q = e.target.closest(".sc-q");
    if (q) q.classList.remove("invalid");
    // Move to the next unanswered question on phones
    if (e.target.type === "radio" && q && window.matchMedia("(max-width: 760px)").matches) {
      var next = q.nextElementSibling;
      if (next && next.classList.contains("sc-q")) next.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
  read();

  fetch("data/scorecard.json").then(function (r) { return r.json(); }).then(function (d) { data = d; }).catch(function () {});

  quiz.addEventListener("submit", function (e) {
    e.preventDefault();
    var done = read();
    if (done < qs.length) {
      var first = null;
      qs.forEach(function (q, i) { if (!answers[i]) { q.classList.add("invalid"); if (!first) first = q; } });
      status.className = "form-status error";
      status.textContent = "Answer all 10 questions to see your score (" + (qs.length - done) + " left).";
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!data) { status.className = "form-status error"; status.textContent = "The scorecard didn’t finish loading. Refresh the page and try again."; return; }
    status.textContent = "";
    var size = quiz.querySelector("#sc-size").value;
    var res = window.UC_SCORE.score(data, answers);
    var rec = window.UC_SCORE.recommend(res, size);
    last = { res: res, rec: rec, size: size };
    render(res, rec);
    if (window.UC_track) window.UC_track("scorecard_complete", { score: res.pct, size: size });
  });

  function render(res, rec) {
    var rows = res.areas.map(function (a) {
      return '<li><span>' + esc(a.name) + '</span><span class="sc-meter" aria-hidden="true"><i style="width:' + (a.value * 20) + '%"></i></span><b>' + a.value + '/5</b></li>';
    }).join("");
    var pri = res.priorities.map(function (a, i) {
      return '<li><h4>' + (i + 1) + ". " + esc(a.name) + ' <small>' + a.value + '/5</small></h4><p>' + esc(a.fix) + '</p><a class="text-link" href="' + esc(a.link) + '">' + esc(a.linkText) + '</a></li>';
    }).join("");
    resultBox.innerHTML =
      '<div class="sc-result panel">' +
        '<div class="sc-score"><div class="sc-dial" style="--p:' + res.pct + '"><b>' + res.pct + '%</b></div>' +
        '<div><p class="sc-tier">' + esc(res.tier.label) + '</p><p>' + esc(res.tier.text) + '</p></div></div>' +
        '<h3>Your Top Three Priorities</h3><ol class="sc-pri">' + pri + '</ol>' +
        '<h3>Every Area</h3><ul class="sc-areas">' + rows + '</ul>' +
        '<div class="sc-rec"><h3>What LJ Would Suggest</h3><p><b>' + esc(rec.name) + '.</b> ' + esc(rec.why) + '</p>' +
        '<div class="btn-row"><a class="btn btn-stripe" href="book.html?session=team">Talk through your score</a><a class="btn btn-ghost" href="' + esc(rec.href) + '">Learn more</a></div></div>' +
        '<div class="as-tools"><button type="button" class="as-tool sc-print">Print or save as PDF</button><button type="button" class="as-tool sc-redo">Change my answers</button></div>' +
      '</div>';
    resultBox.hidden = false;
    quiz.hidden = true;
    emailForm.hidden = false;
    emailForm.querySelector('[name="score"]').value = res.pct + "% " + res.tier.label;
    emailForm.querySelector('[name="priorities"]').value = res.priorities.map(function (a) { return a.name + " " + a.value + "/5"; }).join(", ");
    emailForm.querySelector('[name="team_size"]').value = last.size;
    emailForm.querySelector('[name="answers"]').value = answers.join(",");
    resultBox.querySelector(".sc-print").addEventListener("click", function () { window.print(); });
    resultBox.querySelector(".sc-redo").addEventListener("click", function () {
      resultBox.hidden = true; emailForm.hidden = true; quiz.hidden = false;
      quiz.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    resultBox.focus();
    resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Email the report: Netlify Forms keeps a copy, the function sends the report and follow-ups
  emailForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var st = emailForm.querySelector(".form-status");
    if (!window.UC_validate(emailForm)) return;
    var btn = emailForm.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "Sending...";
    var get = function (n) { return emailForm.querySelector('[name="' + n + '"]').value; };
    var netlify = fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(emailForm)).toString() })
      .then(function (r) { return r.ok; }).catch(function () { return false; });
    var mail = cfg.emailFollowUp ? fetch("/api/nurture", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track: "manager", name: get("name"), email: get("email"), company: get("company"), phone: get("phone"), team_size: last.size, answers: answers, company_url: get("company_url"), source: "team-scorecard" })
    }).then(function (r) { return r.ok; }).catch(function () { return false; }) : Promise.resolve(false);
    Promise.all([netlify, mail]).then(function (ok) {
      btn.disabled = false; btn.textContent = "Email my report";
      if (ok[1]) {
        st.className = "form-status ok"; st.textContent = "Sent. Check your inbox for your full report.";
      } else if (ok[0]) {
        st.className = "form-status ok"; st.textContent = "Got it. LJ will email your report within one business day.";
      } else {
        st.className = "form-status error"; st.textContent = "That didn’t send. Check your connection and try again, or email " + (cfg.email || "us") + ".";
        return;
      }
      if (window.UC_track) { window.UC_track("generate_lead", { source: "scorecard", score: last.res.pct }); window.UC_track("form_submit", { form: "scorecard" }); }
      try { localStorage.removeItem(KEY); } catch (err) {}
    });
  });
})();
