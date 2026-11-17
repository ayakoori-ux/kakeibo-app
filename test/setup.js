// すべてのテストの前に読み込まれる共通設定
import "@testing-library/jest-dom/vitest"; // toBeInTheDocument などの判定を使えるようにする
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// 画面のテストごとに、表示した内容を片付ける
afterEach(() => {
  cleanup();
});
