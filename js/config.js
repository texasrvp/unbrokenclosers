/*
  Unbroken Closers — site settings.
  Edit the values below; every page reads from here.
*/
window.UC_CONFIG = {
  siteUrl: "https://unbrokenclosers.com",
  email: "hello@unbrokenclosers.com",
  phone: "",                       // e.g. "(254) 555-0100" — leave blank to hide

  // Your headshot. Save it as img/lj.jpg (portrait, about 800x1000) and it appears on the About page
  // and next to your name on the home page. If the file isn't there, the site shows nothing broken.
  photo: "img/lj.jpg",

  // Show the Videos page in the menu. Turn on once at least 3 videos have a youtubeId in js/videos.js.
  showVideos: false,

  // Google Analytics 4 measurement ID, e.g. "G-XXXXXXX". Blank = no tracking scripts load.
  ga4Id: "G-E8PH05W2J0",

  // Top-of-page announcement bar. Blank text = hidden.
  announcement: {
    text: "Founding teams lock in their monthly rate for life.",
    linkText: "See the offer",
    href: "index.html#founding"
  },

  // Founding team offer: update "taken" as you sign teams. The site shows spots left.
  foundingSpots: { total: 5, taken: 0 },

  // Closer's Circle lives on Skool. joinUrl = the sales page with the Join button; communityUrl = members' home.
  skoolJoinUrl: "https://www.skool.com/unbroken-closers-7322/about",
  skoolCommunityUrl: "https://www.skool.com/unbroken-closers-7322",
  circlePrice: { regular: 79, founding: 49, foundingSpots: 10 },

  // Partner links
  softPitchUrl: "https://freshupleads.com/train.html",
  leadsUrl: "https://freshupleads.com",
  awardsUrl: "https://printwins.shop",
  memoirUrl: "https://a.co/d/0by2Ndh7", // Amazon link to "Stripped Bare, But Unbroken" — blank hides the button

  // Social profiles (blank = hidden)
  social: {
    youtube: "",
    tiktok: "",
    linkedin: "https://www.linkedin.com/in/larrydstephens/",
    facebook: "",
    instagram: ""
  },

  // Real testimonials only. The section stays hidden until you add one.
  // { quote: "...", name: "Jane Doe", role: "Sales Manager, Example Ford" }
  testimonials: [],

  // Open events (newest last). Empty = the Events page shows a "notify me" form.
  // { title: "Field Ready Bootcamp", date: "2026-11-14", time: "8:30 AM", city: "Killeen, TX", venue: "TBD", price: "$149 per seat", href: "book.html?session=bootcamp" }
  events: [],

  // Closer of the Month winners: shown on the Wall (wall.html) and the Awards page. Real winners only, with their OK.
  // { name: "Jane Doe", company: "Example Ford", month: "October 2026", award: "Closer of the Month",
  //   why: "14 units and a 100% CSI month", photo: "img/winners/jane.jpg" }   (why and photo are optional)
  hallOfFame: [],

  // 90-second hello video on the home and About pages. Fill ONE: a YouTube ID, a Vimeo ID or an MP4 path (e.g. "img/hello.mp4").
  helloVideo: { youtubeId: "", vimeoId: "", mp4: "", poster: "img/lj.jpg" },

  // Optional numbers for the credibility strip on the home page. Leave null to hide. Real numbers only.
  credentials: { yearsInSales: null, repsTrained: null, statesLed: null },

  // Automatic follow-up emails after the assessment, quiz, scorecard and newsletter (needs RESEND_API_KEY in Netlify).
  emailFollowUp: true,

  // "Practice this objection" buttons open the Fresh Up trainer with that objection.
  practiceUrl: "https://freshupleads.com/train",

  // Soft Pitch demo video (YouTube ID) for the Tools page. Blank = hidden.
  softPitchDemoId: "",

  // Booking calendar: Cal.com
  // username = the part after cal.com/ in your booking link (cal.com/YOURNAME).
  // events = the event slug for each session type (the part after your name, e.g. cal.com/YOURNAME/free-team-workshop).
  // Any session without its own event uses "default". Blank username = the request form below is used instead.
  calcom: {
    username: "l.-stephens-738n6h",
    // Matched to the events on your Cal.com page today. Create the others in Cal.com, then put their slugs here.
    events: {
      "default": "30min",
      workshop: "30min",               // tip: make a 45-min "free-team-workshop" event and put that slug here
      team: "lawyer-consultation",     // your "Unbroken Closers Consultation" event
      circle: "15min",
      bootcamp: "30min",
      manager: "30min",
      fi: "lawyer-consultation",
      speaking: "30min"
    }
  },
  calendlyUrl: "",
  booking: {
    daysAhead: 45,
    minNoticeDays: 1,
    timezone: "America/Chicago",
    // Times by weekday (0 = Sunday ... 6 = Saturday). Empty = closed.
    slots: {
      0: [],
      1: ["7:00 AM", "7:30 AM", "6:00 PM", "6:30 PM", "7:00 PM"],
      2: ["7:00 AM", "7:30 AM", "6:00 PM", "6:30 PM", "7:00 PM"],
      3: ["7:00 AM", "7:30 AM", "6:00 PM", "6:30 PM", "7:00 PM"],
      4: ["7:00 AM", "7:30 AM", "6:00 PM", "6:30 PM", "7:00 PM"],
      5: ["7:00 AM", "7:30 AM", "12:00 PM"],
      6: ["9:00 AM", "10:00 AM", "11:00 AM"]
    },
    // Length of each session in minutes, used for "Add to calendar"
    lengths: { workshop: 45, team: 30, circle: 15, bootcamp: 30, manager: 20, fi: 30, speaking: 30 },
    blockedDates: []               // e.g. ["2026-11-26", "2026-12-25"]
  }
};
