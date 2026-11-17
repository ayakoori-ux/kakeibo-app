// バックエンドサーバーの起動
// ブラウザから受け取った画像を Claude API に渡し、読み取り結果を返す。
// API キーはこのサーバーの中だけで使い、ブラウザには渡さない。
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 3001;

createApp().listen(PORT, () => {
  console.log(`サーバーを起動しました: http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("注意: ANTHROPIC_API_KEY が設定されていません。.env.example をコピーして .env を作ってください。");
  }
});
