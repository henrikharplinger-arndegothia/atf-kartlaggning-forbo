// Stores one submitted ATF questionnaire in KV (binding: ATF_SVAR).
export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Ogiltig data' }, 400); }
  if (!body || typeof body !== 'object' || !body.answers) return json({ ok: false, error: 'Svar saknas' }, 400);

  const raw = JSON.stringify(body);
  if (raw.length > 200_000) return json({ ok: false, error: 'För stor' }, 413);

  const now = new Date().toISOString();
  const company = String(body.answers['company-name'] || 'okant').slice(0, 60);
  const id = `svar:${now}:${crypto.randomUUID().slice(0, 8)}`;
  await env.ATF_SVAR.put(id, JSON.stringify({ receivedAt: now, ...body }), {
    metadata: { receivedAt: now, company },
  });
  return json({ ok: true, id, receivedAt: now });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}
