// バックエンドの API を呼び出す

/**
 * レシート画像を送って、読み取り結果を受け取る
 * @param {{ mediaType: string, data: string }} image
 */
export async function requestReceiptReading(image) {
  let response;
  try {
    response = await fetch("/api/receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaType: image.mediaType, data: image.data }),
    });
  } catch {
    throw new Error("サーバーに接続できませんでした。npm run dev で起動しているか確認してください。");
  }

  // エラー時もサーバーは { error: "..." } を返す
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `読み取りに失敗しました（${response.status}）`);
  }
  return body;
}
