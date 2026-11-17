// 表示用の小さな関数をまとめたファイル

// 金額を「¥1,234」の形にする
export function formatYen(amount) {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

// "2026-11" を「2026年11月」にする
export function formatMonth(month) {
  const [year, m] = month.split("-");
  return `${year}年${Number(m)}月`;
}

// "2026-11" を「11月」にする（グラフの軸用）
export function formatMonthShort(month) {
  return `${Number(month.split("-")[1])}月`;
}

// 今日の日付を "YYYY-MM-DD" で返す（ローカル時間）
export function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "2026-11" から n か月ずらした月を返す（n はマイナスも可）
export function addMonths(month, n) {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// 一意な ID を作る
export function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
