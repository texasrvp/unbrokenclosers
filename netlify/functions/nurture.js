// POST /api/nurture
// Starts the follow-up email sequence for someone who just used a free tool.
//   { track: "rep",     email, name, area?, role?, source }                 assessment, quiz, newsletter
//   { track: "manager", email, name, company?, team_size?, answers:[10], source }   Team Readiness Scorecard
//
// Email 1 goes out now; the rest are scheduled in Resend (up to 30 days ahead).
// Later emails are created first, so each email's unsubscribe link can cancel
// every email that comes after it. No database needed.

const { NOTIFY, esc, clip, validEmail, signToken, layout, P, sendEmail, cancelEmail, sendDay, SITE } = require('./lib/mail');
const { repSequence, managerSequence, AREAS } = require('./lib/sequences');
const SCORE = require('../../js/scorecard-core.js');
const SCORECARD = require('../../data/scorecard.json');

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });

// Light abuse guard per warm function instance
const recent = new Map();
function tooMany(key) {
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > 10 * 60000) recent.delete(k);
  if (recent.has(key)) return true;
  recent.set(key, now);
  return false;
}

async function startSequence(to, emails, track) {
  const ids = [];
  const results = [];
  for (let i = emails.length - 1; i >= 0; i--) {
    const m = emails[i];
    const token = signToken({ e: to, ids: ids.slice() });
    const unsubUrl = `${SITE}/api/unsubscribe?t=${token}`;
    const when = sendDay(m.day);
    const r = await sendEmail({
      to, subject: m.subject, html: layout({ preheader: m.preheader, blocks: m.blocks, unsubUrl }),
      scheduledAt: when, unsubUrl, tags: [{ name: 'sequence', value: track }, { name: 'step', value: String(i + 1) }],
    });
    results.unshift(r);
    if (r.ok && r.id && when) ids.unshift(r.id + '~' + Math.floor(Date.parse(when) / 60000));
    if (!r.ok && i === 0) {
      // The welcome email failed: don't leave the follow-ups scheduled on their own
      await Promise.all(ids.map((x) => cancelEmail(x.split('~')[0])));
      return { ok: false, reason: r.reason, detail: r.detail };
    }
  }
  return { ok: true, scheduled: results.filter((r) => r.ok).length };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  let b;
  try { b = JSON.parse(event.body || '{}'); } catch (e) { return reply(400, { error: 'Invalid request' }); }
  if (b.company_url) return reply(200, { ok: true }); // honeypot

  const email = clip(b.email, 200).toLowerCase();
  const name = clip(b.name, 80);
  if (!validEmail(email)) return reply(400, { error: 'Enter a valid email.' });
  if (/https?:|www\.|<|>/i.test(name + ' ' + (b.company || ''))) return reply(400, { error: 'Please use your name only.' });
  const ip = (event.headers && (event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'])) || '';
  if (tooMany(email) || (ip && tooMany('ip:' + ip + ':' + (b.track || '')))) return reply(429, { error: 'You’re already signed up. Check your inbox.' });

  if (!process.env.RESEND_API_KEY) return reply(503, { error: 'Email isn’t set up yet.', reason: 'not_configured' });

  const track = b.track === 'manager' ? 'manager' : 'rep';
  let emails;
  let summary = null;
  if (track === 'manager') {
    const answers = Array.isArray(b.answers) ? b.answers.slice(0, SCORECARD.areas.length) : [];
    if (answers.length !== SCORECARD.areas.length) return reply(400, { error: 'Answer every question first.' });
    const result = SCORE.score(SCORECARD, answers);
    const teamSize = SCORE.SIZES.includes(b.team_size) ? b.team_size : '6 to 15';
    const rec = SCORE.recommend(result, teamSize);
    const company = clip(b.company, 100);
    emails = managerSequence({ name, company, result, rec });
    summary = { result, rec, company, teamSize };
  } else {
    const area = AREAS[b.area] ? b.area : null;
    emails = repSequence({ name, area });
  }

  const out = await startSequence(email, emails, track);
  if (!out.ok) {
    console.error('[nurture] send failed', out.reason, out.detail || '');
    return reply(502, { error: 'We couldn’t send that email. Try again in a minute.', reason: out.reason });
  }

  // Tell LJ about every new manager lead
  if (summary) {
    const { result, rec, company, teamSize } = summary;
    const low = result.priorities.map((a) => `${esc(a.name)} (${a.value}/5)`).join(', ');
    await sendEmail({
      to: NOTIFY(), replyTo: email,
      subject: `New scorecard: ${company || name || email} scored ${result.pct}%`,
      html: layout({ preheader: 'A manager just took the Team Readiness Scorecard.', blocks: [
        P(`<b>${esc(name || '(no name)')}</b> · ${esc(email)}${company ? ' · ' + esc(company) : ''} · team size ${esc(teamSize)}`),
        P(`<b>Score:</b> ${result.pct}% (${esc(result.tier.label)})<br><b>Lowest areas:</b> ${low}<br><b>Suggested:</b> ${esc(rec.name)}`),
        P(`Phone: ${esc(clip(b.phone, 30) || 'not given')}<br>Source: ${esc(clip(b.source, 60))}`),
        P('Reply to this email to answer them directly. They’re now getting the 5-email manager follow-up.'),
      ] }),
    });
  }

  return reply(200, { ok: true, scheduled: out.scheduled });
};
