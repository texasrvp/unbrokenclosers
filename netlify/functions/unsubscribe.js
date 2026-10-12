// GET /api/unsubscribe?t=<signed token>
// Cancels every follow-up email still scheduled after the one that was clicked.
// POST does the same (for one-click unsubscribe from email apps).

const { readToken, cancelEmail, esc, SITE } = require('./lib/mail');

function page(title, text) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    body: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)} | Unbroken Closers</title>
<style>body{margin:0;font-family:Arial,Helvetica,sans-serif;background:#f3f4f1;color:#1d2a36}main{max-width:520px;margin:12vh auto;padding:32px 24px;background:#fff;border-radius:6px}h1{font-size:26px;margin:0 0 12px;color:#12233b}p{line-height:1.6}a{color:#d9504e}</style></head>
<body><main><h1>${esc(title)}</h1><p>${text}</p><p><a href="${SITE}/">Back to Unbroken Closers</a></p></main></body></html>`,
  };
}

exports.handler = async (event) => {
  const t = (event.queryStringParameters && event.queryStringParameters.t) || '';
  const data = readToken(t);
  if (!data || !data.e) return page('That link didn’t work', 'The unsubscribe link looks incomplete. Reply to any email and LJ will take you off the list by hand.');
  // Each entry is "<resend id>~<send time in minutes>". Skip emails that already went out.
  const nowMin = Date.now() / 60000;
  const ids = (Array.isArray(data.ids) ? data.ids.slice(0, 10) : [])
    .map((x) => String(x).split('~')).filter(([, m]) => !m || +m > nowMin).map(([id]) => id);
  const done = await Promise.all(ids.map(cancelEmail));
  const left = done.filter((x) => !x).length;
  console.log('[unsubscribe]', JSON.stringify({ cancelled: done.length - left, failed: left }));
  return page('You’re unsubscribed', left
    ? `We stopped what we could, but ${left} email${left === 1 ? '' : 's'} may still arrive. Reply to any of them and LJ will remove you by hand.`
    : `You won’t get any more of these emails at ${esc(data.e)}. Thanks for reading.`);
};
