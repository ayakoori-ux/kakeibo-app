// 表示中の月の合計金額などを表示するコンポーネント
import { formatYen } from "../format.js";
import { groupReceipts } from "../validation.js";

export default function MonthSummary({ entries }) {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  // 明細をレシート単位にまとめて枚数を数える
  const receiptCount = groupReceipts(entries).length;

  return (
    <div className="summary">
      <div className="stat">
        <span className="stat-label">この月の支出</span>
        <span className="stat-value">{formatYen(total)}</span>
      </div>
      <div className="stat">
        <span className="stat-label">レシート</span>
        <span className="stat-value small">{receiptCount} 枚</span>
      </div>
      <div className="stat">
        <span className="stat-label">商品</span>
        <span className="stat-value small">{entries.length} 件</span>
      </div>
    </div>
  );
}
