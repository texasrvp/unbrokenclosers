/*
  Unbroken Closers — video library.
  To publish a video, paste its YouTube ID (the part after "shorts/" or "v=") into youtubeId.
  Example: https://youtube.com/shorts/AbC123xyz  ->  youtubeId: "AbC123xyz"
  Set vertical: false for a regular wide video.
*/
window.UC_VIDEOS = [
  { title: "The price objection is never about price", category: "Objections", length: "0:58", youtubeId: "", vertical: true,
    summary: "What the customer is really afraid of, and the one question that gets the deal moving again." },
  { title: "\"I need to talk to my spouse\": invite them in", category: "Objections", length: "1:02", youtubeId: "", vertical: true,
    summary: "Stop fighting the spouse objection. Bring the absent decision-maker into the conversation." },
  { title: "Selling to the buyer who already knows invoice", category: "Closing", length: "1:10", youtubeId: "", vertical: true,
    summary: "Informed buyers aren't the enemy. Sell on trust and value when they've done their homework." },
  { title: "What the lot taught me about getting back up", category: "Story", length: "1:30", youtubeId: "", vertical: true,
    summary: "The worst month of my sales career, and the habit that pulled me out of it." },
  { title: "Why your best rep quits in month three", category: "For managers", length: "1:15", youtubeId: "", vertical: true,
    summary: "The three signals a new rep is about to walk, and what to say before they do." },
  { title: "The two-minute morning huddle", category: "For managers", length: "0:55", youtubeId: "", vertical: true,
    summary: "One skill, one rep, one practice round. Run it before the doors open." },
  { title: "Ask for the sale like you mean it", category: "Closing", length: "0:49", youtubeId: "", vertical: true,
    summary: "Three simple closes that don't feel pushy, for you or the customer." },
  { title: "\"I'll think about it\" means \"I'm not sure yet\"", category: "Objections", length: "0:52", youtubeId: "", vertical: true,
    summary: "Find the part they're unsure about instead of letting them walk off the lot." },
  { title: "Getting a \"no\" is part of the job", category: "Mindset", length: "1:05", youtubeId: "", vertical: true,
    summary: "What military life taught me about rejection, and why the next up is a fresh start." }
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

  function openVideo(v, from) {
    lastFocus = from;
    inner.classList.toggle("wide", v.vertical === false);
    frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.youtubeId) +
      '?autoplay=1&rel=0" title="' + esc(v.title) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    caption.textContent = v.title;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }
  function closeVideo() {
    modal.classList.remove("open");
    frame.innerHTML = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  closeBtn.addEventListener("click", closeVideo);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeVideo(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("open")) closeVideo(); });

  render();
})();
