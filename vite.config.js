import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // 開発時は /api へのリクエストをバックエンド（Express）に転送する
  server: {
    port: 5173,
    proxy: {
      "/api": `http://localhost:${process.env.PORT || 3001}`,
    },
  },
  // テスト（Vitest）の設定
  test: {
    // 基本は Node.js 環境。画面のテストはファイル先頭のコメントで jsdom に切り替える
    environment: "node",
    setupFiles: ["./test/setup.js"],
    // テスト中はダミーの API キーを使う（Claude API の呼び出しはテスト側でモックに置き換える）
    env: { ANTHROPIC_API_KEY: "test-key" },
  },
});
