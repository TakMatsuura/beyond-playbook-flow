/**
 * 全リクエストをKVでカウント (アクセス解析) + 管理エリアのBasic Auth保護
 * - 日付別 (JST) page view, unique visitor
 * - /api/*, /assets/*, ロボット, faviconはカウント除外
 * - /admin/* + /api/admin-stats は Basic Auth (env.ADMIN_USER / ADMIN_PASS)
 */

const COUNTED_HOST_PATTERN = /^(flow\.beyond-holdings\.co\.jp|flow-beyond-playbook\.pages\.dev)$/;

// クローラー対象のシステムパス (実在するものも・PVカウント対象外)
const EXCLUDE_PATHS = new Set([
  '/ads.txt', '/app-ads.txt', '/sellers.json',
  '/robots.txt', '/sitemap.xml',
  '/.well-known/security.txt',
  '/wp-login.php', '/wp-admin/', '/.env',
]);

const PROTECTED_PREFIXES = ['/admin', '/api/admin-stats'];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // ===== Basic Auth (管理エリア保護) =====
  if (PROTECTED_PREFIXES.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p + '?'))) {
    const auth = checkBasicAuth(context.request, context.env);
    if (auth !== true) return auth;
  }

  const response = await context.next();

  try {
    const host = url.hostname;
    const method = context.request.method;
    const userAgent = context.request.headers.get('user-agent') || '';
    const ip = context.request.headers.get('cf-connecting-ip') || 'unknown';
    const cookieHeader = context.request.headers.get('cookie') || '';

    // ★関係者用 Cookie オプトアウト★ : ?internal=1 でCookie発行 → 以後カウント除外
    if (url.searchParams.get('internal') === '1') {
      const newHeaders = new Headers(response.headers);
      newHeaders.append('Set-Cookie', `flow_internal=1; Path=/; Max-Age=${365*24*60*60}; SameSite=Lax`);
      return new Response(response.body, { status: response.status, headers: newHeaders });
    }

    // カウント対象外を弾く
    if (method !== 'GET') return response;
    if (!COUNTED_HOST_PATTERN.test(host)) return response;
    if (path.startsWith('/api/')) return response;
    if (path.startsWith('/admin')) return response;
    if (path.startsWith('/assets/')) return response;
    if (path.includes('/favicon')) return response;
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.svg') || path.endsWith('.css') || path.endsWith('.js')) return response;
    if (EXCLUDE_PATHS.has(path)) return response;
    if (path.startsWith('/wp-')) return response;
    if (/bot|crawler|spider|monitor|preview|fetch|wget|curl|httpie|scrap|index|axios|python/i.test(userAgent)) return response;
    if (cookieHeader.includes('flow_internal=1')) return response;

    const jstDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());

    context.waitUntil(recordHit(context.env, jstDate, path, ip));
  } catch (e) {
    console.error('[_middleware] hit recording error:', e.message);
  }

  return response;
}

function checkBasicAuth(request, env) {
  const user = env.ADMIN_USER;
  const pass = env.ADMIN_PASS;
  if (!user || !pass) {
    return new Response('Admin credentials not configured', { status: 503 });
  }
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="FLOW Admin"' },
    });
  }
  try {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(':');
    if (idx < 0) throw new Error('bad');
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    if (u === user && p === pass) return true;
  } catch {}
  return new Response('Invalid credentials', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="FLOW Admin"' },
  });
}

// ★ver0.2 (2026-05-27): KV PV計測を ★Cloudflare Web Analytics★ に移管★
//   理由: 全PV毎に4 PUT → 1日1000PUT制限即超過 → Cloudflare $5課金通知
//   対策: PV/UU/path計測は ★HTMLに <script> タグで Cloudflare Web Analytics★
//          (★無料無制限・国/デバイス/滞在時間 等 高機能)
//   この関数は ★no-op化★ (★newsletter/submit等の重要KV PUT は そっち側で継続)
async function recordHit(env, date, path, ip) {
  // ★KV PV計測 廃止 - Cloudflare Web Analytics に移行★
  return;
}

async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}
