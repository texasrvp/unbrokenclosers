/* Unbroken Closers — "How would you handle it?" objection quiz. */
(function () {
  var root = document.getElementById("quiz");
  if (!root) return;

  var Q = [
    { buyer: "“I can get this same truck $1,500 cheaper across town.”",
      options: [
        "“Let me talk to my manager and see what we can do.”",
        "“That’s fair to check. Price aside, is this the truck you want to be driving?”",
        "“They’re probably hiding fees. Our price is better than it looks.”"
      ], best: 1,
      why: "Agree first, then separate the price from the product. If it’s the right truck, you’re negotiating a number, not starting over. Running to the manager in the first minute teaches the buyer that pushing works." },
    { buyer: "“I need to talk to my wife before I decide.”",
      options: [
        "“Smart. What do you think she’ll ask first? Let’s get you that answer now.”",
        "“This price is only good today, so you’ll want to decide now.”",
        "“No problem. Here’s my card, call me when you’re ready.”"
      ], best: 0,
      why: "Respect the decision-maker who isn’t there and bring her into the conversation. Fake urgency breaks trust, and handing over a card usually ends the deal." },
    { buyer: "“I’m just looking today.”",
      options: [
        "“Okay, let me know if you need anything.”",
        "“Great, everyone starts there. What caught your eye when you were looking online?”",
        "“We’ve got a big sale this weekend, so today’s a great day to buy.”"
      ], best: 1,
      why: "Most buyers have already shopped online. Ask about what they researched and you skip ahead to the vehicle they actually want." },
    { buyer: "“Your trade offer is way too low.”",
      options: [
        "“That’s what the market says. Nothing I can do.”",
        "“I hear you. Let’s look at the numbers together so you can see how we got there.”",
        "“I’ll bump it $500 if you sign today.”"
      ], best: 1,
      why: "Transparency beats a quick bump. Walking through the numbers together turns an argument into a shared problem, and protects your gross." },
    { buyer: "“I’ll think about it.”",
      options: [
        "“Sure. Just so I’m helpful, which part needs more thought: the vehicle, the payment or the timing?”",
        "“What’s there to think about? It’s a great deal.”",
        "“Okay, I’ll follow up with you next week.”"
      ], best: 0,
      why: "“I’ll think about it” means something is unresolved. Asking which part narrows it down to one thing you can actually solve." }
  ];

  var i = 0, score = 0, answered = false;
  var stage = root.querySelector(".quiz-stage");
  var progress = root.querySelector(".quiz-progress");

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function renderQ() {
    answered = false;
    var q = Q[i];
    progress.textContent = "Question " + (i + 1) + " of " + Q.length;
    stage.innerHTML =
      '<p class="quiz-buyer"><span>The customer says</span>' + esc(q.buyer) + "</p>" +
      '<fieldset class="quiz-options"><legend>What do you say?</legend>' +
      q.options.map(function (o, n) {
        return '<button type="button" class="quiz-opt" data-n="' + n + '"><span class="quiz-key">' + (n + 1) + "</span>" + esc(o) + "</button>";
      }).join("") + "</fieldset>" +
      '<div class="quiz-feedback" aria-live="polite"></div>';
    stage.querySelectorAll(".quiz-opt").forEach(function (b) { b.addEventListener("click", answer); });
    var first = stage.querySelector(".quiz-opt");
    if (i > 0 && first) first.focus();
  }

  function answer(e) {
    if (answered) return;
    answered = true;
    var n = +e.currentTarget.getAttribute("data-n");
    var q = Q[i];
    var right = n === q.best;
    if (right) score++;
    stage.querySelectorAll(".quiz-opt").forEach(function (b) {
      var bn = +b.getAttribute("data-n");
      b.disabled = true;
      if (bn === q.best) b.classList.add("best");
      else if (bn === n) b.classList.add("wrong");
    });
    var fb = stage.querySelector(".quiz-feedback");
    fb.innerHTML = "<p><b>" + (right ? "That’s the one." : "Close, but there’s a stronger answer.") + "</b> " + esc(q.why) + "</p>" +
      '<button type="button" class="btn btn-dark quiz-next">' + (i < Q.length - 1 ? "Next question" : "See my score") + "</button>";
    var next = fb.querySelector(".quiz-next");
    next.addEventListener("click", function () { i++; i < Q.length ? renderQ() : finish(); });
    next.focus();
  }

  function finish() {
    var rank = score === 5 ? "Unbroken Closer" : score >= 3 ? "Closer in Training" : "Rookie on the Lot";
    var msg = score === 5 ? "You handle pressure like a pro. Imagine your whole team answering like this."
      : score >= 3 ? "Solid instincts with a few gaps. Those gaps are where deals walk off the lot."
      : "Every great closer started here. These five answers alone will win you deals this week.";
    progress.textContent = "Your result";
    stage.innerHTML =
      '<div class="quiz-result"><div class="quiz-score">' + score + "/" + Q.length + "</div>" +
      "<h3>" + rank + "</h3><p>" + msg + "</p>" +
      '<div class="btn-row"><a class="btn btn-stripe" href="objection-card.html">Get the free Objection Armor Card</a>' +
      '<a class="btn btn-ghost" href="programs.html#circle">Practice with the Closer’s Circle</a>' +
      '<button type="button" class="btn btn-ghost quiz-again">Take it again</button></div>' +
      '<p style="margin-top:1rem"><button type="button" class="as-tool quiz-share">Copy my score to share</button></p></div>';
    stage.querySelector(".quiz-again").addEventListener("click", function () { i = 0; score = 0; renderQ(); });
    stage.querySelector(".quiz-share").addEventListener("click", function (e) {
      if (window.UC_copy) window.UC_copy("I scored " + score + "/5 on the Unbroken Closers objection quiz (" + rank + "). Try it: https://unbrokenclosers.com/objection-quiz.html", e.currentTarget);
    });
    if (window.UC_track) window.UC_track("quiz_complete", { score: score });
    stage.querySelector("h3").setAttribute("tabindex", "-1");
    stage.querySelector("h3").focus();
  }

  document.addEventListener("keydown", function (e) {
    if (e.target.matches("input, textarea, select")) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 3) {
      var opt = stage.querySelector('.quiz-opt[data-n="' + (n - 1) + '"]');
      if (opt && !opt.disabled) { e.preventDefault(); opt.click(); }
    } else if (e.key === "Enter") {
      var next = stage.querySelector(".quiz-next");
      if (next && document.activeElement !== next) { e.preventDefault(); next.click(); }
    }
  });

  renderQ();
})();
