/**
 * FLOW ヒアリング申込フォーム受付
 * - POST /api/submit
 * - 申込内容を LINE WORKS Bot で松浦さんに即時通知 (DM)
 *
 * Required env vars (Pages > Settings > Environment variables / Secrets):
 *   LINE_WORKS_CLIENT_ID
 *   LINE_WORKS_CLIENT_SECRET
 *   LINE_WORKS_SERVICE_ACCOUNT
 *   LINE_WORKS_BOT_ID
 *   LINE_WORKS_MATSUURA_ID
 *   LINE_WORKS_PRIVATE_KEY  (PEM全文・複数行)
 */

import { SignJWT, importPKCS8 } from 'jose';

const AUTH_BASE = 'https://auth.worksmobile.com/oauth2/v2.0';
const API_BASE = 'https://www.worksapis.com/v1.0';

export async function onRequestPost(context) {
  const { env, request } = context;

  // CORS (同一オリジンの想定だが保険)
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
  };

  try {
    const data = await request.json();

    // 必須チェック
    if (!data.name || !data.company || !data.contact) {
      return new Response(
        JSON.stringify({ ok: false, error: 'お名前・会社名・連絡先は必須です' }),
        { status: 400, headers: cors }
      );
    }

    // JST タイムスタンプ
    const jstNow = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    // 通知メッセージ生成
    const msg = formatNotification(data, jstNow);

    // LINE WORKS Bot に DM 送信
    const accessToken = await getAccessToken(env);
    await sendDirectMessage(env, accessToken, env.LINE_WORKS_MATSUURA_ID, msg);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: cors,
    });
  } catch (err) {
    console.error('[submit] error:', err.message, err.stack);
    return new Response(
      JSON.stringify({ ok: false, error: err.message || 'Internal error' }),
      { status: 500, headers: cors }
    );
  }
}

// プリフライト用
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Service Account JWT → Access Token
 */
async function getAccessToken(env) {
  const privateKeyPem = env.LINE_WORKS_PRIVATE_KEY;
  if (!privateKeyPem) {
    throw new Error('LINE_WORKS_PRIVATE_KEY env var is not set');
  }
  const privateKey = await importPKCS8(privateKeyPem, 'RS256');
  const now = Math.floor(Date.now() / 1000);

  const assertion = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(env.LINE_WORKS_CLIENT_ID)
    .setSubject(env.LINE_WORKS_SERVICE_ACCOUNT)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const params = new URLSearchParams({
    assertion,
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    client_id: env.LINE_WORKS_CLIENT_ID,
    client_secret: env.LINE_WORKS_CLIENT_SECRET,
    scope: 'bot,bot.message',
  });

  const res = await fetch(`${AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json.access_token;
}

/**
 * LINE WORKS Bot - 個人DM 送信
 */
async function sendDirectMessage(env, token, userId, text) {
  const body = { content: { type: 'text', text } };
  const res = await fetch(
    `${API_BASE}/bots/${env.LINE_WORKS_BOT_ID}/users/${userId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`sendDirectMessage failed: ${res.status} ${txt}`);
  }
  return res.json();
}

/**
 * 通知メッセージ整形
 */
function formatNotification(d, jstNow) {
  const urgencyEmoji = {
    '今週中に動きたい (緊急)': '🚨🚨🚨',
    '2週間以内に動きたい': '🚨',
    '1ヶ月以内に動きたい': '⏰',
    '情報収集段階・タイミングは未定': '📝',
  };
  const emoji = urgencyEmoji[d.urgency] || '📥';

  return [
    `${emoji} FLOW 新規ヒアリング申込`,
    ``,
    `📅 受付: ${jstNow} JST`,
    ``,
    `━━━ 申込者情報 ━━━`,
    `👤 お名前: ${d.name}`,
    `🏢 会社名: ${d.company}`,
    d.industry ? `🏭 業種: ${d.industry}` : null,
    d.revenue ? `💰 年商: ${d.revenue}` : null,
    `━━━━━━━━━━━━━━━`,
    ``,
    `📞 ご連絡方法: ${d.contact_method || '(未選択)'}`,
    `📲 ご連絡先: ${d.contact}`,
    d.urgency ? `⚡ 緊急度: ${d.urgency}` : null,
    ``,
    d.message
      ? `━━━ ご相談内容 ━━━\n${d.message}\n━━━━━━━━━━━━━━━`
      : null,
    ``,
    `→ 1時間以内に折り返し対応をお願いします`,
    ``,
    `🌐 https://flow-beyond-playbook.pages.dev/apply/`,
  ]
    .filter((l) => l !== null)
    .join('\n');
}
