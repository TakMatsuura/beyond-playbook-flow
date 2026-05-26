/**
 * 管理ダッシュボード用 KV集計 API
 * - GET /api/admin-stats?days=30
 * - Basic Auth は _middleware.js 側で /admin/* と /api/admin-stats を保護
 * - 過去N日分のPV/UU/申込/メルマガ/パス別 を返す
 */

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get('days') || '30', 10), 90);

  if (!env.FLOW_ANALYTICS) {
    return jsonRes({ ok: false, error: 'KV not bound' }, 500);
  }

  const today = new Date();
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    dates.push(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(d));
  }

  const daily = [];
  const pathMap = {};
  let totalPV = 0, totalUU = 0, totalSubmit = 0, totalNewsletter = 0;

  for (const date of dates) {
    const pv = parseInt((await env.FLOW_ANALYTICS.get(`pv:${date}`)) || '0', 10);
    const uu = parseInt((await env.FLOW_ANALYTICS.get(`uucount:${date}`)) || '0', 10);
    const submit = parseInt((await env.FLOW_ANALYTICS.get(`submit:${date}`)) || '0', 10);
    const newsletter = parseInt((await env.FLOW_ANALYTICS.get(`newsletter_count:${date}`)) || '0', 10);
    daily.push({ date, pv, uu, submit, newsletter });
    totalPV += pv; totalUU += uu; totalSubmit += submit; totalNewsletter += newsletter;

    const pathList = await env.FLOW_ANALYTICS.list({ prefix: `path:${date}:` });
    for (const k of pathList.keys) {
      const cnt = parseInt(await env.FLOW_ANALYTICS.get(k.name) || '0', 10);
      const p = k.name.replace(`path:${date}:`, '');
      pathMap[p] = (pathMap[p] || 0) + cnt;
    }
  }

  const paths = Object.entries(pathMap).map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count);

  return jsonRes({
    ok: true,
    range: { from: dates[0], to: dates[dates.length - 1], days },
    totals: { pv: totalPV, uu: totalUU, submit: totalSubmit, newsletter: totalNewsletter },
    cvr: totalUU > 0 ? Math.round((totalSubmit / totalUU) * 10000) / 100 : 0,
    daily,
    paths: paths.slice(0, 20),
  }, 200);
}

function jsonRes(obj, status) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
