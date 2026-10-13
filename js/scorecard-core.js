/* Team Readiness Scorecard: scoring shared by the page and the email function. */
(function (root) {
  var SIZES = ["Just me", "2 to 5", "6 to 15", "16 to 30", "More than 30"];

  function score(data, answers) {
    var areas = data.areas.map(function (a, i) {
      var v = Math.max(1, Math.min(5, parseInt(answers[i], 10) || 1));
      return { key: a.key, name: a.name, value: v, fix: a.fix, link: a.link, linkText: a.linkText };
    });
    var total = areas.reduce(function (s, a) { return s + a.value; }, 0);
    var pct = Math.round(total / (areas.length * 5) * 100);
    var tier = data.tiers.filter(function (t) { return pct >= t.min; })[0] || data.tiers[data.tiers.length - 1];
    // Lowest three areas; ties keep the scorecard's order
    var priorities = areas.map(function (a, i) { return { a: a, i: i }; })
      .sort(function (x, y) { return x.a.value - y.a.value || x.i - y.i; })
      .slice(0, 3).map(function (x) { return x.a; });
    return { areas: areas, total: total, pct: pct, tier: tier, priorities: priorities };
  }

  // Which program fits, from the score and team size
  function recommend(result, teamSize) {
    var size = SIZES.indexOf(teamSize);
    if (size === 0) return { key: "circle", name: "The Closer’s Circle", why: "You’re building your own skills, so group coaching with weekly live calls fits best.", href: "programs.html#circle" };
    if (result.pct >= 80) return { key: "bootcamp", name: "A Half-Day Bootcamp plus monthly awards", why: "Your habits are strong. A bootcamp sharpens the edge, and monthly recognition keeps your best people.", href: "programs.html#bootcamp" };
    if (result.pct < 60 && size >= 2) return { key: "team", name: "The Team Program", why: "With gaps in several areas and a team this size, a monthly rhythm of training, practice, scorecards and awards is what changes things.", href: "programs.html#team" };
    return { key: "workshop", name: "Start with the free team workshop", why: "See your team work through objections live, then decide what level of coaching makes sense.", href: "workshop.html" };
  }

  var api = { score: score, recommend: recommend, SIZES: SIZES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.UC_SCORE = api;
})(this);
