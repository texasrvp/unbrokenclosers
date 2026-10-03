UNBROKEN CLOSERS — unbrokenclosers.com

DEPLOY
1. Drag this whole folder onto Netlify (netlify.toml sets security headers, caching and short links).
2. Domain settings > add unbrokenclosers.com (www redirects to the main domain automatically).
3. Forms: Netlify detects booking, awards, newsletter, newsletter-notes, objection-card and assessment.
   Turn on email alerts: Site configuration > Forms > Form notifications.
4. Google Search Console: submit https://unbrokenclosers.com/sitemap.xml

SHORT LINKS (for business cards, Objection Armor Cards and social bios)
  unbrokenclosers.com/workshop  -> book a free workshop
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
After editing CSS or JS, change ?v=20261003d in the HTML files to a new value so browsers load the update.

UNBROKEN ASSESSMENT (js/assessment.js)
- The 8 inner objections, their book chapters, stories and first steps live at the top of the file. Edit the
  wording there; the results page and the chapter list update together (the list on assessment.html is in the HTML).
- Answers stay in the visitor's browser. Only name, email, what they sell and their top areas are sent.

COLORS
Book cover palette: royal blue #2261a4, red #d9504e, deep red #af3544 (buttons), navy #12233b, cream #f4f2ec.
