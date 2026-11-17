// @vitest-environment jsdom
// 読み取り結果の確認画面（ReceiptReview）のテスト
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ReceiptReview from "./ReceiptReview.jsx";

// 読み取り結果の例（合計 518 円）
const receipt = {
  store: "テストスーパー",
  date: "2026-11-17",
  time: "18:42",
  items: [
    { name: "牛乳", amount: 238, category: "食費" },
    { name: "洗剤", amount: 300, category: "日用品" },
    { name: "値引き", amount: -20, category: "食費" },
  ],
  total: 518,
  previewUrl: "data:image/jpeg;base64,AAAA",
};

// 確認画面を表示する
function renderReview({ existingEntries = [], data = receipt } = {}) {
  const onRegister = vi.fn();
  const onCancel = vi.fn();
  render(
    <ReceiptReview receipt={data} existingEntries={existingEntries} onRegister={onRegister} onCancel={onCancel} />
  );
  return { onRegister, onCancel };
}

const registerButton = () => screen.getByRole("button", { name: "登録する" });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReceiptReview: 表示", () => {
  it("読み取った日付・時刻・店名・商品を表示する", () => {
    renderReview();
    expect(screen.getByLabelText("日付")).toHaveValue("2026-11-17");
    expect(screen.getByLabelText("時刻")).toHaveValue("18:42");
    expect(screen.getByLabelText("店名")).toHaveValue("テストスーパー");
    expect(screen.getByLabelText("1行目の商品名")).toHaveValue("牛乳");
    expect(screen.getByLabelText("2行目のカテゴリ")).toHaveValue("日用品");
  });

  it("合計金額を表示する", () => {
    renderReview();
    expect(screen.getByText("¥518")).toBeInTheDocument();
  });

  it("合計がレシートの金額と違うと警告する", () => {
    renderReview();
    fireEvent.change(screen.getByLabelText("1行目の金額"), { target: { value: "200" } });
    expect(screen.getByText(/合計がレシートの金額と一致しません/)).toBeInTheDocument();
  });
});

describe("ReceiptReview: マイナス金額の警告", () => {
  it("マイナスの商品があると警告し、その商品名と金額を表示する", () => {
    renderReview();
    const warning = screen.getByText(/金額がマイナスの商品があります/).closest(".warning");
    expect(warning).toHaveTextContent("値引き: ¥-20");
  });

  it("マイナスの行を強調表示する", () => {
    renderReview();
    expect(screen.getByLabelText("3行目の金額").closest("tr")).toHaveClass("row-warning");
    expect(screen.getByLabelText("1行目の金額").closest("tr")).not.toHaveClass("row-warning");
  });

  it("マイナスの商品がなければ警告しない", () => {
    renderReview({ data: { ...receipt, items: receipt.items.slice(0, 2), total: 538 } });
    expect(screen.queryByText(/金額がマイナスの商品があります/)).not.toBeInTheDocument();
  });

  it("金額を入力し直してマイナスにすると、すぐに警告が出る", () => {
    renderReview({ data: { ...receipt, items: receipt.items.slice(0, 2), total: 538 } });
    fireEvent.change(screen.getByLabelText("1行目の金額"), { target: { value: "-100" } });
    expect(screen.getByText(/金額がマイナスの商品があります/)).toBeInTheDocument();
  });

  it("警告が出ていても登録はできる（値引きは正しいマイナスのため）", () => {
    const { onRegister } = renderReview();
    fireEvent.click(registerButton());
    expect(onRegister).toHaveBeenCalledTimes(1);
  });
});

describe("ReceiptReview: 重複レシートの警告", () => {
  // 同じ日時・同じ合計（518円）で登録済みのレシート
  const duplicateEntries = [
    { id: "a", receiptId: "old", date: "2026-11-17", time: "18:42", store: "テストスーパー", name: "まとめ", amount: 518, category: "食費" },
  ];

  it("同じ日時・合計金額のレシートがあると警告する", () => {
    renderReview({ existingEntries: duplicateEntries });
    const warning = screen.getByText(/同じ日時・同じ合計金額のレシート/).closest(".warning");
    expect(warning).toHaveTextContent("2026/11/17 18:42 テストスーパー 合計 ¥518");
  });

  it("重複がなければ警告しない", () => {
    renderReview({ existingEntries: [{ ...duplicateEntries[0], amount: 999 }] });
    expect(screen.queryByText(/同じ日時・同じ合計金額のレシート/)).not.toBeInTheDocument();
  });

  it("時刻を変えると重複の警告が消える", () => {
    renderReview({ existingEntries: duplicateEntries });
    fireEvent.change(screen.getByLabelText("時刻"), { target: { value: "09:00" } });
    expect(screen.queryByText(/同じ日時・同じ合計金額のレシート/)).not.toBeInTheDocument();
  });

  it("確認ダイアログでキャンセルすると登録しない", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { onRegister } = renderReview({ existingEntries: duplicateEntries });
    fireEvent.click(registerButton());
    expect(confirmSpy).toHaveBeenCalled();
    expect(onRegister).not.toHaveBeenCalled();
  });

  it("確認ダイアログで OK すると登録する", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const { onRegister } = renderReview({ existingEntries: duplicateEntries });
    fireEvent.click(registerButton());
    expect(onRegister).toHaveBeenCalledTimes(1);
  });

  it("重複がなければ確認ダイアログを出さない", () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    renderReview();
    fireEvent.click(registerButton());
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});

describe("ReceiptReview: 登録", () => {
  it("商品ごとの明細にして渡す（同じ receiptId・日付・時刻・店名）", () => {
    const { onRegister } = renderReview();
    fireEvent.click(registerButton());

    const entries = onRegister.mock.calls[0][0];
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      date: "2026-11-17",
      time: "18:42",
      store: "テストスーパー",
      name: "牛乳",
      amount: 238,
      category: "食費",
    });
    expect(new Set(entries.map((e) => e.receiptId)).size).toBe(1);
    expect(new Set(entries.map((e) => e.id)).size).toBe(3);
  });

  it("修正した内容で登録する", () => {
    const { onRegister } = renderReview();
    fireEvent.change(screen.getByLabelText("1行目の商品名"), { target: { value: "低脂肪乳" } });
    fireEvent.change(screen.getByLabelText("1行目のカテゴリ"), { target: { value: "その他" } });
    fireEvent.click(registerButton());
    expect(onRegister.mock.calls[0][0][0]).toMatchObject({ name: "低脂肪乳", category: "その他" });
  });

  it("日付が読み取れなかったときは今日の日付が入る", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 20, 12, 0));
    renderReview({ data: { ...receipt, date: "" } });
    expect(screen.getByLabelText("日付")).toHaveValue("2026-11-20");
    vi.useRealTimers();
  });

  it("行を削除・追加できる", () => {
    renderReview();
    fireEvent.click(screen.getByRole("button", { name: "洗剤を削除" }));
    expect(screen.queryByDisplayValue("洗剤")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "＋ 行を追加" }));
    expect(screen.getByLabelText("3行目の商品名")).toHaveValue("");
  });

  it("やり直すボタンで onCancel が呼ばれる", () => {
    const { onCancel } = renderReview();
    fireEvent.click(screen.getByRole("button", { name: "やり直す" }));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe("ReceiptReview: 入力エラー", () => {
  it("商品名が空だと登録しない", () => {
    const { onRegister } = renderReview();
    fireEvent.change(screen.getByLabelText("1行目の商品名"), { target: { value: "  " } });
    fireEvent.click(registerButton());
    expect(screen.getByRole("alert")).toHaveTextContent("商品名が空の行があります");
    expect(onRegister).not.toHaveBeenCalled();
  });

  it.each([
    ["0", "0"],
    ["空欄", ""],
    ["小数", "12.5"],
  ])("金額が%sだと登録しない", (_label, value) => {
    const { onRegister } = renderReview();
    fireEvent.change(screen.getByLabelText("1行目の金額"), { target: { value } });
    fireEvent.click(registerButton());
    expect(screen.getByRole("alert")).toHaveTextContent("0 以外の整数");
    expect(onRegister).not.toHaveBeenCalled();
  });

  it("日付が空だと登録しない", () => {
    const { onRegister } = renderReview();
    fireEvent.change(screen.getByLabelText("日付"), { target: { value: "" } });
    fireEvent.click(registerButton());
    expect(screen.getByRole("alert")).toHaveTextContent("日付を入力してください");
    expect(onRegister).not.toHaveBeenCalled();
  });

  it("商品が1つもないと登録しない", () => {
    const { onRegister } = renderReview({ data: { ...receipt, items: [], total: 0 } });
    fireEvent.click(registerButton());
    expect(screen.getByRole("alert")).toHaveTextContent("商品が1つもありません");
    expect(onRegister).not.toHaveBeenCalled();
  });
});
