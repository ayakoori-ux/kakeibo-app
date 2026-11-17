// 表示中の月の明細を一覧表示するコンポーネント
import { CATEGORIES } from "../../shared/categories.js";
import { categoryColor, useColorMode } from "../chartTheme.js";
import { formatYen } from "../format.js";

export default function EntryList({ entries, onChangeCategory, onDelete }) {
  const mode = useColorMode();

  if (entries.length === 0) {
    return <p className="empty">この月の明細はありません。レシートを読み取って登録しましょう。</p>;
  }

  // 新しい日付が上になるように並べる（元の配列は変更しない）
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  const handleDelete = (entry) => {
    if (window.confirm(`「${entry.name}」を削除しますか？`)) {
      onDelete(entry.id);
    }
  };

  return (
    <div className="table-wrap">
      <table className="entry-table">
        <thead>
          <tr>
            <th scope="col">日付</th>
            <th scope="col">店名</th>
            <th scope="col">商品名</th>
            <th scope="col">カテゴリ</th>
            <th scope="col" className="num">金額</th>
            <th scope="col">
              <span className="visually-hidden">削除</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.id}>
              <td className="nowrap">{entry.date.slice(5).replace("-", "/")}</td>
              <td className="muted">{entry.store || "—"}</td>
              <td>{entry.name}</td>
              <td>
                <span className="category-cell">
                  <span
                    className="swatch"
                    style={{ backgroundColor: categoryColor(entry.category, mode) }}
                    aria-hidden="true"
                  />
                  <select
                    value={entry.category}
                    aria-label={`${entry.name}のカテゴリ`}
                    onChange={(e) => onChangeCategory(entry.id, e.target.value)}
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </span>
              </td>
              <td className="num nowrap">{formatYen(entry.amount)}</td>
              <td>
                <button
                  type="button"
                  className="button icon"
                  aria-label={`${entry.name}を削除`}
                  onClick={() => handleDelete(entry)}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
