/*
  Unbroken Closers — video library.
  To publish a video, paste its YouTube ID (the part after "shorts/" or "v=") into youtubeId.
  Example: https://youtube.com/shorts/AbC123xyz  ->  youtubeId: "AbC123xyz"
  Set vertical: false for a regular wide video.
*/
window.UC_VIDEOS = [
  { title: "The Price Objection Is Never About Price", category: "Objections", length: "0:58", youtubeId: "", vertical: true,
    summary: "What the customer is really afraid of, and the one question that gets the deal moving again." },
  { title: "“I Need to Talk to My Spouse”: Invite Them In", category: "Objections", length: "1:02", youtubeId: "", vertical: true,
    summary: "Stop fighting the spouse objection. Bring the absent decision-maker into the conversation." },
  { title: "Selling to the Buyer Who Already Knows Invoice", category: "Closing", length: "1:10", youtubeId: "", vertical: true,
    summary: "Informed buyers aren’t the enemy. Sell on trust and value when they’ve done their homework." },
  { title: "What the Lot Taught Me About Getting Back Up", category: "Story", length: "1:30", youtubeId: "", vertical: true,
    summary: "The worst month of my sales career, and the habit that pulled me out of it." },
  { title: "Why Your Best Rep Quits in Month Three", category: "For managers", length: "1:15", youtubeId: "", vertical: true,
    summary: "The three signals a new rep is about to walk, and what to say before they do." },
  { title: "The Two-Minute Morning Huddle", category: "For managers", length: "0:55", youtubeId: "", vertical: true,
    summary: "One skill, one rep, one practice round. Run it before the doors open." },
  { title: "Ask for the Sale Like You Mean It", category: "Closing", length: "0:49", youtubeId: "", vertical: true,
    summary: "Three simple closes that don’t feel pushy, for you or the customer." },
  { title: "“I’ll Think About It” Means “I’m Not Sure Yet”", category: "Objections", length: "0:52", youtubeId: "", vertical: true,
    summary: "Find the part they’re unsure about instead of letting them walk off the lot." },
  { title: "Getting a “No” Is Part of the Job", category: "Mindset", length: "1:05", youtubeId: "", vertical: true,
    summary: "What military life taught me about rejection, and why the next up is a fresh start." },
  { title: "Grow Where You’re Planted", category: "From the book", length: "1:10", youtubeId: "", vertical: true,
    summary: "Stop blaming the store. The lesson from Landing on Earth, applied to the sales floor." },
  { title: "The Commission Love Affair", category: "From the book", length: "1:05", youtubeId: "", vertical: true,
    summary: "Love the customer and the commission follows. Love the commission and the customer leaves." },
  { title: "Iron Sharpens Iron", category: "From the book", length: "0:58", youtubeId: "", vertical: true,
    summary: "Why the people you eat lunch with decide how much you sell." },
  { title: "Most People Quit Too Soon", category: "From the book", length: "1:12", youtubeId: "", vertical: true,
    summary: "Track three numbers a day and you’ll see you’re winning before the paycheck does." }
];

(function () {
  var grid = document.getElementById("video-grid");
  var filters = document.getElementById("video-filters");
  if (!grid || !filters) return;
  var videos = window.UC_VIDEOS || [];
  var active = "All";

  var cats = ["All"].concat(videos.map(function (v) { return v.category; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
  cats.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.textContent = c;
    b.setAttribute("aria-pressed", c === active ? "true" : "false");
    b.addEventListener("click", function () {
      active = c;
      filters.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x.textContent === c ? "true" : "false"); });
      render();
    });
    filters.appendChild(b);
  });

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function render() {
    var list = videos.filter(function (v) { return active === "All" || v.category === active; });
    grid.innerHTML = "";
    if (!list.length) {
      grid.innerHTML = '<p class="empty">No videos in this category yet.</p>';
      return;
    }
    list.forEach(function (v) {
      var live = !!v.youtubeId;
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "video";
      if (!live) { btn.disabled = true; btn.setAttribute("aria-label", v.title + ", coming soon"); }
      btn.innerHTML =
        '<div class="thumb">' +
          (live ? '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(v.youtubeId) + '/hqdefault.jpg" alt="" loading="lazy">' : "") +
          (live ? '<span class="play" aria-hidden="true"></span>' : '<span class="soon">Coming soon</span>') +
        "</div>" +
        '<div class="meta"><span class="cat">' + esc(v.category) + " · " + esc(v.length) + "</span>" +
        "<h3>" + esc(v.title) + "</h3><p>" + esc(v.summary) + "</p></div>";
      if (live) btn.addEventListener("click", function () { openVideo(v, btn); });
      grid.appendChild(btn);
    });
  }

  // Modal player
  var modal = document.getElementById("video-modal");
  var frame = modal.querySelector(".frame");
  var inner = modal.querySelector(".modal-inner");
  var caption = modal.querySelector("h3");
  var closeBtn = modal.querySelector(".modal-close");
  var lastFocus = null;
  var releaseTrap = null;

  function openVideo(v, from) {
    lastFocus = from;
    inner.classList.toggle("wide", v.vertical === false);
    frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.youtubeId) +
      '?autoplay=1&rel=0" title="' + esc(v.title) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    caption.textContent = v.title;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
    if (window.UC_trapFocus) releaseTrap = window.UC_trapFocus(modal);
    if (window.UC_track) window.UC_track("video_play", { title: v.title });
  }
  function closeVideo() {
    modal.classList.remove("open");
    frame.innerHTML = "";
    document.body.style.overflow = "";
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    if (lastFocus) lastFocus.focus();
  }
  closeBtn.addEventListener("click", closeVideo);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeVideo(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("open")) closeVideo(); });

  render();
})();
