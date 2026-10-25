// The five-email follow-up sequences. Every word is written here on the server,
// so nobody can use the signup form to send their own text to someone else.

const { SITE, esc, P, H, BTN, BOX, SIGN } = require('./mail');
const BASE_AREAS = require('../../../data/assessment-areas.json');
const FEARS = require('../../../data/fears.json');
// The 7 Sales Fears (Fear Finder) share the same email plan as the assessment areas.
const AREAS = Object.assign({}, BASE_AREAS);
for (const f of FEARS) AREAS[f.key] = { name: f.name, says: f.says, story: f.roots + ' ' + f.floor, step: f.step, fear: true };

const u = (path, campaign) => `${SITE}/${path}${path.includes('?') ? '&' : '?'}utm_source=email&utm_medium=nurture&utm_campaign=${campaign}`;
const SKOOL = process.env.UC_SKOOL_JOIN_URL || 'https://www.skool.com/unbroken-closers-7322/about';

// Reps: assessment, objection quiz, newsletter
function repSequence({ name, area }) {
  const first = esc(name || '').split(' ')[0] || 'there';
  const a = AREAS[area];
  const c = 'rep';
  return [
    {
      day: 0,
      subject: a ? `Your plan for “${a.name}”` : 'Welcome to Unbroken Closers',
      preheader: a ? 'One small step you can take this week.' : 'A two-minute sales lesson, starting now.',
      blocks: a ? [
        P(`Hi ${first},`),
        P(a.fear ? `You took the Fear Finder, and the fear showing up most for you is <b>${esc(a.name)}</b>. You’re not alone. Every closer I know has fought at least one of these.` : `You asked for a plan for your top area from the Unbroken Assessment: <b>${esc(a.name)}</b>.`),
        BOX(`<b>What it sounds like:</b> ${esc(a.says)}`),
        P(esc(a.story)),
        H('Your step this week'),
        P(esc(a.step)),
        P('That’s it. One step, done every day for a week, beats a notebook full of ideas you never use. Reply and tell me how it goes; I read every one.'),
        SIGN,
      ] : [
        P(`Hi ${first},`),
        P('Thanks for signing up. Over the next week I’ll send you four short lessons from the sales floor, each one something you can use the same day.'),
        P('Start here: the free Unbroken Assessment takes about five minutes and shows you which inner objection is costing you the most deals.'),
        BTN(u('assessment.html', c), 'Take the assessment'),
        SIGN,
      ],
    },
    {
      day: 2,
      subject: 'The three numbers top closers track',
      preheader: 'Keep score and you’ll see yourself winning before the paycheck does.',
      blocks: [
        P(`Hi ${first},`),
        P('Most salespeople can tell you their commission to the penny and can’t tell you their closing ratio. That’s backwards.'),
        P('Track three numbers every day: <b>conversations</b>, <b>appointments</b> and <b>sales</b>. On Friday, divide sales by conversations. That one number tells you whether you need more people to talk to or better conversations with the ones you have.'),
        P('Here’s a free tracker that does the math for you.'),
        BTN(u('daily-tracker.html', c), 'Open the Daily Tracker'),
        SIGN,
      ],
    },
    {
      day: 4,
      subject: 'Why I coach (the short version)',
      preheader: 'Knocked down, got back up, kept closing.',
      blocks: [
        P(`Hi ${first},`),
        P('I learned selling the hard way: on a car lot, in finance and insurance offices, and knocking on doors. Before that, the military taught me that people perform when they’re trained, held to a standard and recognized for doing it right.'),
        P('Along the way I lost nearly everything and had to start over. I wrote about it in my memoir, <i>Stripped Bare, But Unbroken</i>, because the objections that cost me the most deals were never the customer’s. They were the ones in my own head.'),
        P('That’s what Unbroken Closers coaches: the skills and the person.'),
        BTN(u('the-book.html', c), 'Read about the book'),
        SIGN,
      ],
    },
    {
      day: 6,
      subject: a && !a.fear ? `Your first lesson is waiting: ${a.name}` : 'Practice with people who get it',
      preheader: 'Live coaching every Tuesday, plus practice between calls.',
      blocks: [
        P(`Hi ${first},`),
        P('Reading about sales helps. Practicing with other closers, and getting coached on it live, is what actually changes your numbers.'),
        P(`That’s the Closer’s Circle: live coaching calls every Tuesday, the full Rebuttal Vault, the Inner Objections course${a && !a.fear ? ` (your first lesson is “${esc(a.name)}”)` : ''}, monthly challenges and a group that pushes you.`),
        P('It’s $79 a month. The first 10 founding members pay $49 a month, locked in for as long as they stay. Cancel any time.'),
        BTN(SKOOL, 'Join the Closer’s Circle'),
        SIGN,
      ],
    },
    {
      day: 9,
      subject: 'One favor (and something free for your manager)',
      preheader: 'A free workshop for your team and a signed book for your manager.',
      blocks: [
        P(`Hi ${first},`),
        P('If these lessons helped, your whole team would probably get something out of them too.'),
        P('I run a free 45-minute workshop at your team’s morning meeting, on site in Central Texas or by video anywhere. We work through the five objections costing your team deals this month, and every rep leaves with an Objection Armor Card. Your manager gets a signed copy of my book.'),
        P('Forward this email to your manager, or send them the link below.'),
        BTN(u('workshop.html', c), 'See the free workshop'),
        P('Thanks for reading this week. Keep showing up.'),
        SIGN,
      ],
    },
  ];
}

// Managers: Team Readiness Scorecard
function managerSequence({ name, company, result, rec }) {
  const first = esc(name || '').split(' ')[0] || 'there';
  const c = 'manager';
  const rows = result.areas.map((a) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${esc(a.name)}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;font-weight:bold">${a.value} / 5</td></tr>`).join('');
  const pri = result.priorities.map((a, i) => `<p style="margin:0 0 14px"><b>${i + 1}. ${esc(a.name)}</b> (${a.value}/5)<br>${esc(a.fix)}<br><a href="${esc(u(a.link, c))}" style="color:#d0202a">${esc(a.linkText)}</a></p>`).join('');
  return [
    {
      day: 0,
      subject: `${company ? esc(company) + ': ' : ''}Your Team Readiness Score is ${result.pct}%`,
      preheader: `${result.tier.label}. Here are your top three priorities.`,
      blocks: [
        P(`Hi ${first},`),
        H(`${result.pct}%: ${esc(result.tier.label)}`),
        P(esc(result.tier.text)),
        H('Your top three priorities'),
        pri,
        H('Every area'),
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;margin:0 0 16px">${rows}</table>`,
        H('What I’d suggest'),
        P(`<b>${esc(rec.name)}.</b> ${esc(rec.why)}`),
        BTN(u('book.html?session=team', c), 'Talk through your score with LJ'),
        P('Or reply to this email. It comes straight to me.'),
        SIGN,
      ],
    },
    {
      day: 2,
      subject: 'A 10-minute huddle that trains one skill a day',
      preheader: '30 days of morning huddles, already planned.',
      blocks: [
        P(`Hi ${first},`),
        P('The fastest fix for most teams isn’t a big training day. It’s ten focused minutes every morning: one number, one skill drilled for two minutes, one goal per rep.'),
        P('I put 30 days of them on one page so you don’t have to plan anything. Print it and run tomorrow’s.'),
        BTN(u('huddle-plan.html', c), 'Get the 30-Day Huddle Plan'),
        SIGN,
      ],
    },
    {
      day: 4,
      subject: 'What turnover is costing your store',
      preheader: 'Move three sliders and see the number.',
      blocks: [
        P(`Hi ${first},`),
        P('Dealership sales consultants turn over at about 67% a year, by one industry study. Every rep who walks out takes recruiting, training and months of missed deals with them.'),
        P('Workers who get meaningful recognition are 45% less likely to leave, according to Gallup and Workhuman. That’s why every Team Program includes a Closer of the Month award your top rep can hold.'),
        P('Plug your team into the calculator and see what keeping two more reps a year is worth.'),
        BTN(u('index.html#calculator', c), 'Run your numbers'),
        SIGN,
      ],
    },
    {
      day: 7,
      subject: 'A free workshop for your team (and a signed book for you)',
      preheader: '45 minutes at your morning meeting.',
      blocks: [
        P(`Hi ${first},`),
        P('If you want to see how your team actually handles objections, let me run a free 45-minute workshop at your morning meeting. On site in Central Texas, or by video anywhere.'),
        P('We’ll work through the five objections costing your team deals this month, every rep leaves with an Objection Armor Card, and you get a signed copy of my book, <i>Stripped Bare, But Unbroken</i>.'),
        BTN(u('book.html?session=workshop', c), 'Pick a morning'),
        SIGN,
      ],
    },
    {
      day: 10,
      subject: 'Founding teams lock in their rate',
      preheader: 'The first five teams keep their price for as long as they stay.',
      blocks: [
        P(`Hi ${first},`),
        P('Last note from me on this. The Team Program gives your reps two live trainings a month, AI practice between sessions, a weekly scorecard for you and a Closer of the Month award, printed and delivered.'),
        P('The first five teams keep their monthly price for as long as they stay, even when prices go up. In return I ask for honest feedback and, if the results are there, a testimonial.'),
        BTN(u('book.html?session=team', c), 'Book a 30-minute strategy call'),
        P('Either way, thanks for taking the scorecard. I hope it helps.'),
        SIGN,
      ],
    },
  ];
}

module.exports = { repSequence, managerSequence, AREAS };
