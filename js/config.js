/*
  Unbroken Closers — site settings.
  Edit the values below; every page reads from here.
*/
window.UC_CONFIG = {
  siteUrl: "https://unbrokenclosers.com",
  email: "hello@unbrokenclosers.com",
  phone: "",                       // e.g. "(254) 555-0100" — leave blank to hide

  // Google Analytics 4 measurement ID, e.g. "G-XXXXXXX". Blank = no tracking scripts load.
  ga4Id: "",

  // Top-of-page announcement bar. Blank text = hidden.
  announcement: {
    text: "Founding teams lock in their monthly rate for life.",
    linkText: "See the offer",
    href: "index.html#founding"
  },

  // Founding team offer: update "taken" as you sign teams. The site shows spots left.
  foundingSpots: { total: 5, taken: 0 },

  // Partner links
  softPitchUrl: "https://freshupleads.com/train.html",
  leadsUrl: "https://freshupleads.com",
  awardsUrl: "https://printwins.shop",
  memoirUrl: "",                   // Amazon link to "Stripped Bare, But Unbroken" — blank hides the button

  // Social profiles (blank = hidden)
  social: {
    youtube: "",
    tiktok: "",
    linkedin: "",
    facebook: "",
    instagram: ""
  },

  // Real testimonials only. The section stays hidden until you add one.
  // { quote: "...", name: "Jane Doe", role: "Sales Manager, Example Ford" }
  testimonials: [],

  // Soft Pitch demo video (YouTube ID) for the Tools page. Blank = hidden.
  softPitchDemoId: "",

  // Booking calendar
  // Set calendlyUrl (or a Cal.com link) to show a live calendar instead of the request form.
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
    lengths: { workshop: 45, team: 30, circle: 15, bootcamp: 30, manager: 20, speaking: 30 },
    blockedDates: []               // e.g. ["2026-11-26", "2026-12-25"]
  }
};
