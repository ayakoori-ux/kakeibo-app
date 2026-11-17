# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code 向けのガイドです。

## プロジェクト概要

レシート画像を Claude API で読み取って記録する家計簿 Web アプリです。

- フロントエンド: React + Vite（`src/`）、グラフは Chart.js（react-chartjs-2）
- バックエンド: Node.js + Express（`server/`）。Claude API はここからだけ呼ぶ
- Claude API: 公式 SDK `@anthropic-ai/sdk`、モデルは `claude-haiku-5-5`（Haiku の最新）
  - 構造化出力（`messages.parse` + `zodOutputFormat`）で JSON を受け取る
- データはブラウザの `localStorage`（キー: `kakeibo-entries`）に保存

## 主な機能

- レシート画像のアップロード → バックエンド経由で Claude が店名・日付・商品名・金額・カテゴリを読み取る
- 読み取り結果を確認・修正してから登録する
- 月の切り替え、月の合計、カテゴリ別の円グラフ、月別（過去12か月）の棒グラフ
- 明細の一覧、カテゴリの変更、削除

## データ形式

明細 1 件 = 商品 1 つ。次の形のオブジェクトを配列で保存する。

```js
{
  id: "文字列（一意）",
  date: "2026-11-17",   // YYYY-MM-DD
  store: "○○スーパー",
  name: "牛乳",
  amount: 238,          // 円・整数（値引きはマイナス）
  category: "食費"      // shared/categories.js の CATEGORIES のどれか
}
```

## ディレクトリ構成

```
kakeibo-app/
├── CLAUDE.md
├── .env.example        # .env のひな形（.env 本体はコミットしない）
├── index.html          # Vite のエントリーポイント
├── vite.config.js      # 開発時に /api をバックエンドへ転送
├── shared/
│   └── categories.js   # カテゴリ一覧（フロント・バックエンド共通）
├── server/
│   ├── index.js        # Express サーバー（/api/receipt、本番時は dist/ も配信）
│   └── receipt.js      # Claude API 呼び出し・プロンプト・出力スキーマ
└── src/
    ├── main.jsx / App.jsx / styles.css
    ├── api.js          # バックエンド呼び出し
    ├── image.js        # 画像の縮小・Base64 変換
    ├── storage.js      # localStorage 読み書き
    ├── format.js       # 金額・日付の表示用関数
    ├── chartTheme.js   # グラフの色（ライト/ダーク）
    └── components/     # 画面の部品
```

## 起動・動作確認

1. `npm install`
2. `.env.example` をコピーして `.env` を作り、`ANTHROPIC_API_KEY` を設定する
3. `npm run dev` … バックエンド（3001）とフロントエンド（5173）を同時に起動
   → http://localhost:5173 を開く
4. 本番形式: `npm run build` → `npm start` → http://localhost:3001

- テスト・Lint の仕組みは現状ありません。変更後は `npm run build` が通ることと、ブラウザで読み取り・登録・グラフ・削除・リロード後の保持を確認します。
- バックエンドが必要なため、GitHub Pages では公開できません（公開する場合は Render などの Node.js が動くサービスを使う）。

## セキュリティ

- API キーは `.env` にだけ書く。`.env` は `.gitignore` 済み。コードやコミットにキーを書かない。
- ブラウザから Claude API を直接呼ばない。必ず `server/` を経由する。

## コーディング規約

- UI の文言・コメントは日本語で書く。
- Claude API のモデル ID は `server/receipt.js` の `MODEL` 定数で一元管理する。
- カテゴリを増やす・並べ替えるときは `shared/categories.js` と `src/chartTheme.js` の色を一緒に直す。
- 状態更新は `setEntries((prev) => ...)` のように関数形式で行い、配列は破壊的に変更しない。
- `localStorage` へのアクセスは `try/catch` で囲み、保存できない環境でも動作を止めない。
- 金額は円の整数で扱う。表示は `formatYen()` を使う。
- アクセシビリティ（`label` の関連付け、`aria-label`、グラフの代わりに読める表）を維持する。

## Git 運用ルール

**コードを変更したら、そのたびにコミットして GitHub にプッシュすること。**

1. 作業前に `git status` と `git pull` で最新の状態を確認する。
2. 1つの変更（機能追加・修正など）が終わるごとにコミットする。変更をまとめて溜め込まない。
3. コミット後は必ず `git push` で GitHub のリモート（`origin`）に反映する。
4. コミットメッセージは日本語で、何を・なぜ変更したかを簡潔に書く。
   - 例: `支出のカテゴリ別集計を追加`
5. `git add .` ではなく、変更したファイルを指定してステージする。
6. `push --force`、`reset --hard` などの履歴を書き換える操作はユーザーの確認なしに行わない。
7. プッシュが失敗した場合（認証エラー・競合など）は、勝手に回避せずユーザーに報告する。
8. `.env` やAPI キーを含むファイルは絶対にステージしない。
