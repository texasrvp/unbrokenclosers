/* Unbroken Closers — turnover cost calculator. */
(function () {
  var root = document.getElementById("calc");
  if (!root) return;
  var reps = root.querySelector("#c-reps");
  var turn = root.querySelector("#c-turn");
  var cost = root.querySelector("#c-cost");
  var saved = root.querySelector("#c-saved");
  var out = {
    repsV: root.querySelector("#c-reps-v"), turnV: root.querySelector("#c-turn-v"), savedV: root.querySelector("#c-saved-v"),
    lost: root.querySelector("#c-lost"), bill: root.querySelector("#c-bill"),
    save: root.querySelector("#c-save"), net: root.querySelector("#c-net"), netLabel: root.querySelector("#c-net-label")
  };
  var PROGRAM_YEAR = 1200 * 12;
  var money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  function update() {
    var r = +reps.value, t = +turn.value, c = +cost.value, s = +saved.value;
    out.repsV.textContent = r;
    out.turnV.textContent = t + "%";
    out.savedV.textContent = s;
    var lost = Math.round(r * t / 100);
    saved.max = Math.max(1, lost);
    if (s > lost) { s = Math.max(1, lost); saved.value = s; out.savedV.textContent = s; }
    out.lost.textContent = lost;
    out.bill.textContent = money.format(lost * c);
    out.save.textContent = money.format(s * c);
    var net = s * c - PROGRAM_YEAR;
    out.net.textContent = (net < 0 ? "-" : "") + money.format(Math.abs(net));
    out.netLabel.textContent = net >= 0 ? "ahead after a year of the Team Program" : "short of covering the Team Program on retention alone";
  }
  // Prefill from a shared link: ?reps=12&turn=67&cost=10000&saved=2#calculator
  var q = new URLSearchParams(location.search);
  if (q.get("reps")) reps.value = q.get("reps");
  if (q.get("turn")) turn.value = q.get("turn");
  if (q.get("cost") && cost.querySelector('option[value="' + q.get("cost") + '"]')) cost.value = q.get("cost");
  if (q.get("saved")) saved.value = q.get("saved");
  if (q.get("reps") && location.hash !== "#calculator") document.getElementById("calculator").scrollIntoView();

  var share = root.querySelector(".calc-share");
  if (share) share.addEventListener("click", function () {
    var url = location.origin + location.pathname + "?reps=" + reps.value + "&turn=" + turn.value + "&cost=" + cost.value + "&saved=" + saved.value + "#calculator";
    if (window.UC_copy) window.UC_copy(url, share);
  });

  [reps, turn, cost, saved].forEach(function (el) { el.addEventListener("input", update); });
  update();
})();
