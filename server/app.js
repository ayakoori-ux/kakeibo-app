// Express アプリの本体（ルートの定義）
// サーバーの起動（listen）は index.js で行う。こうしておくとテストから直接呼び出せる。
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readReceipt, ReceiptError, ALLOWED_MEDIA_TYPES } from "./receipt.js";

export function createApp() {
  const app = express();

  // 画像は Base64 の JSON で送られてくるので、上限を大きめにする
  app.use(express.json({ limit: "10mb" }));

  // レシート読み取り API
  app.post("/api/receipt", async (req, res) => {
    const { mediaType, data } = req.body ?? {};

    // 入力チェック
    if (!ALLOWED_MEDIA_TYPES.includes(mediaType) || typeof data !== "string" || data.length === 0) {
      return res.status(400).json({ error: "画像（JPEG / PNG / WebP / GIF）を送ってください。" });
    }

    try {
      const result = await readReceipt({ mediaType, data });
      res.json(result);
    } catch (error) {
      const status = error instanceof ReceiptError ? error.status : 500;
      const message = error instanceof ReceiptError ? error.message : "サーバーでエラーが発生しました。";
      res.status(status).json({ error: message });
    }
  });

  // 送られてきたデータが大きすぎる・JSON が壊れているなどのエラー
  app.use((error, req, res, next) => {
    if (error.type === "entity.too.large") {
      return res.status(413).json({ error: "画像が大きすぎます。" });
    }
    if (error.type === "entity.parse.failed") {
      return res.status(400).json({ error: "リクエストの形式が正しくありません。" });
    }
    next(error);
  });

  // 本番用: ビルド済みのフロントエンド（dist/）も同じサーバーから配信する
  const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  app.use(express.static(distDir));

  return app;
}
