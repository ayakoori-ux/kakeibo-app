// 表示する月を切り替えるコンポーネント
import { addMonths, formatMonth } from "../format.js";

export default function MonthSelector({ month, onChange }) {
  return (
    <nav className="month-selector" aria-label="表示する月">
      <button type="button" className="button" onClick={() => onChange(addMonths(month, -1))} aria-label="前の月">
        ‹ 前月
      </button>
      <label className="month-label">
        <span className="visually-hidden">表示する月</span>
        <strong aria-hidden="true">{formatMonth(month)}</strong>
        <input
          type="month"
          value={month}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="month-input"
        />
      </label>
      <button type="button" className="button" onClick={() => onChange(addMonths(month, 1))} aria-label="次の月">
        次月 ›
      </button>
    </nav>
  );
}
