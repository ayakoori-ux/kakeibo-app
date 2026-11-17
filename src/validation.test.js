// 登録前の検証ロジック（validation.js）のテスト
import { describe, expect, it } from "vitest";
import { findDuplicateReceipts, findNegativeItems, groupReceipts } from "./validation.js";

describe("findNegativeItems: 金額がマイナスの商品を探す", () => {
  it("マイナスの金額の商品だけを返す", () => {
    const items = [
      { name: "牛乳", amount: "238" },
      { name: "値引き", amount: "-50" },
      { name: "パン", amount: "150" },
    ];
    expect(findNegativeItems(items)).toEqual([{ name: "値引き", amount: "-50" }]);
  });

  it("数値の金額でも判定できる", () => {
    expect(findNegativeItems([{ name: "割引", amount: -10 }])).toHaveLength(1);
  });

  it("0・空欄・入力途中の「-」はマイナス扱いしない", () => {
    const items = [
      { name: "a", amount: "0" },
      { name: "b", amount: "" },
      { name: "c", amount: "-" },
    ];
    expect(findNegativeItems(items)).toEqual([]);
  });
});

describe("groupReceipts: 明細をレシート単位にまとめる", () => {
  it("同じ receiptId の明細を1枚にまとめて合計する", () => {
    const entries = [
      { receiptId: "r1", date: "2026-11-17", time: "10:30", store: "A店", amount: 300 },
      { receiptId: "r1", date: "2026-11-17", time: "10:30", store: "A店", amount: 200 },
      { receiptId: "r2", date: "2026-11-17", time: "18:00", store: "A店", amount: 100 },
    ];
    const receipts = groupReceipts(entries);
    expect(receipts).toHaveLength(2);
    expect(receipts[0]).toMatchObject({ key: "r1", total: 500, time: "10:30" });
    expect(receipts[1]).toMatchObject({ key: "r2", total: 100 });
  });

  it("receiptId のない古いデータは「日付＋店名」でまとめる", () => {
    const entries = [
      { date: "2026-11-16", store: "B店", amount: 500 },
      { date: "2026-11-16", store: "B店", amount: 300 },
      { date: "2026-11-16", store: "C店", amount: 100 },
    ];
    const receipts = groupReceipts(entries);
    expect(receipts).toHaveLength(2);
    expect(receipts[0]).toMatchObject({ key: "2026-11-16|B店", total: 800, time: "" });
  });

  it("明細がなければ空の配列を返す", () => {
    expect(groupReceipts([])).toEqual([]);
  });
});

describe("findDuplicateReceipts: 重複レシートを探す", () => {
  // 登録済みのデータ
  const entries = [
    // 時刻ありのレシート（合計 500 円）
    { receiptId: "r1", date: "2026-11-17", time: "10:30", store: "A店", amount: 300 },
    { receiptId: "r1", date: "2026-11-17", time: "10:30", store: "A店", amount: 200 },
    // 時刻のない古いデータ（合計 800 円）
    { date: "2026-11-16", store: "B店", amount: 800 },
  ];

  it("日付・時刻・合計金額がすべて同じなら重複", () => {
    const result = findDuplicateReceipts(entries, { date: "2026-11-17", time: "10:30", total: 500 });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ key: "r1", store: "A店" });
  });

  it("時刻が違えば重複ではない", () => {
    expect(findDuplicateReceipts(entries, { date: "2026-11-17", time: "15:00", total: 500 })).toEqual([]);
  });

  it("合計金額が違えば重複ではない", () => {
    expect(findDuplicateReceipts(entries, { date: "2026-11-17", time: "10:30", total: 501 })).toEqual([]);
  });

  it("日付が違えば重複ではない", () => {
    expect(findDuplicateReceipts(entries, { date: "2026-11-18", time: "10:30", total: 500 })).toEqual([]);
  });

  it("新しいレシートの時刻が不明なら、日付と金額だけで判定する", () => {
    expect(findDuplicateReceipts(entries, { date: "2026-11-17", time: "", total: 500 })).toHaveLength(1);
  });

  it("登録済みのレシートに時刻がなければ、日付と金額だけで判定する", () => {
    expect(findDuplicateReceipts(entries, { date: "2026-11-16", time: "09:00", total: 800 })).toHaveLength(1);
  });

  it("日付が空なら判定しない", () => {
    expect(findDuplicateReceipts(entries, { date: "", time: "", total: 500 })).toEqual([]);
  });

  it("登録済みのデータがなければ重複なし", () => {
    expect(findDuplicateReceipts([], { date: "2026-11-17", time: "10:30", total: 500 })).toEqual([]);
  });
});
