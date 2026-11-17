// @vitest-environment jsdom
// ローカルストレージの読み書き（storage.js）のテスト
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadEntries, saveEntries } from "./storage.js";

const sampleEntries = [
  { id: "1", receiptId: "r1", date: "2026-11-17", time: "", store: "A店", name: "牛乳", amount: 238, category: "食費" },
];

describe("storage: ローカルストレージ", () => {
  beforeEach(() => {
    localStorage.clear();
    // 警告メッセージがテスト結果に出ないようにする
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("保存したデータを読み込める", () => {
    saveEntries(sampleEntries);
    expect(loadEntries()).toEqual(sampleEntries);
  });

  it("kakeibo-entries というキーで保存する", () => {
    saveEntries(sampleEntries);
    expect(JSON.parse(localStorage.getItem("kakeibo-entries"))).toEqual(sampleEntries);
  });

  it("何も保存されていなければ空の配列を返す", () => {
    expect(loadEntries()).toEqual([]);
  });

  it("壊れたデータが保存されていても止まらず、空の配列を返す", () => {
    localStorage.setItem("kakeibo-entries", "{壊れたJSON");
    expect(loadEntries()).toEqual([]);
  });

  it("配列でないデータが保存されていたら空の配列を返す", () => {
    localStorage.setItem("kakeibo-entries", JSON.stringify({ foo: 1 }));
    expect(loadEntries()).toEqual([]);
  });

  it("保存できない環境（容量オーバーなど）でもエラーで止まらない", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => saveEntries(sampleEntries)).not.toThrow();
  });

  it("読み込めない環境でもエラーで止まらない", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(loadEntries()).toEqual([]);
  });
});
