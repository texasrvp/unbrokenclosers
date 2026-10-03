/*
  Unbroken Closers — site settings.
  Edit the values below; every page reads from here.
*/
window.UC_CONFIG = {
  email: "hello@unbrokenclosers.com",
  phone: "",                       // e.g. "(254) 555-0100" — leave blank to hide

  // Partner links
  softPitchUrl: "https://freshupleads.com/train.html",
  leadsUrl: "https://freshupleads.com",
  awardsUrl: "https://printwins.shop",
  memoirUrl: "",                   // Amazon link to "Stripped Bare, But Unbroken" — leave blank to hide the button

  // Social profiles (leave blank to hide)
  social: {
    youtube: "",
    tiktok: "",
    linkedin: "",
    facebook: "",
    instagram: ""
  },

  // Booking calendar
  // If you set calendlyUrl (or a Cal.com link), the Book page shows that live calendar instead of the request form.
  calendlyUrl: "",
  booking: {
    daysAhead: 45,                 // how far ahead people can pick
    minNoticeDays: 1,              // no same-day requests
    timezone: "America/Chicago",
    // Times offered by weekday (0 = Sunday ... 6 = Saturday). Empty = closed.
    slots: {
      0: [],
      1: ["7:00 AM", "7:30 AM", "6:00 PM", "6:30 PM", "7:00 PM"],
      2: ["7:00 AM", "7:30 AM", "6:00 PM", "6:30 PM", "7:00 PM"],
      3: ["7:00 AM", "7:30 AM", "6:00 PM", "6:30 PM", "7:00 PM"],
      4: ["7:00 AM", "7:30 AM", "6:00 PM", "6:30 PM", "7:00 PM"],
      5: ["7:00 AM", "7:30 AM", "12:00 PM"],
      6: ["9:00 AM", "10:00 AM", "11:00 AM"]
    },
    blockedDates: []               // e.g. ["2026-11-26", "2026-12-25"]
  }
};
