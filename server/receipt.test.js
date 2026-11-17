// Claude API でレシートを読み取る処理（receipt.js）のテスト
// 本物の Claude API は呼ばず、SDK の messages.parse をモック（偽物）に置き換えて確認する。
import { beforeEach, describe, expect, it, vi } from "vitest";
import Anthropic from "@anthropic-ai/sdk";

// モックの関数（vi.mock より先に用意する必要があるので vi.hoisted を使う）
const { parseMock } = vi.hoisted(() => ({ parseMock: vi.fn() }));

// SDK のクライアントだけ差し替え、エラークラスなどは本物を使う
vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal();
  class MockAnthropic extends actual.default {
    constructor() {
      super({ apiKey: "test-key" });
      this.messages = { parse: parseMock };
    }
  }
  return { ...actual, default: MockAnthropic };
});

const { readReceipt, ReceiptError } = await import("./receipt.js");

const image = { mediaType: "image/jpeg", data: "BASE64DATA" };

// Claude から返ってくる読み取り結果の例
const parsedReceipt = {
  store: "テストスーパー",
  date: "2026-11-17",
  time: "18:42",
  items: [
    { name: "牛乳", amount: 238, category: "食費" },
    { name: "値引き", amount: -20, category: "食費" },
  ],
  total: 218,
};

// 正常な応答を作る
function okResponse(parsed = parsedReceipt) {
  return { stop_reason: "end_turn", parsed_output: structuredClone(parsed) };
}

// SDK のエラーオブジェクトを作る（instanceof の判定に使えるもの）
function sdkError(ErrorClass, status) {
  const error = Object.create(ErrorClass.prototype);
  error.status = status;
  return error;
}

beforeEach(() => {
  parseMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("readReceipt: 正常な読み取り", () => {
  it("読み取り結果をそのまま返す", async () => {
    parseMock.mockResolvedValue(okResponse());
    await expect(readReceipt(image)).resolves.toEqual(parsedReceipt);
  });

  it("Haiku の最新モデルに、画像と構造化出力の設定を付けて送る", async () => {
    parseMock.mockResolvedValue(okResponse());
    await readReceipt(image);

    const request = parseMock.mock.calls[0][0];
    expect(request.model).toBe("claude-haiku-5-5");
    expect(request.output_config.format.type).toBe("json_schema");
    expect(request.messages[0].content[0]).toEqual({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: "BASE64DATA" },
    });
  });

  it("出力スキーマのカテゴリは決められた一覧だけ", async () => {
    parseMock.mockResolvedValue(okResponse());
    await readReceipt(image);

    const schema = parseMock.mock.calls[0][0].output_config.format.schema;
    expect(schema.properties.items.items.properties.category.enum).toEqual([
      "食費",
      "外食",
      "日用品",
      "交通費",
      "衣服・美容",
      "医療",
      "趣味・娯楽",
      "その他",
    ]);
  });
});

describe("readReceipt: 日付・時刻の補正", () => {
  it.each(["2026/11/17", "2026-13-01", "2026-02-30", "令和8年11月17日", ""])(
    "日付「%s」は正しくないので空にする",
    async (date) => {
      parseMock.mockResolvedValue(okResponse({ ...parsedReceipt, date }));
      const result = await readReceipt(image);
      expect(result.date).toBe("");
    }
  );

  it("うるう年の 2月29日は正しい日付として残す", async () => {
    parseMock.mockResolvedValue(okResponse({ ...parsedReceipt, date: "2028-02-29" }));
    expect((await readReceipt(image)).date).toBe("2028-02-29");
  });

  it.each(["24:00", "9:05", "18:42:10", "午後6時", ""])("時刻「%s」は正しくないので空にする", async (time) => {
    parseMock.mockResolvedValue(okResponse({ ...parsedReceipt, time }));
    expect((await readReceipt(image)).time).toBe("");
  });

  it.each(["00:00", "09:05", "23:59"])("時刻「%s」は正しい時刻として残す", async (time) => {
    parseMock.mockResolvedValue(okResponse({ ...parsedReceipt, time }));
    expect((await readReceipt(image)).time).toBe(time);
  });
});

describe("readReceipt: 読み取りに失敗したとき", () => {
  it("Claude が回答を拒否した場合は 422 エラー", async () => {
    parseMock.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });
    await expect(readReceipt(image)).rejects.toMatchObject({ status: 422 });
  });

  it("出力が長すぎて途中で止まった場合は 422 エラー", async () => {
    parseMock.mockResolvedValue({ stop_reason: "max_tokens", parsed_output: null });
    await expect(readReceipt(image)).rejects.toMatchObject({ status: 422 });
  });

  it("結果の形式が正しくない場合は 502 エラー", async () => {
    parseMock.mockResolvedValue({ stop_reason: "end_turn", parsed_output: null });
    const error = await readReceipt(image).catch((e) => e);
    expect(error).toBeInstanceOf(ReceiptError);
    expect(error.status).toBe(502);
  });
});

describe("readReceipt: Claude API のエラー", () => {
  it.each([
    ["API キーが正しくない", Anthropic.AuthenticationError, 401, 500, "API キー"],
    ["リクエストが多すぎる", Anthropic.RateLimitError, 429, 429, "少し待って"],
    ["画像を処理できない", Anthropic.BadRequestError, 400, 400, "別の画像"],
    ["サーバーエラー", Anthropic.InternalServerError, 500, 502, "Claude API でエラー"],
  ])("%s場合は、日本語のメッセージに変換する", async (_label, ErrorClass, apiStatus, status, message) => {
    parseMock.mockRejectedValue(sdkError(ErrorClass, apiStatus));
    const error = await readReceipt(image).catch((e) => e);
    expect(error).toBeInstanceOf(ReceiptError);
    expect(error.status).toBe(status);
    expect(error.message).toContain(message);
  });

  it("ネットワークにつながらない場合は 502 エラー", async () => {
    parseMock.mockRejectedValue(sdkError(Anthropic.APIConnectionError));
    const error = await readReceipt(image).catch((e) => e);
    expect(error.status).toBe(502);
    expect(error.message).toContain("接続できません");
  });

  it("予想外のエラーは 500 エラーにする", async () => {
    parseMock.mockRejectedValue(new Error("想定外"));
    await expect(readReceipt(image)).rejects.toMatchObject({ status: 500 });
  });
});
