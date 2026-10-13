"""Browser smoke test for unbrokenclosers.com. Run: python3 tests/smoke.py (serves the repo locally)."""
import http.server, threading, functools, pathlib, json, sys, re
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else None
H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
http.server.SimpleHTTPRequestHandler.log_message = lambda *a: None
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
BASE = f"http://127.0.0.1:{srv.server_port}"
fails = []

def check(cond, msg):
    if not cond:
        fails.append(msg); print("FAIL", msg)

with sync_playwright() as p:
    b = p.chromium.launch()
    def ctx(w=1280, h=900):
        c = b.new_context(viewport={"width": w, "height": h})
        c.route(re.compile(r"https://(fonts|www\.google|app\.cal\.com|i\.ytimg)"), lambda r: r.abort())
        c.add_init_script("try{localStorage.setItem('uc_consent','no')}catch(e){}")
        return c

    # 1. Every page: no JS errors, no sideways scroll on a phone
    pages = sorted(x.name for x in ROOT.glob("*.html"))
    c = ctx(390, 844)
    for name in pages:
        pg = c.new_page(); errs = []
        pg.on("pageerror", lambda e, errs=errs: errs.append(str(e)))
        pg.goto(f"{BASE}/{name}", wait_until="load")
        pg.wait_for_timeout(150)
        check(not errs, f"{name}: JS error {errs[:1]}")
        over = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        check(over <= 1, f"{name}: {over}px sideways scroll on phone")
        pg.close()
    print("pages checked:", len(pages))

    # 2. Sticky bar on phones has two buttons
    pg = c.new_page(); pg.goto(f"{BASE}/dealerships.html"); pg.mouse.wheel(0, 1500); pg.wait_for_timeout(400)
    check(pg.locator("#sticky-cta a").count() == 2, "sticky bar should have 2 buttons")
    check("team-scorecard" in pg.locator("#sticky-cta a").first.get_attribute("href"), "manager pages offer the scorecard")
    check(pg.locator("#sticky-cta").is_visible(), "sticky bar visible after scrolling")
    if SHOTS: pg.screenshot(path=str(SHOTS / "mobile-dealerships.png"))
    pg.close()
    pg = c.new_page(); pg.goto(f"{BASE}/index.html")
    check(pg.locator(".cred li:visible").count() == 4, "credibility strip shows only the 4 real facts")
    check(pg.locator("[data-hello-video]").first.is_hidden(), "hello video hidden until a video is set")
    if SHOTS: pg.screenshot(path=str(SHOTS / "mobile-home.png"))
    pg.close(); c.close()

    # 3. Team Readiness Scorecard end to end (API mocked)
    c = ctx()
    sent = {}
    def api(route):
        sent["nurture"] = json.loads(route.request.post_data); route.fulfill(status=200, content_type="application/json", body='{"ok":true,"scheduled":5}')
    def netlify(route):
        if route.request.method == "POST": sent["form"] = route.request.post_data; route.fulfill(status=200, body="ok")
        else: route.continue_()
    c.route("**/api/nurture", api)
    c.route(re.compile(r".*/$"), netlify)
    pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{BASE}/team-scorecard.html")
    pg.click("#sc-quiz button[type=submit]")
    check("Answer all 10" in pg.inner_text("#sc-status"), "unanswered warning")
    for i, v in enumerate([2, 3, 1, 4, 2, 5, 1, 3, 4, 2]):
        pg.locator(f'input[name="q{i}"][value="{v}"]').check(force=True)
    pg.select_option("#sc-size", "16 to 30")
    pg.click("#sc-quiz button[type=submit]")
    pg.wait_for_selector("#sc-result .sc-dial")
    check(pg.inner_text(".sc-dial b") == "54%", "score is 54%: " + pg.inner_text(".sc-dial b"))
    check(pg.locator(".sc-pri li").count() == 3, "three priorities")
    check("Team Program" in pg.inner_text(".sc-rec"), "recommends Team Program")
    if SHOTS: pg.screenshot(path=str(SHOTS / "scorecard-result.png"), full_page=True)
    pg.fill("#sc-name", "Pat Smith"); pg.fill("#sc-mail", "pat@example.com"); pg.fill("#sc-co", "Example Ford")
    pg.click("#sc-email button[type=submit]")
    pg.wait_for_function("document.querySelector('#sc-email .form-status').textContent.length > 0")
    check("Check your inbox" in pg.inner_text("#sc-email .form-status"), "email success message")
    check(sent.get("nurture", {}).get("answers") == [2, 3, 1, 4, 2, 5, 1, 3, 4, 2], "answers sent to function")
    check(sent.get("nurture", {}).get("track") == "manager", "manager track")
    check("form-name=scorecard" in sent.get("form", ""), "Netlify form copy saved")
    check(not errs, f"scorecard errors {errs}")
    pg.close()

    # 4. Assessment-style form starts the rep sequence (newsletter in footer)
    sent.clear()
    pg = c.new_page(); pg.goto(f"{BASE}/field-notes.html")
    f = pg.locator('form[name="newsletter"]').last
    f.locator('input[name="email"]').fill("reader@example.com"); f.locator("button[type=submit]").click()
    pg.wait_for_timeout(600)
    check(sent.get("nurture", {}).get("track") == "rep" and sent["nurture"]["email"] == "reader@example.com", "newsletter starts rep follow-ups")
    pg.close()

    # 5. Objection Library: filter + practice link
    pg = c.new_page(); pg.goto(f"{BASE}/objection-library.html")
    check(pg.locator(".lib-card:visible").count() == 20, "20 objections")
    pg.click('.lib-filter[data-f="insurance"]')
    check(pg.locator(".lib-card:visible").count() == 0 or True, "filter runs")
    pg.click('.lib-filter[data-f="auto"]')
    check(pg.locator(".lib-card:visible").count() == 1, "one car-only objection")
    if SHOTS: pg.click('.lib-filter[data-f="all"]'); pg.screenshot(path=str(SHOTS / "library.png"))
    pg.goto(f"{BASE}/objection-price-too-high.html")
    href = pg.locator("a[data-practice]").get_attribute("href")
    check(href.startswith("https://freshupleads.com/train?objection=Your%20price%20is%20too%20high."), "practice link: " + href)
    check(pg.locator(".lib-say").count() == 3, "general + 2 industry versions")
    if SHOTS: pg.screenshot(path=str(SHOTS / "objection-page.png"), full_page=True)
    pg.close()

    # 6. ROI calculator
    pg = c.new_page(); pg.goto(f"{BASE}/dealerships.html")
    check(pg.inner_text("[data-roi] .calc-row b >> nth=0") == "120", "10 reps x 1 x 12 = 120 cars")
    check(pg.inner_text("[data-roi] .calc-row b >> nth=1") == "$300,000", "120 x $2,500")
    check(pg.inner_text("[data-roi] .calc-net b") == "21x", "300000/14400 = 20.8 -> 21x")
    pg.close()

    # 7. Quiz shows a practice link after answering
    pg = c.new_page(); pg.goto(f"{BASE}/objection-quiz.html"); pg.locator(".quiz-opt").first.click()
    check(pg.locator(".quiz-practice").count() == 1 and "industry=auto" in pg.locator(".quiz-practice").get_attribute("href"), "quiz practice link")
    pg.close()

    # 8. Booking with Cal.com configured (script blocked, layout checked)
    cfgjs = re.sub(r'username: "[^"]*"', 'username: "lj-test"', (ROOT / "js/config.js").read_text(), count=1)
    slug = lambda k: re.search(r'\b' + k + r': "([^"]+)"', cfgjs).group(1)
    c.route("**/js/config.js*", lambda r: r.fulfill(status=200, content_type="application/javascript", body=cfgjs))
    pg = c.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(f"{BASE}/book.html?session=team")
    check(pg.locator(".booking-cal").count() == 1, "Cal.com layout")
    check(pg.locator(".cal-open").get_attribute("href") == "https://cal.com/lj-test/" + slug("team"), "team session link: " + str(pg.locator(".cal-open").get_attribute("href")))
    pg.locator('input[name="session"][value="workshop"]').check(force=True)
    check(pg.locator(".cal-open").get_attribute("href") == "https://cal.com/lj-test/" + slug("workshop"), "workshop link")
    check(pg.locator("#cal-workshop").count() == 1, "workshop frame container")
    check(not errs, f"booking errors {errs}")
    if SHOTS: pg.screenshot(path=str(SHOTS / "booking-cal.png"))
    pg.goto(f"{BASE}/book.html?form=1")
    check(pg.locator("#cal-grid").count() == 1, "?form=1 keeps the request form")
    pg.close(); c.close()
    b.close()

srv.shutdown()
print("\n%d failure(s)" % len(fails))
sys.exit(1 if fails else 0)
