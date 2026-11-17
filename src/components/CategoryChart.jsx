// カテゴリ別の支出を円グラフで表示するコンポーネント
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";
import { CATEGORIES } from "../../shared/categories.js";
import { categoryColor, chartTheme, useColorMode } from "../chartTheme.js";
import { formatYen } from "../format.js";

// 円グラフに必要な部品を Chart.js に登録する
ChartJS.register(ArcElement, Tooltip);

export default function CategoryChart({ entries }) {
  const mode = useColorMode();
  const theme = chartTheme(mode);

  // カテゴリごとに金額を合計する（CATEGORIES の順番を保つので色がずれない）
  const totals = CATEGORIES.map((category) => ({
    category,
    amount: entries
      .filter((entry) => entry.category === category)
      .reduce((sum, entry) => sum + entry.amount, 0),
  })).filter((row) => row.amount > 0);

  const grandTotal = totals.reduce((sum, row) => sum + row.amount, 0);

  if (totals.length === 0) {
    return <p className="empty">この月のデータはまだありません。</p>;
  }

  const percent = (amount) => Math.round((amount / grandTotal) * 1000) / 10;

  const data = {
    labels: totals.map((row) => row.category),
    datasets: [
      {
        data: totals.map((row) => row.amount),
        backgroundColor: totals.map((row) => categoryColor(row.category, mode)),
        // 扇形どうしの間に背景色のすき間を入れて見分けやすくする
        borderColor: theme.surface,
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      // 凡例は下の表で表示するので、グラフ側では出さない
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${formatYen(context.parsed)}（${percent(context.parsed)}%）`,
        },
      },
    },
  };

  return (
    <div className="category-chart">
      <div className="chart-box pie-box">
        <Pie
          data={data}
          options={options}
          aria-label={`カテゴリ別の支出の円グラフ。${totals
            .map((row) => `${row.category} ${formatYen(row.amount)}`)
            .join("、")}`}
          role="img"
        />
      </div>

      {/* 凡例を兼ねた集計表（色だけに頼らず、名前と金額も読めるようにする） */}
      <table className="legend-table">
        <caption className="visually-hidden">カテゴリ別の支出の集計</caption>
        <thead>
          <tr>
            <th scope="col">カテゴリ</th>
            <th scope="col" className="num">金額</th>
            <th scope="col" className="num">割合</th>
          </tr>
        </thead>
        <tbody>
          {totals.map((row) => (
            <tr key={row.category}>
              <th scope="row">
                <span
                  className="swatch"
                  style={{ backgroundColor: categoryColor(row.category, mode) }}
                  aria-hidden="true"
                />
                {row.category}
              </th>
              <td className="num">{formatYen(row.amount)}</td>
              <td className="num muted">{percent(row.amount)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
