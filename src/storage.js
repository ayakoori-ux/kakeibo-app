// ローカルストレージへの保存・読み込み
// 保存できない環境（プライベートブラウズなど）でもアプリが止まらないよう try/catch で囲む

const STORAGE_KEY = "kakeibo-entries";

// 保存されている明細を読み込む（なければ空の配列）
export function loadEntries() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    const data = json ? JSON.parse(json) : [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("データを読み込めませんでした", error);
    return [];
  }
}

// 明細を保存する
export function saveEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn("データを保存できませんでした", error);
  }
}
