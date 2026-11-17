// グラフの色の設定（ライトモード・ダークモード）
import { useEffect, useState } from "react";
import { CATEGORIES } from "../shared/categories.js";

// カテゴリごとの色。CATEGORIES の並び順と同じ順番で割り当てる。
// 色覚の違いがあっても隣り合う色が見分けやすい順番になっている。
const CATEGORY_COLORS = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};

const THEMES = {
  light: { surface: "#ffffff", text: "#52514c", grid: "#e8e7e1", bar: "#2a78d6" },
  dark: { surface: "#1f1f1d", text: "#c3c2b7", grid: "#383835", bar: "#3987e5" },
};

// カテゴリ名から色を取り出す
export function categoryColor(category, mode) {
  const index = CATEGORIES.indexOf(category);
  return CATEGORY_COLORS[mode][index === -1 ? CATEGORIES.length - 1 : index];
}

export function chartTheme(mode) {
  return THEMES[mode];
}

// OS がダークモードかどうかを調べ、切り替わったら追従する
export function useColorMode() {
  const query = "(prefers-color-scheme: dark)";
  const [mode, setMode] = useState(() =>
    window.matchMedia?.(query).matches ? "dark" : "light"
  );
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return;
    const onChange = (e) => setMode(e.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return mode;
}
