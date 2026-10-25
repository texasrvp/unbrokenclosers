UNBROKEN CLOSERS — unbrokenclosers.com

DEPLOY
1. Drag this whole folder onto Netlify (netlify.toml sets security headers, caching and short links).
2. Domain settings > add unbrokenclosers.com (www redirects to the main domain automatically).
3. Forms: Netlify detects booking, awards, newsletter, newsletter-notes, objection-card, assessment, nominate and events-notify.
   Turn on email alerts: Site configuration > Forms > Form notifications.
4. Google Search Console: submit https://unbrokenclosers.com/sitemap.xml

SHORT LINKS (for business cards, Objection Armor Cards and social bios)
  unbrokenclosers.com/workshop   -> free workshop page
  unbrokenclosers.com/assessment -> Unbroken Assessment
  unbrokenclosers.com/tracker    -> printable Daily Tracker
  unbrokenclosers.com/quiz      -> objection quiz
  unbrokenclosers.com/card      -> free Objection Armor Card
  unbrokenclosers.com/book      -> booking calendar

SETTINGS (js/config.js)
- email, phone, social links (blank = hidden)
- ga4Id: Google Analytics ID turns on tracking for bookings, quiz results, video plays and outbound clicks
- announcement bar text (blank = hidden)
- foundingSpots: update "taken" each time you sign a team
- testimonials: paste real quotes; the section appears automatically
- softPitchDemoId: YouTube ID for a Soft Pitch demo on the Tools page
- booking slots by weekday, blocked dates, session lengths
- calendlyUrl: paste a Calendly or Cal.com link to replace the request form with a live calendar

VIDEOS (js/videos.js)   paste a YouTube ID into youtubeId and "Coming soon" becomes playable.
PHOTO (about.html)      save as img/lj.jpg and uncomment the <img> line in the portrait block.
LOGO FILES (img/)       mark.svg (icon), seal.svg / seal.png (emblem for awards, cards, social profiles),
                        og-image.png (link preview image), favicons and app icons.

CACHE
After editing CSS or JS, change ?v=20261009a in the HTML files to a new value so browsers load the update.

UNBROKEN ASSESSMENT (js/assessment.js)
- The 8 inner objections, their book chapters, stories and first steps live at the top of the file. Edit the
  wording there; the results page and the chapter list update together (the list on assessment.html is in the HTML).
- Answers stay in the visitor's browser. Only name, email, what they sell and their top areas are sent.

COLORS
Book cover palette: royal blue #2261a4, red #d9504e, deep red #af3544 (buttons), navy #12233b, cream #f4f2ec.

HOUSE STYLE (applied automatically when the site is built)
- Headings, menu labels and page titles: Title Case (AP style).
- Program names always capitalized: Free Team Workshop, Team Program, Closer's Circle, Half-Day Bootcamp,
  Manager Coaching, Unbroken Assessment, Objection Armor Card, Field Notes, Daily Tracker and so on.
- Body text and buttons: sentence case. Quotes and apostrophes are curly (“ ” ’), never straight.
- If you edit an HTML file by hand, follow the same rules so pages stay consistent.

NEW SETTINGS (js/config.js)
- events: list open bootcamps; the Events page shows a "notify me" form when empty.
- hallOfFame: Closer of the Month winners for the Awards page (real winners, with their OK).

ANALYTICS CONSENT
When ga4Id is set, visitors see a small consent notice. Google Analytics loads only after they accept.

PRIVACY AND TERMS
privacy.html and terms.html are plain-language starting points, not legal advice. Have them reviewed
before you rely on them, especially once you take payments.

REFERRAL PROGRAM (referrals.html)
- Personal links look like unbrokenclosers.com/?ref=first-last. The visitor's referrer is remembered for 90 days
  and sent with booking requests in the "referred_by" field.
- Introductions arrive through the "referral" Netlify form.
- Reward amounts are written on the page itself. Change them there if you adjust the program.

F&I COACHING (fi.html)
- Linked from the dealership page, Programs page, footer and the booking calendar ("F&I Strategy Call").
- Statistics come from StoneEagleDATA Q4 2025 via AutoSuccess; update them as new reports come out.

OCT 2026 UPDATE
- Closer's Circle joins happen on Skool. Links live in js/config.js: skoolJoinUrl (sales page) and
  skoolCommunityUrl (members' home, used by "Member Log In" in the menu and footer).
- Your photo: save a portrait headshot as img/lj.jpg. It appears on About, the Media Kit and next to
  "Led by LJ" on the home page. Nothing shows a broken image if the file is missing.
- Videos: the menu link stays hidden until you set showVideos: true in js/config.js
  (do that once 3 or more videos have a youtubeId in js/videos.js).
- Free signed book: managers who book the Free Team Workshop get a signed copy. Video workshops ask
  for a mailing address on the booking form (field: book_mailing_address).


=====================================================================
OCTOBER 2026 UPGRADES: SETUP CHECKLIST
=====================================================================

1. CAL.COM BOOKING
   In js/config.js, set calcom.username to the part after cal.com/ in your link.
   In Cal.com, create an event for each session using these slugs (or change the slugs in config.js):
     free-team-workshop (45 min), strategy-call (30), circle-intro (15), plan-a-bootcamp (30),
     manager-coaching-intro (20), fi-strategy-call (30), speaking-inquiry (30)
   Any session without its own event uses "default" (30min).
   For the free workshop event, add a booking question: "Mailing address for your signed book (video workshops only)".
   book.html?form=1 always shows the old request form as a backup.

2. FOLLOW-UP EMAILS (Netlify → Site settings → Environment variables), then redeploy
   RESEND_API_KEY       your Resend key
   UC_EMAIL_FROM        e.g. Coach LJ <lj@unbrokenclosers.com>  (verify unbrokenclosers.com in Resend → Domains first)
   UC_NOTIFY_EMAIL      where scorecard leads go (default hello@unbrokenclosers.com)
   UC_MAILING_ADDRESS   a mailing address or P.O. box (required in marketing emails by CAN-SPAM)
   Sequences: reps (assessment, Armor Card, newsletter) and managers (Team Readiness Scorecard), 5 emails each.
   Edit the words in netlify/functions/lib/sequences.js.

3. HELLO VIDEO: record 90 seconds, upload to YouTube (unlisted is fine), put the ID in config.js → helloVideo.youtubeId.
4. CREDIBILITY NUMBERS: config.js → credentials (years in sales, reps trained). Real numbers only; blank stays hidden.
5. TESTIMONIALS: send clients to /results.html. Approved quotes go in config.js → testimonials.
6. CLOSER OF THE MONTH WALL: add winners to config.js → hallOfFame (with their OK).
7. OBJECTION LIBRARY: edit data/library.json, then run: python3 scripts/build.py
8. SPEAKER ONE-SHEET: downloads/coach-lj-speaker-one-sheet.pdf (source: scripts/one-sheet.html).
9. GA4 events now sent: generate_lead, booking_request, booking_scheduled, book_offer_claim, scorecard_complete,
   assessment_complete, skool_join_click, practice_click, file_download, video_play.
   In GA4 → Admin → Events, mark generate_lead, booking_scheduled and skool_join_click as key events.

Tests: npm test (functions) and python3 tests/smoke.py (every page in a browser).
