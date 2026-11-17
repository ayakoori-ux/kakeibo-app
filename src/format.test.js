// 表示用の関数（format.js）のテスト
import { afterEach, describe, expect, it, vi } from "vitest";
import { addMonths, createId, formatMonth, formatMonthShort, formatYen, today } from "./format.js";

describe("formatYen: 金額の表示", () => {
  it("3桁ごとにカンマを入れて ¥ を付ける", () => {
    expect(formatYen(1234567)).toBe("¥1,234,567");
  });

  it("0 円", () => {
    expect(formatYen(0)).toBe("¥0");
  });

  it("マイナスの金額", () => {
    expect(formatYen(-1500)).toBe("¥-1,500");
  });
});

describe("formatMonth / formatMonthShort: 月の表示", () => {
  it("「2026年11月」の形にする", () => {
    expect(formatMonth("2026-11")).toBe("2026年11月");
  });

  it("1桁の月は先頭の 0 を付けない", () => {
    expect(formatMonth("2026-03")).toBe("2026年3月");
    expect(formatMonthShort("2026-03")).toBe("3月");
  });
});

describe("addMonths: 月をずらす", () => {
  it("1か月後", () => {
    expect(addMonths("2026-11", 1)).toBe("2026-12");
  });

  it("年をまたいで進む", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
  });

  it("年をまたいで戻る", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("11か月前（月別グラフの最初の月）", () => {
    expect(addMonths("2026-11", -11)).toBe("2025-12");
  });
});

describe("today: 今日の日付", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("YYYY-MM-DD の形で返す", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 9, 0)); // 2026年1月5日（ローカル時間）
    expect(today()).toBe("2026-01-05");
  });
});

describe("createId: ID の作成", () => {
  it("毎回ちがう ID を作る", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId()));
    expect(ids.size).toBe(100);
  });
});
