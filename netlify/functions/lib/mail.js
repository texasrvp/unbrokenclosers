// Shared email helpers for Unbroken Closers (Resend, no SDK).
//
// Netlify env vars (Site settings → Environment variables):
//   RESEND_API_KEY      required to send anything
//   UC_EMAIL_FROM       e.g. "Coach LJ <lj@unbrokenclosers.com>" (the domain must be verified in Resend)
//   UC_NOTIFY_EMAIL     where new manager leads are sent (default hello@unbrokenclosers.com)
//   UC_MAILING_ADDRESS  your mailing address or P.O. box; US law (CAN-SPAM) wants one in marketing emails
//   UC_EMAIL_SECRET     optional; signs unsubscribe links (falls back to a hash of the Resend key)

const crypto = require('crypto');

const SITE = (process.env.URL || 'https://unbrokenclosers.com').replace(/\/$/, '');
const FROM = () => process.env.UC_EMAIL_FROM || 'Coach LJ <hello@unbrokenclosers.com>';
const NOTIFY = () => process.env.UC_NOTIFY_EMAIL || 'hello@unbrokenclosers.com';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
const validEmail = (e) => /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i.test(String(e || ''));

function secret() {
  const s = process.env.UC_EMAIL_SECRET || process.env.RESEND_API_KEY || '';
  return crypto.createHash('sha256').update('uc-unsub:' + s).digest();
}
const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

function signToken(payload) {
  const body = b64u(JSON.stringify(payload));
  const sig = b64u(crypto.createHmac('sha256', secret()).update(body).digest()).slice(0, 22);
  return body + '.' + sig;
}
function readToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const want = b64u(crypto.createHmac('sha256', secret()).update(body).digest()).slice(0, 22);
  if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  try { return JSON.parse(fromB64u(body).toString('utf8')); } catch (e) { return null; }
}

// Wrap paragraphs in a simple, readable email that works in every client.
function layout({ preheader, blocks, unsubUrl }) {
  const addr = process.env.UC_MAILING_ADDRESS ? esc(process.env.UC_MAILING_ADDRESS) + '<br>' : '';
  const html = `<!doctype html><html><body style="margin:0;background:#f3f4f1;font-family:Arial,Helvetica,sans-serif;color:#1d2a36">
<span style="display:none;max-height:0;overflow:hidden">${esc(preheader || '')}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f1"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:6px;overflow:hidden">
<tr><td style="background:#12233b;padding:16px 24px;color:#f3f4f1;font-weight:bold;letter-spacing:1px;font-size:14px;text-transform:uppercase">Unbroken Closers</td></tr>
<tr><td style="padding:24px;font-size:16px;line-height:1.6">${blocks.join('\n')}</td></tr>
<tr><td style="padding:16px 24px;background:#f7f7f4;font-size:12px;line-height:1.5;color:#6b7680">
Unbroken Closers · Field sales coaching · Veteran-owned<br>${addr}
Coaching, not counseling. If you’re struggling, please reach out to a licensed counselor. In crisis, call or text 988.<br>
${unsubUrl ? `<a href="${esc(unsubUrl)}" style="color:#6b7680">Unsubscribe</a> · ` : ''}<a href="${SITE}/privacy.html" style="color:#6b7680">Privacy</a>
</td></tr></table></td></tr></table></body></html>`;
  return html;
}

// Building blocks for email bodies
const P = (t) => `<p style="margin:0 0 16px">${t}</p>`;
const H = (t) => `<h2 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#12233b">${t}</h2>`;
const BTN = (href, label) => `<p style="margin:20px 0"><a href="${esc(href)}" style="display:inline-block;background:#d9504e;color:#ffffff;font-weight:bold;padding:12px 20px;border-radius:4px;text-decoration:none">${esc(label)}</a></p>`;
const BOX = (t) => `<div style="margin:0 0 16px;padding:14px 16px;background:#f3f4f1;border-left:4px solid #d9504e">${t}</div>`;
const SIGN = P('Coach LJ<br><span style="color:#6b7680;font-size:14px">Unbroken Closers</span>');

function textVersion(html) {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|h2|div|tr)>/gi, '\n\n')
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function sendEmail({ to, subject, html, scheduledAt, replyTo, tags, unsubUrl }) {
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key) return { ok: false, reason: 'not_configured' };
  const body = { from: FROM(), to: [to], subject, html, text: textVersion(html) };
  if (scheduledAt) body.scheduled_at = scheduledAt;
  if (replyTo) body.reply_to = replyTo;
  if (tags) body.tags = tags;
  if (unsubUrl) body.headers = { 'List-Unsubscribe': `<${unsubUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, reason: 'send_failed', status: res.status, detail: data.message || data.name || '' };
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, reason: 'network', detail: e.message };
  }
}

async function cancelEmail(id) {
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key || !/^[\w-]{8,64}$/.test(id)) return false;
  try {
    const res = await fetch(`https://api.resend.com/emails/${id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${key}` } });
    return res.ok;
  } catch (e) { return false; }
}

// Morning (about 9 AM Central) n days from now, as ISO. Day 0 = send now.
function sendDay(n, now = new Date()) {
  if (!n) return null;
  const d = new Date(now.getTime() + n * 86400000);
  d.setUTCHours(14, 5, 0, 0);
  return d.toISOString();
}

module.exports = { SITE, FROM, NOTIFY, esc, clip, validEmail, signToken, readToken, layout, P, H, BTN, BOX, SIGN, textVersion, sendEmail, cancelEmail, sendDay };
