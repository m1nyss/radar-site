// Cloudflare Pages Function — CORS-прокси для nowcast.ru / meteoinfo.ru / meteorad.ru
// Файл лежит в /functions/proxy.js → автоматически доступен на /proxy
// Ничего настраивать не нужно: деплоится вместе с сайтом на Cloudflare Pages.
// Заодно помогает пользователям, у которых напрямую заблокирован доступ к .ru-доменам
// (например, из-за геоблокировки провайдером) — запрос идёт с серверов Cloudflare.

const ALLOW_ORIGINS = new Set([
  'https://www.nowcast.ru',
  'https://meteoinfo.ru',
  'https://meteorad.ru',
]);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const url = new URL(request.url);
  const target = url.searchParams.get('url');
  if (!target) {
    return new Response('add ?url=', { status: 400, headers: CORS });
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return new Response('bad url', { status: 400, headers: CORS });
  }
  if (!ALLOW_ORIGINS.has(parsed.origin)) {
    return new Response('origin not allowed', { status: 403, headers: CORS });
  }

  try {
    const upstream = await fetch(target, { headers: { 'User-Agent': 'xcors-proxy' } });
    const headers = new Headers(upstream.headers);
    for (const k in CORS) headers.set(k, CORS[k]);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (e) {
    return new Response('upstream error: ' + e.message, { status: 502, headers: CORS });
  }
}
