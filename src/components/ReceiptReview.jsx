// 読み取り結果を確認・修正してから登録するコンポーネント
import { useState } from "react";
import { CATEGORIES, DEFAULT_CATEGORY } from "../../shared/categories.js";
import { createId, formatYen, today } from "../format.js";
import { findDuplicateReceipts, findNegativeItems } from "../validation.js";

export default function ReceiptReview({ receipt, existingEntries, onRegister, onCancel }) {
  // 日付が読み取れなかったときは今日の日付を入れておく
  const [date, setDate] = useState(receipt.date || today());
  const [time, setTime] = useState(receipt.time ?? "");
  const [store, setStore] = useState(receipt.store);
  // 金額は入力中の文字列のまま持つ（"-" だけの入力なども扱えるように）
  const [items, setItems] = useState(() =>
    receipt.items.map((item) => ({ ...item, key: createId(), amount: String(item.amount) }))
  );
  const [error, setError] = useState("");

  const updateItem = (key, field, value) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const addItem = () => {
    setItems((prev) => [...prev, { key: createId(), name: "", amount: "", category: DEFAULT_CATEGORY }]);
  };

  // 入力された金額の合計（数字でないものは 0 として数える）
  const sum = items.reduce((total, item) => total + (Number.parseInt(item.amount, 10) || 0), 0);
  const totalMismatch = receipt.total > 0 && sum !== receipt.total;

  // 検証①: 金額がマイナスの商品
  const negativeItems = findNegativeItems(items);
  const negativeKeys = new Set(negativeItems.map((item) => item.key));
  // 検証②: 同じ日時・同じ合計金額のレシートがすでに登録されていないか
  const duplicates = findDuplicateReceipts(existingEntries, { date, time, total: sum });

  const handleRegister = () => {
    if (!date) {
      setError("日付を入力してください。");
      return;
    }
    if (items.length === 0) {
      setError("商品が1つもありません。");
      return;
    }
    // 商品名と金額をチェックする
    for (const item of items) {
      const amount = Number(item.amount);
      if (!item.name.trim()) {
        setError("商品名が空の行があります。");
        return;
      }
      if (!Number.isInteger(amount) || amount === 0) {
        setError(`「${item.name}」の金額は 0 以外の整数で入力してください。`);
        return;
      }
    }

    // 重複の可能性があるときは、本当に登録するか確認する
    if (
      duplicates.length > 0 &&
      !window.confirm("同じ日時・同じ合計金額のレシートがすでに登録されています。それでも登録しますか？")
    ) {
      return;
    }

    // 同じレシートの明細には共通の receiptId を付ける（重複チェックで使う）
    const receiptId = createId();
    onRegister(
      items.map((item) => ({
        id: createId(),
        receiptId,
        date,
        time,
        store: store.trim(),
        name: item.name.trim(),
        amount: Number(item.amount),
        category: item.category,
      }))
    );
  };

  return (
    <div className="review">
      <div className="review-layout">
        <img className="receipt-preview" src={receipt.previewUrl} alt="読み取ったレシート" />

        <div className="review-form">
          <p className="hint">読み取り結果を確認し、間違いがあれば直してから登録してください。</p>

          <div className="field-row">
            <label className="field">
              <span>日付</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className="field narrow">
              <span>時刻</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <label className="field">
              <span>店名</span>
              <input type="text" value={store} onChange={(e) => setStore(e.target.value)} />
            </label>
          </div>

          <div className="table-wrap">
            <table className="review-table">
              <thead>
                <tr>
                  <th scope="col">商品名</th>
                  <th scope="col">金額（円）</th>
                  <th scope="col">カテゴリ</th>
                  <th scope="col">
                    <span className="visually-hidden">削除</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.key} className={negativeKeys.has(item.key) ? "row-warning" : undefined}>
                    <td>
                      <input
                        type="text"
                        value={item.name}
                        aria-label={`${index + 1}行目の商品名`}
                        onChange={(e) => updateItem(item.key, "name", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="1"
                        className="amount-input"
                        value={item.amount}
                        aria-label={`${index + 1}行目の金額`}
                        onChange={(e) => updateItem(item.key, "amount", e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        value={item.category}
                        aria-label={`${index + 1}行目のカテゴリ`}
                        onChange={(e) => updateItem(item.key, "category", e.target.value)}
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="button icon"
                        aria-label={`${item.name || `${index + 1}行目`}を削除`}
                        onClick={() => removeItem(item.key)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" className="button" onClick={addItem}>
            ＋ 行を追加
          </button>

          <p className="review-total">
            合計 <strong>{formatYen(sum)}</strong>
            {receipt.total > 0 && <span className="muted">（レシート記載: {formatYen(receipt.total)}）</span>}
          </p>
          {totalMismatch && (
            <p className="warning" role="status">
              ⚠ 合計がレシートの金額と一致しません。読み取り漏れや金額の間違いがないか確認してください。
            </p>
          )}
          {negativeItems.length > 0 && (
            <div className="warning" role="status">
              <p>⚠ 金額がマイナスの商品があります。値引き・割引でなければ金額を確認してください。</p>
              <ul>
                {negativeItems.map((item) => (
                  <li key={item.key}>
                    {item.name || "（商品名なし）"}: {formatYen(Number.parseInt(item.amount, 10))}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {duplicates.length > 0 && (
            <div className="warning" role="status">
              <p>⚠ 同じ日時・同じ合計金額のレシートがすでに登録されています。二重登録に注意してください。</p>
              <ul>
                {duplicates.map((dup) => (
                  <li key={dup.key}>
                    {dup.date.replaceAll("-", "/")}
                    {dup.time && ` ${dup.time}`} {dup.store || "（店名なし）"} 合計 {formatYen(dup.total)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <div className="button-row">
            <button type="button" className="button primary" onClick={handleRegister}>
              登録する
            </button>
            <button type="button" className="button" onClick={onCancel}>
              やり直す
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
