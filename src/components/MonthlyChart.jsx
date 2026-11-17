// 月別の支出を棒グラフで表示するコンポーネント
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";
import { chartTheme, useColorMode } from "../chartTheme.js";
import { addMonths, formatMonth, formatMonthShort, formatYen } from "../format.js";

// 棒グラフに必要な部品を Chart.js に登録する
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

// 表示する月数（選択中の月を含めて過去何か月分か）
const MONTH_COUNT = 12;

export default function MonthlyChart({ entries, month, onSelectMonth }) {
  const mode = useColorMode();
  const theme = chartTheme(mode);

  // 選択中の月から過去 12 か月分の月の一覧を作る
  const months = Array.from({ length: MONTH_COUNT }, (_, i) => addMonths(month, i - (MONTH_COUNT - 1)));

  // 月ごとに合計する
  const totals = months.map((m) =>
    entries.filter((entry) => entry.date.startsWith(m)).reduce((sum, entry) => sum + entry.amount, 0)
  );

  if (totals.every((total) => total === 0)) {
    return <p className="empty">この1年のデータはまだありません。</p>;
  }

  const data = {
    labels: months.map(formatMonthShort),
    datasets: [
      {
        label: "支出",
        data: totals,
        // 1系列なので1色。選択中の月だけ濃く、それ以外は少し薄くする
        backgroundColor: months.map((m) => (m === month ? theme.bar : `${theme.bar}99`)),
        borderRadius: 4,
        borderSkipped: "bottom",
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // 棒をクリックするとその月を表示する
    onClick: (_event, elements) => {
      if (elements.length > 0) onSelectMonth(months[elements[0].index]);
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length > 0 ? "pointer" : "default";
    },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => formatMonth(months[items[0].dataIndex]),
          label: (context) => ` 支出: ${formatYen(context.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: theme.text },
        border: { color: theme.grid },
      },
      y: {
        beginAtZero: true,
        grid: { color: theme.grid },
        border: { display: false },
        ticks: {
          color: theme.text,
          maxTicksLimit: 5,
          callback: (value) => formatYen(value),
        },
      },
    },
  };

  return (
    <>
      <div className="chart-box bar-box">
        <Bar
          data={data}
          options={options}
          role="img"
          aria-label={`月別の支出の棒グラフ。${months
            .map((m, i) => `${formatMonth(m)} ${formatYen(totals[i])}`)
            .join("、")}`}
        />
      </div>
      <p className="hint">棒をクリックすると、その月を表示します。</p>
    </>
  );
}
