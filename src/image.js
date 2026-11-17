// アップロードされた画像を縮小して JPEG の Base64 に変換する
// （スマホの写真はそのままだと大きすぎるため、送る前に小さくする）

const MAX_SIZE = 2000; // 長い辺の最大ピクセル数
const JPEG_QUALITY = 0.85;

/**
 * @param {File} file
 * @returns {Promise<{ mediaType: string, data: string, previewUrl: string }>}
 */
export async function prepareImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    // 透過 PNG の背景が黒くならないよう白で塗っておく
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    return {
      mediaType: "image/jpeg",
      data: dataUrl.split(",")[1], // "data:image/jpeg;base64," の後ろだけ
      previewUrl: dataUrl,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// 画像を読み込む（読み込めない形式ならエラー）
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("画像を開けませんでした。JPEG または PNG の画像を選んでください。"));
    img.src = url;
  });
}
