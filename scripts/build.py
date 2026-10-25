#!/usr/bin/env python3
"""Builds the generated pages for unbrokenclosers.com from index.html's header and footer.

Run from the repo root:  python3 scripts/build.py
It (re)writes: team-scorecard.html, objection-library.html, objection-*.html,
home-services.html, advertising-sales.html, wall.html, results.html.
Edit the content here or in data/*.json, then run it again.
"""
import html, json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://unbrokenclosers.com"
V = "20261025b"
INDEX = (ROOT / "index.html").read_text()
HEADER = INDEX[INDEX.index('<a class="skip"'):INDEX.index('<main id="main">')]
_F = INDEX.index('<footer class="site-footer">')
FOOTER = INDEX[_F:INDEX.index('</footer>', _F) + len('</footer>')]
assert 'site-footer' in FOOTER and len(FOOTER) > 1000, 'footer not found in index.html'
LIB = json.loads((ROOT / "data/library.json").read_text())
SC = json.loads((ROOT / "data/scorecard.json").read_text())
FEARS = json.loads((ROOT / "data/fears.json").read_text())
e = html.escape

IND_NAMES = {"general": "Any industry", "auto": "Car sales", "fi": "F&I", "insurance": "Insurance", "media": "Media sales", "home": "Home services"}
VARIANT_NAMES = {"auto": "On the car lot", "insurance": "In insurance", "media": "In media sales", "fi": "In F&I", "home": "In home services"}
PRACTICE_IND = {"auto": "auto", "fi": "fi", "insurance": "insurance"}


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + '</script>'


def crumbs_ld(trail):
    return ld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + "/" + (u if u != "index.html" else "")}
        for i, (n, u) in enumerate(trail)]})


def page(name, title, desc, h1, lede, body, trail, scripts=(), extra_ld=(), section=None, hero_extra=""):
    url = SITE + "/" + name
    full_title = f"{title} | Unbroken Closers"
    crumbs = "".join(f'<li><a href="{u}">{e(n)}</a></li>' for n, u in trail[:-1]) + f'<li aria-current="page">{e(trail[-1][0])}</li>'
    head = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(full_title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:site_name" content="Unbroken Closers">
<meta property="og:title" content="{e(full_title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/img/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(full_title)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{SITE}/img/og-image.png">
<meta name="theme-color" content="#08184a">
<link rel="icon" href="img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="img/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
<link rel="alternate" type="application/rss+xml" title="Unbroken Closers Field Notes" href="feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Public+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css?v={V}">
{crumbs_ld(trail)}
{''.join(extra_ld)}
</head>
<body class="has-sticky"{f' data-section="{section}"' if section else ''}>
"""
    hero = f"""<main id="main">

<section class="page-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol>{crumbs}</ol></nav>
    <h1>{h1}</h1>
    <p>{lede}</p>{hero_extra}
  </div>
</section>
"""
    js = "\n".join([f'<script src="js/config.js?v={V}"></script>', f'<script src="js/main.js?v={V}"></script>'] + [f'<script src="js/{s}?v={V}"></script>' for s in scripts])
    out = head + HEADER + hero + body + "\n</main>\n" + FOOTER + '\n<div class="sticky-cta" id="sticky-cta"></div>\n<button class="to-top" id="to-top" type="button" aria-label="Back to top"></button>\n' + js + "\n</body>\n</html>\n"
    (ROOT / name).write_text(out)
    return name


built = []

# ---------------------------------------------------------------- Team Readiness Scorecard
qs = []
for i, a in enumerate(SC["areas"]):
    opts = "".join(
        f'<label class="sc-opt"><input type="radio" name="q{i}" value="{n + 1}" required><span>{e(lbl)}</span></label>'
        for n, lbl in enumerate(SC["scale"]))
    qs.append(f'<fieldset class="sc-q" data-i="{i}"><legend><span class="sc-num">{i + 1}</span>{e(a["q"])}</legend><div class="sc-opts">{opts}</div></fieldset>')
sizes = "".join(f"<option{' selected' if s == '6 to 15' else ''}>{s}</option>" for s in ["Just me", "2 to 5", "6 to 15", "16 to 30", "More than 30"])
body = f"""
<section class="section on-light">
  <div class="wrap sc-wrap" id="scorecard">
    <form class="sc-form panel" id="sc-quiz" novalidate>
      <div class="sc-head">
        <p class="small muted mb-0">10 questions · about 3 minutes · answer for your team as it is today</p>
        <div class="as-bar" aria-hidden="true"><span id="sc-bar"></span></div>
      </div>
      {''.join(qs)}
      <div class="field" style="max-width:320px"><label for="sc-size">How many salespeople are on your team?</label><select id="sc-size" name="team_size">{sizes}</select></div>
      <p class="form-status" id="sc-status" role="status"></p>
      <button class="btn btn-stripe" type="submit">See my team’s score</button>
    </form>

    <div id="sc-result" hidden tabindex="-1"></div>

    <form class="panel" id="sc-email" name="scorecard" method="POST" data-netlify="true" netlify-honeypot="company_url" hidden novalidate>
      <input type="hidden" name="form-name" value="scorecard">
      <input type="hidden" name="score">
      <input type="hidden" name="priorities">
      <input type="hidden" name="team_size">
      <input type="hidden" name="answers">
      <p class="hidden-field"><label>Leave this empty <input name="company_url"></label></p>
      <h2 style="font-size:var(--step-3)">Email Me the Full Report</h2>
      <p class="muted">Your score, every area, and a step-by-step fix for your three lowest, ready to forward to your GM or owner.</p>
      <div class="form-grid">
        <div class="field"><label for="sc-name">Your name</label><input id="sc-name" name="name" required autocomplete="name"><p class="err">Enter your name.</p></div>
        <div class="field"><label for="sc-mail">Email</label><input id="sc-mail" name="email" type="email" required autocomplete="email"><p class="err">Enter a valid email.</p></div>
        <div class="field"><label for="sc-co">Dealership or company</label><input id="sc-co" name="company" autocomplete="organization"></div>
        <div class="field"><label for="sc-phone">Phone (optional)</label><input id="sc-phone" name="phone" type="tel" autocomplete="tel"></div>
      </div>
      <p style="margin-top:1rem"><button class="btn btn-stripe" type="submit">Email my report</button></p>
      <p class="form-status" role="status"></p>
      <p class="small muted">We’ll also send a few short follow-ups with tools for your lowest areas. Unsubscribe any time.</p>
    </form>
  </div>
</section>
"""
built.append(page("team-scorecard.html", "Team Readiness Scorecard for Sales Managers",
     "Score your sales team on the 10 habits that keep reps and close deals. Free, 3 minutes, with a report and your top three fixes.",
     "Team Readiness Scorecard", "Ten questions about how your team really runs. Get a score, your three biggest gaps and exactly how to fix them.",
     body, [("Home", "index.html"), ("Team Readiness Scorecard", "team-scorecard.html")], scripts=["scorecard-core.js", "scorecard.js"]))

# ---------------------------------------------------------------- Objection Library
def objection_page(o, i):
    slug = "objection-" + o["slug"] + ".html"
    steps = "".join(f"<li>{e(s)}</li>" for s in o["steps"])
    variants = "".join(
        f'<div class="lib-say"><span class="lib-tag">{e(VARIANT_NAMES.get(k, k))}</span><p>{e(v)}</p></div>'
        for k, v in o.get("variants", {}).items())
    related = [x for x in LIB if x["slug"] != o["slug"]]
    related = (related[i % len(related):] + related)[:3]
    rel = "".join(f'<li><a href="objection-{x["slug"]}.html">“{e(x["objection"])}”</a></li>' for x in related)
    ind = PRACTICE_IND.get(o["industry"], "")
    body = f"""
<section class="section on-light">
  <div class="wrap lib-page">
    <article class="lib-main">
      <h2>What It Usually Means</h2>
      <p>{e(o["means"])}</p>
      <h2>What Not to Say</h2>
      <p>{e(o["avoid"])}</p>
      <h2>Handle It in Three Steps</h2>
      <ol class="lib-steps">{steps}</ol>
      <h2>Words You Can Use</h2>
      <div class="lib-say lib-say-main"><span class="lib-tag">Any industry</span><p>{e(o["say"])}</p></div>
      {variants}
      <p class="small muted">These are the words LJ uses on the floor. Make them yours: the structure matters more than the script. Thank them, ask a couple of questions, answer the real reason.</p>
    </article>
    <aside class="lib-side">
      <div class="panel lib-practice">
        <h2>Practice It Now</h2>
        <p>An AI customer says “{e(o["drill"])}” and keeps pushing until you handle it. Five minutes, scored.</p>
        <a class="btn btn-stripe" data-practice="{e(o["drill"])}"{f' data-industry="{ind}"' if ind else ''} href="https://freshupleads.com/train">Practice this objection</a>
        <p class="small muted mb-0">Opens Soft Pitch on Fresh Up. Free 7-day trial.</p>
      </div>
      <div class="panel">
        <h2>Get Every Rebuttal</h2>
        <p>The Closer’s Circle has the full Rebuttal Vault, live coaching every Tuesday and a group that practices with you.</p>
        <a class="btn btn-dark" data-link="skoolJoinUrl" href="https://www.skool.com/unbroken-closers-7322/about">Join the Closer’s Circle</a>
      </div>
      <div class="panel">
        <h2>More Objections</h2>
        <ul class="lib-related">{rel}</ul>
        <a class="text-link" href="objection-library.html">See all {len(LIB)}</a>
      </div>
    </aside>
  </div>
</section>
<section class="section section-stripe">
  <div class="wrap band">
    <h2>Want Your Whole Team Handling This?</h2>
    <a class="btn btn-dark" href="book.html?session=workshop">Book a free team workshop</a>
  </div>
</section>
"""
    art = ld({"@context": "https://schema.org", "@type": "Article", "headline": f"How to handle “{o['objection']}”",
              "description": o["means"], "author": {"@type": "Person", "name": "Coach LJ", "url": SITE + "/about.html"},
              "publisher": {"@id": SITE + "/#org"}, "mainEntityOfPage": SITE + "/" + slug, "image": SITE + "/img/og-image.png"})
    title = f"How to Handle “{o['objection'].rstrip('.')}”"
    return page(slug, title, f"What “{o['objection']}” really means, what not to say, and three steps to handle it, with words you can use and a free practice drill.",
                f"“{e(o['objection'])}”", "How to handle it, in plain words you can use today. Then practice it until it’s automatic.",
                body, [("Home", "index.html"), ("Objection Library", "objection-library.html"), (o["objection"].rstrip("."), slug)],
                extra_ld=[art], section="objection-library.html",
                hero_extra=f'<p class="lib-hero-tag">{e(IND_NAMES.get(o["industry"], "Any industry"))}</p>')


for i, o in enumerate(LIB):
    built.append(objection_page(o, i))

cards = "".join(
    f'<a class="lib-card" data-ind="{o["industry"]}" href="objection-{o["slug"]}.html"><span class="lib-tag">{e(IND_NAMES.get(o["industry"], ""))}</span><b>“{e(o["objection"])}”</b><span class="go">How to handle it</span></a>'
    for o in LIB)
filters = "".join(f'<button type="button" class="lib-filter" data-f="{k}" aria-pressed="{"true" if k == "all" else "false"}">{n}</button>'
                  for k, n in [("all", "All"), ("general", "Any industry"), ("auto", "Car sales"), ("fi", "F&I"), ("insurance", "Insurance"), ("media", "Media sales")])
body = f"""
<section class="section on-light">
  <div class="wrap">
    <div class="lib-filters" role="group" aria-label="Filter by industry">{filters}</div>
    <div class="lib-grid" id="lib-grid">{cards}</div>
    <p class="small muted" style="margin-top:1.5rem">Every page has words you can use and a free practice drill with an AI customer who won’t let you off easy.</p>
  </div>
</section>
<section class="section section-dark">
  <div class="wrap band">
    <div><h2>The Objections Customers Never Say Out Loud</h2><p class="mb-0">Some objections live inside the salesperson. The Unbroken Assessment shows which one is costing you deals.</p></div>
    <a class="btn btn-stripe" href="assessment.html">Take the free assessment</a>
  </div>
</section>
<script>
(function () {{
  var grid = document.getElementById("lib-grid");
  document.querySelectorAll(".lib-filter").forEach(function (b) {{
    b.addEventListener("click", function () {{
      var f = b.getAttribute("data-f");
      document.querySelectorAll(".lib-filter").forEach(function (x) {{ x.setAttribute("aria-pressed", x === b ? "true" : "false"); }});
      grid.querySelectorAll(".lib-card").forEach(function (c) {{ c.hidden = !(f === "all" || c.getAttribute("data-ind") === f); }});
    }});
  }});
}})();
</script>
"""
lib_ld = ld({"@context": "https://schema.org", "@type": "ItemList", "name": "Sales Objection Library",
             "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/objection-{o['slug']}.html", "name": o["objection"]} for i, o in enumerate(LIB)]})
built.append(page("objection-library.html", "Sales Objection Library: What to Say",
     f"How to handle the {len(LIB)} objections salespeople hear most, from “your price is too high” to “I need to think about it.” Words you can use and a free practice drill for each.",
     "The Objection Library", f"The {len(LIB)} objections salespeople hear most, what they really mean, and what to say. Free, with a practice drill for every one.",
     body, [("Home", "index.html"), ("Objection Library", "objection-library.html")], extra_ld=[lib_ld]))

# ---------------------------------------------------------------- Industry pages
def industry(name, title, desc, h1, lede, problem_h, problem_p, train_intro, items, kind, faq, band_h, band_p):
    lis = "".join(f"<li><strong>{e(a)}</strong><span>{e(b)}</span></li>" for a, b in items)
    faqs = "".join(f"<details><summary>{e(q)}</summary><p>{e(a)}</p></details>" for q, a in faq)
    body = f"""
<section class="section section-white on-light">
  <div class="wrap">
    <div class="section-head">
      <h2>{e(problem_h)}</h2>
      <p>{e(problem_p)}</p>
    </div>
    <div class="stats stats-2">
      <div class="stat"><div class="fig">45%</div><p>Less likely to leave: workers who get meaningful recognition for their work.</p><span class="src"><a href="https://www.gallup.com/workplace/650174/employee-recognition-low-cost-high-impact.aspx" target="_blank" rel="noopener">Gallup and Workhuman</a></span></div>
      <div class="stat"><div class="fig">2x</div><p>Live trainings a month, with AI practice between them, so skills stick instead of fading after a pep talk.</p><span class="src">The Unbroken Closers Team Program</span></div>
    </div>
  </div>
</section>

<section class="section on-light">
  <div class="wrap parts parts-light">
    <div>
      <h2>What We Train</h2>
      <p class="muted">{e(train_intro)}</p>
      <a class="btn btn-dark" href="book.html?session=workshop">Book a free workshop</a>
    </div>
    <ul class="parts-list">{lis}</ul>
  </div>
</section>

<section class="section section-dark" id="roi">
  <div class="wrap">
    <div class="section-head">
      <h2>What One More Sale Per Rep Is Worth</h2>
      <p>Move the sliders to match your team.</p>
    </div>
    <div data-roi data-kind="{kind}"></div>
  </div>
</section>

<section class="section on-light">
  <div class="wrap band">
    <div><h2>{e(band_h)}</h2><p class="mb-0">{e(band_p)}</p></div>
    <a class="btn btn-stripe" href="team-scorecard.html">Score my team</a>
  </div>
</section>

<section class="section section-white on-light">
  <div class="wrap" style="max-width:820px">
    <h2>Questions</h2>
    <div class="faq">{faqs}</div>
  </div>
</section>
"""
    faq_ld = ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]})
    svc = ld({"@context": "https://schema.org", "@type": "Service", "name": h1, "provider": {"@id": SITE + "/#org"}, "areaServed": "US", "url": SITE + "/" + name})
    return page(name, title, desc, h1, lede, body, [("Home", "index.html"), (h1, name)], scripts=["roi.js"], extra_ld=[faq_ld, svc], section="dealerships.html")


built.append(industry(
    "home-services.html", "Sales Coaching for Home Services Teams",
    "Sales coaching for solar, roofing, HVAC and in-home sales teams: in-home presentations, price objections, follow-up and recognition that keeps closers.",
    "Sales Coaching for Home Services", "For solar, roofing, HVAC, windows and other in-home sales teams that win or lose the deal at the kitchen table.",
    "The Kitchen-Table Problem",
    "In-home sales is one shot. A rep who freezes on price, can’t handle “we need to get other quotes,” or never follows up leaves money on the table, and new reps who struggle early rarely make it to month three.",
    "LJ has knocked on doors and sold face to face for years. Every session is practice on the conversations your reps have in real homes.",
    [("The first five minutes", "Building trust at the door so the homeowner wants to hear the rest."),
     ("Needs and inspection", "Questions that uncover the real problem and the real budget."),
     ("Price and financing", "Presenting the number with confidence, then handling “that’s more than we expected.”"),
     ("“We’re getting other quotes”", "Staying in the running without trashing the competition."),
     ("Both decision-makers", "Getting the spouse who isn’t home into the conversation."),
     ("Follow-up that closes", "A 24-hour follow-up habit for every unsold appointment.")],
    "home",
    [("Do you work with door-to-door and appointment-setting teams?", "Yes. Setters and closers both get coached, and we can train the hand-off between them."),
     ("We sell across several states. Can you train by video?", "Yes. Central Texas teams get on-site sessions; everyone else trains live by video, with the same practice and scorecards."),
     ("Is this licensing or compliance training?", "No. Unbroken Closers coaches sales conversations and habits. Licensing, financing rules and compliance stay with your company and state requirements.")],
    "Find Your Team’s Gaps in Three Minutes", "Ten questions, a score and the three fixes that matter most for your team."))

built.append(industry(
    "advertising-sales.html", "Sales Coaching for Advertising and Media Sales Teams",
    "Sales coaching for advertising and media sales reps who prospect and close local businesses: cold outreach, “advertising doesn’t work,” renewals and recognition.",
    "Sales Coaching for Media Sales", "For advertising reps who prospect, pitch and renew local business owners, in print, digital, radio or outdoor.",
    "The Busy Owner Problem",
    "Media reps sell something owners can’t touch to people who’ve been burned before. New reps hit a wall of “send me some information” and “advertising doesn’t work for me,” and most quit before their book of renewals builds.",
    "LJ has recruited, trained and led advertising sales teams across multiple states. Every session is practice on the calls and visits your reps make every week.",
    [("Getting the meeting", "Cold calls and walk-ins that earn ten minutes with the owner."),
     ("Discovery that sells", "Questions about how the business actually wins customers."),
     ("“Advertising doesn’t work”", "Turning a bad past experience into a better plan."),
     ("“Send me some information”", "Keeping the conversation alive instead of emailing a brochure into the void."),
     ("Proposals and the close", "Presenting a plan the owner can say yes to today."),
     ("Renewals and referrals", "Results reviews that renew contracts and lead to the next business.")],
    "media",
    [("Do you only work with print sales teams?", "No. Print, digital, radio, outdoor and agency teams all fit. The conversations with local owners are the same."),
     ("Can you train our managers to coach?", "Yes. Manager Coaching helps sales leaders run field rides, huddles and one-on-ones that develop reps."),
     ("Can reps join on their own?", "Yes. Individual reps can join the Closer’s Circle for live group coaching and practice.")],
    "Find Your Team’s Gaps in Three Minutes", "Ten questions, a score and the three fixes that matter most for your team."))

# ---------------------------------------------------------------- Closer of the Month Wall
body = """
<section class="section on-light">
  <div class="wrap">
    <div class="winners" id="winners-wall"></div>
    <div class="panel wall-empty" id="wall-empty" hidden>
      <h2>The First Winners Go Up Soon</h2>
      <p>Every month, teams in the Unbroken Closers program name a Closer of the Month. Winners get a printed award, a shout-out in front of their team and a spot on this wall.</p>
      <div class="btn-row"><a class="btn btn-stripe" href="nominate.html">Nominate a closer</a><a class="btn btn-ghost" href="awards.html">See the awards</a></div>
    </div>
  </div>
</section>
<section class="section section-dark">
  <div class="wrap band">
    <div><h2>Recognize Your Own Top Rep</h2><p class="mb-0">Design a Closer of the Month award with your rep’s name on it, printed and shipped by Print Wins.</p></div>
    <a class="btn btn-stripe" data-link="awardsUrl" href="https://printwins.shop/awards.html">Design an award</a>
  </div>
</section>
"""
built.append(page("wall.html", "Closer of the Month Wall",
     "Meet the salespeople who earned Closer of the Month on Unbroken Closers teams, and nominate the next one.",
     "Closer of the Month Wall", "The reps who showed up, did the work and earned it. Recognized in front of their team, and here.",
     body, [("Home", "index.html"), ("Awards", "awards.html"), ("Closer of the Month Wall", "wall.html")], section="awards.html"))


# ---------------------------------------------------------------- The 7 Sales Fears + Fear Finder
fear_sections = "".join(f"""
    <article class="fear" id="{f['slug']}">
      <div class="fear-head"><span class="fear-num">{i + 1}</span><div><h2>{e(f['name'])}</h2><p class="fear-says">{e(f['says'])}</p></div></div>
      <div class="fear-grid">
        <div><h3>Where it can come from</h3><p>{e(f['roots'])}</p></div>
        <div><h3>What it does on the sales floor</h3><p>{e(f['floor'])}</p></div>
        <div><h3>What it costs you</h3><p>{e(f['cost'])}</p></div>
        <div class="fear-step"><h3>Your first step</h3><p>{e(f['step'])}</p></div>
      </div>
    </article>""" for i, f in enumerate(FEARS))
toc = "".join(f'<a href="#{f["slug"]}">{e(f["short"])}</a>' for f in FEARS)
body = f"""
<section class="section on-light">
  <div class="wrap fears-intro">
    <div class="meaning-inline">
      <p>Every one of us carries something from the past: the house we grew up in, the neighborhood, the family, a loss, a failure. It shapes how we think, how we talk and how we show up in front of a customer. Left alone, it turns into fear, and fear turns into habits that cap your income.</p>
      <p><b>Unbroken doesn’t mean you never broke. It means you refused to let what happened in your life define you.</b></p>
    </div>
    <div class="panel ff" id="fear-finder">
      <h2>The Fear Finder</h2>
      <p class="muted">14 quick statements, about two minutes. Answer for how you really sell, not how you wish you did.</p>
      <form id="ff-quiz" novalidate><div id="ff-items"></div>
        <p class="form-status" id="ff-status" role="status"></p>
        <button class="btn btn-stripe" type="submit">Show me my top fear</button>
      </form>
      <div id="ff-result" hidden tabindex="-1"></div>
      <form class="inline-form ff-email" name="fears" method="POST" data-netlify="true" netlify-honeypot="company_url" data-ajax data-inline data-success="Sent. Check your inbox for your plan." hidden novalidate>
        <input type="hidden" name="form-name" value="fears">
        <input type="hidden" name="top_key">
        <input type="hidden" name="top_fears">
        <p class="hidden-field"><label>Leave this empty <input name="company_url"></label></p>
        <label class="hidden-field" for="ff-name">First name</label><input id="ff-name" name="name" placeholder="First name" autocomplete="given-name" required>
        <label class="hidden-field" for="ff-mail">Email</label><input id="ff-mail" name="email" type="email" placeholder="Your email" autocomplete="email" required>
        <button class="btn btn-stripe" type="submit">Email me my plan</button>
        <p class="form-status small" role="status" style="flex-basis:100%;margin:0"></p>
      </form>
    </div>
  </div>
</section>

<section class="section section-white on-light">
  <div class="wrap">
    <nav class="fear-toc" aria-label="The 7 fears">{toc}</nav>
    {fear_sections}
    <p class="note" style="margin-top:2rem">Coach LJ is a sales coach, not a counselor. This page is about how old experiences show up in your selling. If something from your past feels heavier than that, please talk to a licensed counselor. In crisis, call or text 988. <a href="support.html">Find support</a>.</p>
  </div>
</section>

<section class="section section-dark">
  <div class="wrap band">
    <div><h2>Work on It With People Who Get It</h2><p class="mb-0">The Closer’s Circle meets every Tuesday. Bring your top fear, and we’ll work on it together.</p></div>
    <a class="btn btn-stripe" data-link="skoolJoinUrl" href="https://www.skool.com/unbroken-closers-7322/about">Join the Closer’s Circle</a>
  </div>
</section>
"""
built.append(page("fears.html", "The 7 Sales Fears That Cap Your Income",
     "Fear of making money, success, cold-calling, prospecting, winning, referrals and closing: where each comes from, what it does on the sales floor and your first step. Take the free Fear Finder.",
     "The 7 Sales Fears", "What happened in your past can quietly cap your income. Find the fear that’s holding you back, and take your first step past it.",
     body, [("Home", "index.html"), ("The 7 Sales Fears", "fears.html")], scripts=["fears.js"]))

# ---------------------------------------------------------------- Share your results
body = """
<section class="section on-light">
  <div class="wrap" style="max-width:780px">
    <form class="panel" name="results" method="POST" action="thanks.html?f=results" data-netlify="true" netlify-honeypot="company_url" data-ajax novalidate>
      <input type="hidden" name="form-name" value="results">
      <p class="hidden-field"><label>Leave this empty <input name="company_url"></label></p>
      <h2>Tell Us What Changed</h2>
      <p class="muted">Two minutes. Real numbers help other managers most, but your own words are what matter.</p>
      <div class="form-grid">
        <div class="field"><label for="r-name">Your name</label><input id="r-name" name="name" required autocomplete="name"><p class="err">Enter your name.</p></div>
        <div class="field"><label for="r-email">Email</label><input id="r-email" name="email" type="email" required autocomplete="email"><p class="err">Enter a valid email.</p></div>
        <div class="field"><label for="r-role">Your role</label><input id="r-role" name="role" placeholder="Sales manager, rep, GM..." autocomplete="organization-title"></div>
        <div class="field"><label for="r-co">Dealership or company</label><input id="r-co" name="company" autocomplete="organization"></div>
        <div class="field full"><label for="r-program">What did you do with Unbroken Closers?</label>
          <select id="r-program" name="program"><option>Free team workshop</option><option>Team Program</option><option>Closer’s Circle</option><option>Bootcamp</option><option>Manager Coaching</option><option>Speaking event</option><option>Something else</option></select></div>
        <div class="field full"><label for="r-before">Before: what was going on?</label><textarea id="r-before" name="before" required placeholder="For example: new reps quitting in month two, closing ratio stuck at 12%"></textarea><p class="err">Tell us a little about before.</p></div>
        <div class="field full"><label for="r-after">After: what’s different now?</label><textarea id="r-after" name="after" required placeholder="For example: three reps past 90 days, closing ratio at 18%"></textarea><p class="err">Tell us what changed.</p></div>
        <div class="field full"><label for="r-quote">In one or two sentences, what would you tell another manager?</label><textarea id="r-quote" name="quote"></textarea></div>
        <div class="field full"><label class="check"><input type="checkbox" name="ok_to_share" value="yes"> Unbroken Closers may share my words with my name, role and company on its website and materials.</label></div>
      </div>
      <p style="margin-top:1rem"><button class="btn btn-stripe" type="submit">Send my results</button></p>
      <p class="form-status" role="status"></p>
      <p class="small muted">Nothing is published without the box above checked, and LJ will confirm the exact wording with you first.</p>
    </form>
  </div>
</section>
"""
built.append(page("results.html", "Share Your Results",
     "Worked with Unbroken Closers? Tell us what changed for you or your team.",
     "Share Your Results", "Worked with LJ? Tell us what changed. Your story helps the next manager decide.",
     body, [("Home", "index.html"), ("Share Your Results", "results.html")]))

print("built", len(built), "pages")
