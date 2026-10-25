/* The Fear Finder: 14 statements, 2 per fear. Scores in the browser; the email plan is written on the server. */
(function () {
  var quiz = document.getElementById("ff-quiz");
  if (!quiz) return;
  var itemsBox = document.getElementById("ff-items");
  var status = document.getElementById("ff-status");
  var result = document.getElementById("ff-result");
  var emailForm = document.querySelector("form.ff-email");
  var SCALE = ["Not me", "Rarely", "Sometimes", "Often", "That’s me"];
  var fears = [], items = [];

  function esc(s) { var d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; }

  fetch("data/fears.json").then(function (r) { return r.json(); }).then(function (d) {
    fears = d;
    // Interleave so the two statements for one fear aren't side by side
    for (var round = 0; round < 2; round++) d.forEach(function (f, fi) { if (f.items[round]) items.push({ fear: fi, text: f.items[round] }); });
    itemsBox.innerHTML = items.map(function (it, i) {
      return '<fieldset class="sc-q"><legend><span class="sc-num">' + (i + 1) + '</span>' + esc(it.text) + '</legend><div class="sc-opts">' +
        SCALE.map(function (lbl, n) { return '<label class="sc-opt"><input type="radio" name="f' + i + '" value="' + (n + 1) + '"><span>' + esc(lbl) + '</span></label>'; }).join("") +
        '</div></fieldset>';
    }).join("");
  }).catch(function () { status.className = "form-status error"; status.textContent = "The Fear Finder didn’t load. Refresh the page to try again."; });

  quiz.addEventListener("change", function (e) { var q = e.target.closest(".sc-q"); if (q) q.classList.remove("invalid"); });

  quiz.addEventListener("submit", function (e) {
    e.preventDefault();
    var scores = fears.map(function () { return 0; }), missing = null, left = 0;
    items.forEach(function (it, i) {
      var c = quiz.querySelector('input[name="f' + i + '"]:checked');
      if (!c) { left++; var q = quiz.querySelectorAll(".sc-q")[i]; q.classList.add("invalid"); if (!missing) missing = q; }
      else scores[it.fear] += +c.value;
    });
    if (left) {
      status.className = "form-status error";
      status.textContent = "Answer all 14 to see your result (" + left + " left).";
      missing.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    status.textContent = "";
    var ranked = fears.map(function (f, i) { return { f: f, s: scores[i] }; }).sort(function (a, b) { return b.s - a.s; });
    var top = ranked[0].f, next = ranked.slice(1, 3).filter(function (x) { return x.s >= 6; });
    result.innerHTML =
      '<div class="ff-top">' +
        '<p class="lib-tag">Your top fear right now</p>' +
        '<h3>' + esc(top.name) + '</h3>' +
        '<p class="fear-says">' + esc(top.says) + '</p>' +
        '<p><b>What it does on the sales floor:</b> ' + esc(top.floor) + '</p>' +
        '<p><b>What it costs you:</b> ' + esc(top.cost) + '</p>' +
        '<div class="fear-step"><h4>Your first step this week</h4><p>' + esc(top.step) + '</p></div>' +
        (next.length ? '<p class="small muted">Also showing up: ' + next.map(function (x) { return '<a class="text-link" href="#' + x.f.slug + '">' + esc(x.f.short) + '</a>'; }).join(", ") + '.</p>' : '') +
        '<p class="ff-email-lead"><b>Want the full plan by email?</b> Coach LJ will send it, plus four short lessons this week.</p>' +
      '</div>';
    result.hidden = false; quiz.hidden = true; emailForm.hidden = false;
    emailForm.querySelector('[name="top_key"]').value = top.key;
    emailForm.querySelector('[name="top_fears"]').value = ranked.slice(0, 3).map(function (x) { return x.f.short + " " + x.s + "/10"; }).join(", ");
    result.focus(); result.scrollIntoView({ behavior: "smooth", block: "start" });
    if (window.UC_track) window.UC_track("fear_finder_complete", { top: top.slug });
  });
})();
