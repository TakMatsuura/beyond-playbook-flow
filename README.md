# FLOW ── お金の流れを、止めない。

BEYOND Playbook の最初の1サイト。中小企業の資金繰り・銀行交渉・補助金活用に伴走するサービスのLP。

- **ドメイン (予定)**: https://flow.beyond-holdings.co.jp
- **位置付け**: BEYOND Playbook 9サイト中、最初に作る型
- **技術スタック**: Vanilla HTML + Cloudflare Pages + D1 + LINE WORKS通知 (お助けコンシェルジュと同構成)

## ディレクトリ構成

```
flow/
├── index.html           # メインLP (完成)
├── check/index.html     # 診断ツール「1分でできる、財務体力チェック」(TODO)
├── articles/            # キラー記事5本 (TODO)
├── admin/index.html     # 管理ダッシュボード (TODO)
├── assets/              # ロゴ・写真・CSS等
├── functions/api/       # Cloudflare Pages Functions
│   ├── submit.js        # フォーム受付 (TODO)
│   ├── check-result.js  # 診断結果保存 (TODO)
│   └── daily-report.js  # 日次サマリ通知 (TODO)
└── schema.sql           # D1 スキーマ (TODO)
```

## ローカルで確認する方法

エクスプローラーから `index.html` をダブルクリック (Chrome/Edge で開く)。
全セクション・全コピーが入った状態で見れます。

## サイト構造 (LP全12セクション)

| # | セクション | 内容 |
|---|---|---|
| 1 | ヒーロー | FLOW + お金の流れを止めない + CTA3つ |
| 2 | 次の打ち手、決まっていますか? | 共感 (論点リスト10個) |
| 3 | 数字で見るBEYOND | 7社/85名/2023 |
| 4 | FLOWの解き方5つ | 現状見える化〜キャッシュ管理 |
| 5 | 事例 / 現在のご相談 | 実例1件 + 進行中3件 |
| 6 | なぜBEYOND | 3つの理由 + スピード比較表 |
| 7 | 料金 | ヒアリング無料 / Kickoff有料 / お役立てない場合 |
| 8 | 代表メッセージ | 松浦さん顔写真 + テキスト |
| 9 | こんな経営者と組みたい / お断り | フィルター |
| 10 | FAQ | 7問 |
| 11 | 大CTA再掲 | 「まず話しましょう」 |
| 12 | フッター | 関連サイト・運営会社 |

+ モバイル下部固定 CTA (電話/LINE/申込)

## まだやってないこと (TODO)

- [ ] 診断ツール「1分でできる、財務体力チェック」5問の実装
- [ ] キラー記事5本の実装
- [ ] フォーム受付 (Cloudflare Pages Functions + D1)
- [ ] LINE WORKS Bot 通知 (松浦さん即時アラート)
- [ ] 管理ダッシュボード (日次サマリ確認)
- [ ] Cloudflare Pages デプロイ
- [ ] サブドメイン flow.beyond-holdings.co.jp 設定
- [ ] GA4 / Microsoft Clarity 接続
- [ ] 松浦さん顔写真・BEYONDロゴ assets/ へコピー
- [ ] 事例1件の数字 (○○の部分) 確定

## 仮置きの数字 (要確定)

サイト内の以下は仮置きです:
- 事例1: 「年商○億」「借入○○千万」「補助金○○万」 → 松浦さん側で実数値確定
- 電話番号: 080-4145-0391 (Strategy Summary記載・代表番号と要確認)
- フッター TEL: 03-6820-9321 (本社番号)
