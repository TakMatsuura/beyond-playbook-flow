# FLOW ── お金の流れを、止めない。

BEYOND Playbook の第1サイト。中小企業の資金繰り・銀行交渉・補助金活用に伴走するサービスのLP。

- **本番URL**: https://flow.beyond-holdings.co.jp
- **ステージング**: https://flow-beyond-playbook.pages.dev
- **位置付け**: BEYOND Playbook 9サイト中、最初の本番運用サイト
- **技術スタック**: Vanilla HTML + Cloudflare Pages + KV (FLOW_ANALYTICS) + Pages Functions + LINE WORKS Bot

## ディレクトリ構成

```
beyond-playbook-flow/
├── index.html                          # メインLP (12セクション)
├── 404.html                            # 404エラーページ
├── check/index.html                    # 1分財務体力チェック (5問)
├── apply/index.html                    # ヒアリング申込フォーム
├── privacy/index.html                  # プライバシーポリシー
├── articles/
│   ├── index.html                      # 記事一覧 (6本)
│   ├── bank-loan-rejected/
│   ├── rescheduling-before-bs-pl/
│   ├── representative-handover-100days/
│   ├── tax-accountant-relationship/
│   ├── subsidies-2026/
│   └── banker-3-numbers/               # 6本目 (2026-05-26 追加)
├── admin/index.html                    # 管理ダッシュボード (Basic Auth)
├── assets/
│   ├── beyond_logo.png
│   ├── favicon.png
│   └── og-image.svg                    # SNSシェア用OGP画像 (1200x630)
├── functions/
│   ├── _middleware.js                  # KVアクセスカウント + Basic Auth (admin/)
│   └── api/
│       ├── submit.js                   # フォーム受付→LINE WORKS DM
│       ├── newsletter.js               # メルマガ登録 (中間CV)
│       ├── daily-report.js             # 日次レポート (GH Actions cron 7時)
│       ├── weekly-report.js            # 週次レポート (GH Actions cron 月7時)
│       └── admin-stats.js              # 管理ダッシュボード用JSON
├── .github/workflows/
│   ├── daily-report.yml                # 毎日 22:00 UTC = 7:00 JST
│   └── weekly-report.yml               # 月曜 22:00 UTC = 月曜 7:00 JST
├── robots.txt
├── sitemap.xml
├── wrangler.toml
└── package.json
```

## Cloudflare Pages 環境変数 (Secrets)

| Key | 用途 |
|---|---|
| `LINE_WORKS_CLIENT_ID` | LINE WORKS App Client ID |
| `LINE_WORKS_CLIENT_SECRET` | LINE WORKS App Client Secret |
| `LINE_WORKS_SERVICE_ACCOUNT` | LINE WORKS Service Account |
| `LINE_WORKS_BOT_ID` | `12320538` (BEYOND Playbook Bot) |
| `LINE_WORKS_PRIVATE_KEY` | Service Account 用 PKCS8 鍵 |
| `LINE_WORKS_MATSUURA_ID` | `t-matsuura@beyond-holdings` |
| `DAILY_REPORT_KEY` | 日次/週次レポート呼び出し認証 |
| **`ADMIN_USER`** | **★追加要★ /admin/ Basic認証 ユーザ名** |
| **`ADMIN_PASS`** | **★追加要★ /admin/ Basic認証 パスワード** |

KV Binding: `FLOW_ANALYTICS` (id: `d5f6a0a06f0e4682a865a475d12a0395`)

## 解析・通知

- **GA4**: G-PJY2SKCX2L (全HTMLに `gtag.js` 埋め込み済)
- **Search Console**: メタタグ認証 + sitemap.xml 登録済
- **CTAクリックトラッキング**: `data-track` 属性 + 自動検出 (apply/, check/, tel:, mailto:, external link)
- **スクロール深度**: 25/50/75/100% 発火
- **アクセスKV集計**: middleware で日次 PV/UU/path 集計 (?internal=1 で関係者cookie除外)
- **日次レポート**: 毎朝 7:00 JST に松浦さんへ LINE WORKS DM
- **週次レポート**: 毎週月曜 7:00 JST に前週比サマリを LINE WORKS DM
- **管理ダッシュボード**: https://flow.beyond-holdings.co.jp/admin/ (Basic Auth)

## 構造化データ (JSON-LD)

- **トップ**: Organization + WebSite + FAQPage
- **記事**: Article × 6本
- **記事一覧**: ItemList
- **診断**: WebApplication
- **申込**: ContactPage
- **プライバシー**: WebPage

## ローカル確認

```bash
# ブラウザで開く
explorer index.html

# wrangler でローカル実行 (Functions 含む)
npx wrangler pages dev .
```

## デプロイ

```bash
# CIなし・直接デプロイ (commit messageはASCIIで)
npx wrangler pages deploy . --project-name=flow-beyond-playbook --commit-message="deploy"
```

## 9サイト戦略 (Phase 2以降)

FLOW (財務) の反応を見て、次に着手するサイトを決定。テンプレ化したベースを使って2サイト目以降は1日で立ち上げ可能。

- SEED (新規事業立ち上げ)
- MAGNET (集客)
- COMPASS (戦略)
- TRIBE (組織)
- 他5サイト
