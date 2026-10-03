UNBROKEN CLOSERS — unbrokenclosers.com

DEPLOY
1. Drag this whole folder (or the zip) onto Netlify.
2. In Netlify: Domain settings > add unbrokenclosers.com and follow the DNS steps.
3. Forms: Netlify detects the "booking" and "awards" forms automatically.
   Turn on email notifications under Site configuration > Forms > Form notifications.

EDIT SETTINGS (js/config.js)
- email / phone
- softPitchUrl, leadsUrl, awardsUrl, memoirUrl
- social links (blank = hidden)
- booking times by weekday, blocked dates, how far ahead people can book
- calendlyUrl: paste a Calendly or Cal.com link to show a live, auto-syncing calendar instead of the request form

ADD A VIDEO (js/videos.js)
- Paste the YouTube ID into youtubeId. "Coming soon" turns into a playable video.

ADD YOUR PHOTO (about.html)
- Save it as img/lj.jpg and uncomment the <img> line in the portrait block.

CACHE
- After edits, change ?v=20261003 in the HTML files to today's date so browsers load the new CSS/JS.
