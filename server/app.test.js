// バックエンドの API（/api/receipt）のテスト
// readReceipt をモックに置き換え、HTTP のやり取りだけを確認する。
import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { readReceiptMock } = vi.hoisted(() => ({ readReceiptMock: vi.fn() }));

vi.mock("./receipt.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, readReceipt: readReceiptMock };
});

const { createApp } = await import("./app.js");
const { ReceiptError } = await import("./receipt.js");

const app = createApp();

beforeEach(() => {
  readReceiptMock.mockReset();
});

describe("POST /api/receipt", () => {
  it("正しい画像なら読み取り結果を返す", async () => {
    const result = { store: "A店", date: "2026-11-17", time: "", items: [], total: 0 };
    readReceiptMock.mockResolvedValue(result);

    const res = await request(app).post("/api/receipt").send({ mediaType: "image/jpeg", data: "abc" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(result);
    expect(readReceiptMock).toHaveBeenCalledWith({ mediaType: "image/jpeg", data: "abc" });
  });

  it.each([
    ["画像の形式が対応していない", { mediaType: "image/bmp", data: "abc" }],
    ["画像データが空", { mediaType: "image/png", data: "" }],
    ["画像データが文字列でない", { mediaType: "image/png", data: 123 }],
    ["何も送られていない", {}],
  ])("%s場合は 400 エラーで、Claude API は呼ばない", async (_label, body) => {
    const res = await request(app).post("/api/receipt").send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("画像");
    expect(readReceiptMock).not.toHaveBeenCalled();
  });

  it("JSON が壊れている場合は 400 エラー", async () => {
    const res = await request(app)
      .post("/api/receipt")
      .set("Content-Type", "application/json")
      .send("{壊れたJSON");

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("リクエストの形式が正しくありません。");
  });

  it("画像が大きすぎる場合は 413 エラー", async () => {
    const res = await request(app)
      .post("/api/receipt")
      .send({ mediaType: "image/jpeg", data: "a".repeat(11 * 1024 * 1024) });

    expect(res.status).toBe(413);
    expect(readReceiptMock).not.toHaveBeenCalled();
  });

  it("読み取りに失敗したら、そのステータスとメッセージを返す", async () => {
    readReceiptMock.mockRejectedValue(new ReceiptError("読み取れませんでした", 422));

    const res = await request(app).post("/api/receipt").send({ mediaType: "image/png", data: "abc" });

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: "読み取れませんでした" });
  });

  it("予想外のエラーでも、詳しい内容は返さず 500 エラーにする", async () => {
    readReceiptMock.mockRejectedValue(new Error("秘密の内部情報"));

    const res = await request(app).post("/api/receipt").send({ mediaType: "image/png", data: "abc" });

    expect(res.status).toBe(500);
    expect(res.body.error).not.toContain("秘密");
  });
});
