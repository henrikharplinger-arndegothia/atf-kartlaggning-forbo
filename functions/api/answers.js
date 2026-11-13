// Lists all stored answers. Requires ?token=<ADMIN_TOKEN> (Pages secret).
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.ADMIN_TOKEN || url.searchParams.get('token') !== env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }
  const items = [];
  let cursor;
  do {
    const page = await env.ATF_SVAR.list({ prefix: 'svar:', cursor });
    for (const k of page.keys) {
      const v = await env.ATF_SVAR.get(k.name);
      if (v) items.push(JSON.parse(v));
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  items.sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

  if (url.searchParams.get('format') === 'json') {
    return new Response(JSON.stringify(items, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const blocks = items.map(it => `
    <section><h2>${esc(it.answers['company-name'] || '(okänt företag)')} — ${esc(new Date(it.receivedAt).toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' }))}</h2>
    <pre>${esc(it.text || JSON.stringify(it.answers, null, 2))}</pre></section>`).join('');
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ATF-svar</title><style>body{font-family:system-ui;margin:16px;max-width:900px;background:#fff;color:#222}pre{white-space:pre-wrap;background:#f4f4f4;padding:12px;border-radius:6px}</style>
<h1>ATF-svar (${items.length})</h1><p><a href="?token=${esc(url.searchParams.get('token'))}&format=json">Ladda ner som JSON</a></p>${blocks || '<p>Inga svar ännu.</p>'}`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
