// レシート画像を選んで、読み取りを実行するコンポーネント
import { useState } from "react";
import { prepareImage } from "../image.js";
import { requestReceiptReading } from "../api.js";

export default function ReceiptUploader({ onRead }) {
  const [image, setImage] = useState(null); // 縮小済みの画像
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ファイルが選ばれたら、縮小してプレビューを表示する
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    setError("");
    setImage(null);
    if (!file) return;
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      setError(e.message);
    }
  };

  // 「読み取る」ボタン：バックエンド経由で Claude API に送る
  const handleRead = async () => {
    if (!image) return;
    setLoading(true);
    setError("");
    try {
      const result = await requestReceiptReading(image);
      onRead({ ...result, previewUrl: image.previewUrl });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="uploader">
      <label className="file-label">
        <span>レシートの画像</span>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
      </label>

      {image && (
        <img className="receipt-preview" src={image.previewUrl} alt="選択したレシートのプレビュー" />
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="button primary" onClick={handleRead} disabled={!image || loading}>
        {loading ? "読み取り中…" : "読み取る"}
      </button>
      {loading && <p className="hint" aria-live="polite">Claude がレシートを読んでいます。数秒〜十数秒かかります。</p>}
    </div>
  );
}
