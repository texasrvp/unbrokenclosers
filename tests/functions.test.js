const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

process.env.RESEND_API_KEY = 're_test_key';
process.env.URL = 'https://unbrokenclosers.com';

// Fake Resend: records every call
let calls = [];
let fail = false;
global.fetch = async (url, opts = {}) => {
  const body = opts.body ? JSON.parse(opts.body) : null;
  calls.push({ url, body, method: opts.method });
  if (fail) return { ok: false, status: 422, json: async () => ({ message: 'domain not verified' }) };
  return { ok: true, status: 200, json: async () => ({ id: 'em_' + calls.length + '_abcdef' }) };
};

const nurture = require('../netlify/functions/nurture');
const unsub = require('../netlify/functions/unsubscribe');
const mail = require('../netlify/functions/lib/mail');
const SCORE = require('../js/scorecard-core.js');
const SC = require('../data/scorecard.json');

const post = (b, headers = {}) => nurture.handler({ httpMethod: 'POST', body: JSON.stringify(b), headers });

test('rep sequence: 5 emails, first sent now, the rest scheduled in order', async () => {
  calls = []; fail = false;
  const r = await post({ track: 'rep', email: 'rep1@example.com', name: 'Jamie Lee', area: 'scarcity' });
  assert.strictEqual(r.statusCode, 200, r.body);
  const sends = calls.filter((c) => c.url === 'https://api.resend.com/emails');
  assert.strictEqual(sends.length, 5);
  const first = sends[sends.length - 1].body; // created last
  assert.ok(!first.scheduled_at, 'first email goes now');
  assert.match(first.subject, /Your plan for/);
  assert.match(first.html, /Hi Jamie/);
  const times = sends.slice(0, 4).map((s) => Date.parse(s.body.scheduled_at)).reverse();
  for (let i = 1; i < times.length; i++) assert.ok(times[i] > times[i - 1], 'later emails later');
  assert.ok(times[3] - Date.now() < 30 * 86400000, 'within Resend 30-day limit');
  assert.ok(first.headers['List-Unsubscribe'].includes('/api/unsubscribe?t='));
  const tok = first.html.match(/unsubscribe\?t=([\w.-]+)/)[1];
  const data = mail.readToken(tok);
  assert.strictEqual(data.e, 'rep1@example.com');
  assert.strictEqual(data.ids.length, 4, 'email 1 can cancel the 4 that follow');
});

test('fear finder result gets its own plan email', async () => {
  calls = [];
  const r = await post({ track: 'rep', email: 'fear1@example.com', name: 'Sam', area: 'fear_closing' });
  assert.strictEqual(r.statusCode, 200, r.body);
  const first = calls.filter((c) => c.url === 'https://api.resend.com/emails').pop().body;
  assert.match(first.subject, /The Fear of Closing/);
  assert.match(first.html, /You took the Fear Finder/);
  assert.match(first.html, /Coach LJ/);
  assert.doesNotMatch(first.html, /Stephens/);
});

test('manager scorecard: report + 4 follow-ups + note to LJ', async () => {
  calls = [];
  const r = await post({ track: 'manager', email: 'gm@example.com', name: 'Pat Smith', company: 'Example Ford', team_size: '6 to 15', answers: [1, 2, 3, 4, 5, 1, 2, 3, 4, 5] });
  assert.strictEqual(r.statusCode, 200, r.body);
  const sends = calls.filter((c) => c.url === 'https://api.resend.com/emails');
  assert.strictEqual(sends.length, 6);
  const report = sends[4].body;
  assert.match(report.subject, /Example Ford: Your Team Readiness Score is 60%/);
  assert.match(report.html, /New-hire ramp/);
  const note = sends[5].body;
  assert.deepStrictEqual(note.to, ['hello@unbrokenclosers.com']);
  assert.strictEqual(note.reply_to, 'gm@example.com');
});

test('rejects bad input and spam', async () => {
  assert.strictEqual((await post({ track: 'rep', email: 'nope' })).statusCode, 400);
  assert.strictEqual((await post({ track: 'rep', email: 'x@example.com', name: 'visit http://spam.biz' })).statusCode, 400);
  assert.strictEqual((await post({ track: 'manager', email: 'y@example.com', answers: [1, 2] })).statusCode, 400);
  calls = [];
  assert.strictEqual((await post({ track: 'rep', email: 'bot@example.com', company_url: 'x' })).statusCode, 200);
  assert.strictEqual(calls.length, 0, 'honeypot sends nothing');
  const r = await post({ track: 'rep', email: 'esc@example.com', name: 'Al <b>' });
  assert.strictEqual(r.statusCode, 400);
});

test('same email twice in a row is refused', async () => {
  await post({ track: 'rep', email: 'twice@example.com', name: 'A' });
  const r = await post({ track: 'rep', email: 'twice@example.com', name: 'A' });
  assert.strictEqual(r.statusCode, 429);
});

test('Resend failure on the first email returns an error', async () => {
  fail = true;
  const r = await post({ track: 'rep', email: 'fail@example.com', name: 'B' });
  fail = false;
  assert.strictEqual(r.statusCode, 502);
});

test('no key configured returns 503', async () => {
  const k = process.env.RESEND_API_KEY; delete process.env.RESEND_API_KEY;
  const r = await post({ track: 'rep', email: 'nokey@example.com', name: 'C' });
  process.env.RESEND_API_KEY = k;
  assert.strictEqual(r.statusCode, 503);
});

test('unsubscribe cancels only emails that have not gone out', async () => {
  calls = [];
  const future = Math.floor(Date.now() / 60000) + 600, past = Math.floor(Date.now() / 60000) - 600;
  const t = mail.signToken({ e: 'u@example.com', ids: ['idfuture1~' + future, 'idpast01~' + past] });
  const r = await unsub.handler({ queryStringParameters: { t } });
  assert.match(r.body, /unsubscribed/);
  const cancels = calls.filter((c) => /\/cancel$/.test(c.url)).map((c) => c.url);
  assert.deepStrictEqual(cancels, ['https://api.resend.com/emails/idfuture1/cancel']);
  const bad = await unsub.handler({ queryStringParameters: { t: t.slice(0, -2) + 'xx' } });
  assert.match(bad.body, /didn’t work/);
});

test('scorecard scoring and recommendations', () => {
  const low = SCORE.score(SC, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  assert.strictEqual(low.pct, 20);
  assert.strictEqual(low.priorities.length, 3);
  assert.strictEqual(SCORE.recommend(low, '16 to 30').key, 'team');
  assert.strictEqual(SCORE.recommend(low, 'Just me').key, 'circle');
  const high = SCORE.score(SC, [5, 5, 5, 5, 5, 5, 5, 4, 4, 4]);
  assert.strictEqual(SCORE.recommend(high, '6 to 15').key, 'bootcamp');
  const mid = SCORE.score(SC, [3, 3, 3, 3, 4, 4, 3, 4, 3, 4]);
  assert.strictEqual(SCORE.recommend(mid, '6 to 15').key, 'workshop');
});

test('assessment areas JSON matches the assessment page', () => {
  global.window = {};
  const src = fs.readFileSync(path.join(__dirname, '../js/assessment.js'), 'utf8');
  eval(src.slice(0, src.indexOf('(function () {')));
  const areas = require('../data/assessment-areas.json');
  assert.deepStrictEqual(Object.keys(areas).sort(), Object.keys(window.UC_OBJECTIONS).sort());
  for (const k in areas) assert.strictEqual(areas[k].step, window.UC_OBJECTIONS[k].step);
});

test('every library objection has a generated page in the sitemap', () => {
  const lib = require('../data/library.json');
  const sm = fs.readFileSync(path.join(__dirname, '../sitemap.xml'), 'utf8');
  for (const o of lib) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', `objection-${o.slug}.html`)), o.slug);
    assert.ok(sm.includes(`objection-${o.slug}.html`), o.slug + ' in sitemap');
  }
});
