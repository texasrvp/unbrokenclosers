/* Unbroken Closers — "What one more deal is worth" calculator.
   Drop <div data-roi data-kind="auto"></div> inside a .section-dark section. Kinds: auto, insurance, home, media, general. */
(function () {
  var KINDS = {
    auto:      { unit: "Gross profit per car (front + back)", value: 2500, min: 500, max: 8000, step: 100, deal: "car", reps: 10 },
    insurance: { unit: "First-year revenue per new policy", value: 900, min: 100, max: 5000, step: 50, deal: "policy", reps: 6 },
    home:      { unit: "Gross profit per job", value: 3500, min: 500, max: 20000, step: 250, deal: "job", reps: 8 },
    media:     { unit: "Yearly revenue per new advertiser", value: 6000, min: 500, max: 30000, step: 250, deal: "new advertiser", reps: 6 },
    fi:        { unit: "Back-end profit per deal", value: 1800, min: 300, max: 5000, step: 50, deal: "product sale", reps: 4 },
    general:   { unit: "Profit per sale", value: 1500, min: 100, max: 20000, step: 100, deal: "sale", reps: 8 }
  };
  var PROGRAM_MONTH = 1200;
  var money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  var n = 0;

  document.querySelectorAll("[data-roi]").forEach(function (root) {
    var k = KINDS[root.getAttribute("data-kind")] || KINDS.general;
    var id = "roi" + (++n);
    root.className += " calc roi";
    root.innerHTML =
      '<div class="calc-inputs">' +
        '<div class="range"><label for="' + id + '-reps">Salespeople on your team <output id="' + id + '-reps-v">' + k.reps + '</output></label>' +
          '<input type="range" id="' + id + '-reps" min="2" max="60" step="1" value="' + k.reps + '"></div>' +
        '<div class="range"><label for="' + id + '-val">' + k.unit + ' <output id="' + id + '-val-v"></output></label>' +
          '<input type="range" id="' + id + '-val" min="' + k.min + '" max="' + k.max + '" step="' + k.step + '" value="' + k.value + '"></div>' +
        '<div class="range"><label for="' + id + '-extra">Extra ' + k.deal + 's per rep, per month</label>' +
          '<select id="' + id + '-extra"><option value="0.5">Half a ' + k.deal + ' (one every two months)</option><option value="1" selected>One more ' + k.deal + '</option><option value="2">Two more</option></select></div>' +
      '</div>' +
      '<div class="calc-out" aria-live="polite">' +
        '<div class="calc-row"><span>Extra ' + k.deal + 's a year</span><b id="' + id + '-deals"></b></div>' +
        '<div class="calc-row"><span>Extra profit a year</span><b id="' + id + '-gain"></b></div>' +
        '<div class="calc-row"><span>Team Program for a year</span><b id="' + id + '-cost">' + money.format(PROGRAM_MONTH * 12) + '</b></div>' +
        '<div class="calc-net"><b id="' + id + '-mult"></b><span id="' + id + '-mult-label"></span></div>' +
        '<p class="fine">An estimate, not a promise. Team Program priced at $1,200 a month. It doesn’t count reps you keep, which the turnover calculator covers.</p>' +
        '<div class="btn-row" style="margin-top:0.5rem"><a class="btn btn-stripe" href="book.html?session=team">Talk through your numbers</a></div>' +
      '</div>';
    var reps = root.querySelector("#" + id + "-reps"), val = root.querySelector("#" + id + "-val"), extra = root.querySelector("#" + id + "-extra");
    function update() {
      var deals = Math.round(+reps.value * +extra.value * 12);
      var gain = deals * +val.value;
      var cost = PROGRAM_MONTH * 12;
      root.querySelector("#" + id + "-reps-v").textContent = reps.value;
      root.querySelector("#" + id + "-val-v").textContent = money.format(+val.value);
      root.querySelector("#" + id + "-deals").textContent = deals.toLocaleString("en-US");
      root.querySelector("#" + id + "-gain").textContent = money.format(gain);
      var mult = gain / cost;
      root.querySelector("#" + id + "-mult").textContent = mult >= 1 ? mult.toFixed(mult >= 10 ? 0 : 1) + "x" : money.format(cost - gain);
      root.querySelector("#" + id + "-mult-label").textContent = mult >= 1 ? "what the program costs, paid back in extra profit" : "short of covering the program on extra sales alone";
    }
    [reps, val, extra].forEach(function (el) { el.addEventListener("input", update); });
    update();
  });
})();
