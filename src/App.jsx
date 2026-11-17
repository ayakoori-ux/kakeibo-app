// アプリ全体の画面と状態を管理するコンポーネント
import { useEffect, useMemo, useState } from "react";
import { loadEntries, saveEntries } from "./storage.js";
import { today } from "./format.js";
import ReceiptUploader from "./components/ReceiptUploader.jsx";
import ReceiptReview from "./components/ReceiptReview.jsx";
import MonthSelector from "./components/MonthSelector.jsx";
import MonthSummary from "./components/MonthSummary.jsx";
import CategoryChart from "./components/CategoryChart.jsx";
import MonthlyChart from "./components/MonthlyChart.jsx";
import EntryList from "./components/EntryList.jsx";

export default function App() {
  // 登録済みの明細（1件 = 商品1つ）。最初にローカルストレージから読み込む
  const [entries, setEntries] = useState(loadEntries);
  // 表示中の月（"YYYY-MM"）
  const [month, setMonth] = useState(() => today().slice(0, 7));
  // 読み取り直後で、まだ登録していないレシート
  const [pending, setPending] = useState(null);

  // 明細が変わるたびにローカルストレージへ保存する
  useEffect(() => {
    saveEntries(entries);
  }, [entries]);

  // 表示中の月の明細だけを取り出す
  const monthEntries = useMemo(
    () => entries.filter((entry) => entry.date.startsWith(month)),
    [entries, month]
  );

  // 確認画面で「登録する」が押されたとき
  const handleRegister = (newEntries) => {
    setEntries((prev) => [...prev, ...newEntries]);
    setPending(null);
    // 登録したレシートの月を表示する
    if (newEntries.length > 0) {
      setMonth(newEntries[0].date.slice(0, 7));
    }
  };

  const handleChangeCategory = (id, category) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, category } : entry)));
  };

  const handleDelete = (id) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>レシート家計簿</h1>
        <p className="app-lead">レシートの写真をアップロードすると、商品と金額を自動で読み取ります。</p>
      </header>

      <main className="app-main">
        <section className="card" aria-labelledby="upload-heading">
          <h2 id="upload-heading">レシートを読み取る</h2>
          {pending ? (
            <ReceiptReview
              receipt={pending}
              onRegister={handleRegister}
              onCancel={() => setPending(null)}
            />
          ) : (
            <ReceiptUploader onRead={setPending} />
          )}
        </section>

        <MonthSelector month={month} onChange={setMonth} />

        <MonthSummary entries={monthEntries} />

        <div className="chart-grid">
          <section className="card" aria-labelledby="category-heading">
            <h2 id="category-heading">カテゴリ別の支出</h2>
            <CategoryChart entries={monthEntries} />
          </section>
          <section className="card" aria-labelledby="monthly-heading">
            <h2 id="monthly-heading">月別の支出</h2>
            <MonthlyChart entries={entries} month={month} onSelectMonth={setMonth} />
          </section>
        </div>

        <section className="card" aria-labelledby="list-heading">
          <h2 id="list-heading">明細</h2>
          <EntryList
            entries={monthEntries}
            onChangeCategory={handleChangeCategory}
            onDelete={handleDelete}
          />
        </section>
      </main>
    </div>
  );
}
