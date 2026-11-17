// 登録前のデータ検証（警告を出すためのチェック）
// ここでのチェックは「登録を止める」ものではなく、利用者に確認を促すためのもの。

/**
 * 金額がマイナスの商品を取り出す
 * @param {Array<{ name: string, amount: string | number }>} items
 * @returns {Array} マイナスの商品の一覧
 */
export function findNegativeItems(items) {
  return items.filter((item) => Number.parseInt(item.amount, 10) < 0);
}

/**
 * 登録済みの明細を、レシート単位にまとめる
 * - receiptId があればそれでまとめる
 * - receiptId がない古いデータは「日付＋店名」で1枚とみなす
 * @param {Array} entries
 * @returns {Array<{ key: string, date: string, time: string, store: string, total: number }>}
 */
export function groupReceipts(entries) {
  const receipts = new Map();
  for (const entry of entries) {
    const key = entry.receiptId ?? `${entry.date}|${entry.store}`;
    const receipt = receipts.get(key);
    if (receipt) {
      receipt.total += entry.amount;
    } else {
      receipts.set(key, {
        key,
        date: entry.date,
        time: entry.time ?? "",
        store: entry.store,
        total: entry.amount,
      });
    }
  }
  return [...receipts.values()];
}

/**
 * 同じ日時・同じ合計金額のレシートがすでに登録されていないか探す
 * - 日付と合計金額が同じなら重複の可能性ありとする
 * - 両方に時刻があるときは、時刻も同じ場合だけ重複とする
 *   （同じ日に同じ金額の買い物を別々の時間にした場合を区別するため）
 * @param {Array} entries - 登録済みの明細
 * @param {{ date: string, time: string, total: number }} receipt - これから登録するレシート
 * @returns {Array} 重複している可能性のあるレシートの一覧
 */
export function findDuplicateReceipts(entries, { date, time, total }) {
  if (!date) return [];
  return groupReceipts(entries).filter(
    (existing) =>
      existing.date === date &&
      existing.total === total &&
      (!existing.time || !time || existing.time === time)
  );
}
