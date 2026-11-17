// Claude API を使ってレシート画像を読み取る処理
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CATEGORIES } from "../shared/categories.js";

// 使用するモデル（Claude Haiku の最新バージョン）
const MODEL = "claude-haiku-5-5";

// 受け付ける画像の形式
export const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// API キーは環境変数 ANTHROPIC_API_KEY（.env に記載）から自動で読み込まれる
const client = new Anthropic();

// Claude に返してほしい JSON の形（構造化出力）
const ReceiptSchema = z.object({
  store: z.string().describe("店名。読み取れない場合は空文字"),
  date: z.string().describe("購入日（YYYY-MM-DD 形式）。読み取れない場合は空文字"),
  items: z.array(
    z.object({
      name: z.string().describe("商品名"),
      amount: z.number().int().describe("金額（円・税込）。値引きはマイナスの値"),
      category: z.enum(CATEGORIES).describe("商品のカテゴリ"),
    })
  ),
  total: z.number().int().describe("レシートの合計金額（円）。読み取れない場合は 0"),
});

// Claude への指示文
const SYSTEM_PROMPT = `あなたは日本のレシートを読み取り、家計簿用のデータに変換するアシスタントです。
画像のレシートから、店名・購入日・商品ごとの名前と金額・合計金額を読み取ってください。

ルール:
- 金額は円単位の整数にする（「¥」やカンマは付けない）。
- 商品の金額は税込みにする。外税のレシートで商品ごとの税込み額がわからない場合は、
  「消費税」という名前の項目を1行追加し、カテゴリは最も金額の大きい商品と同じにする。
- 値引き・割引は、マイナスの金額の項目として入れる（カテゴリは対象の商品と同じ）。
- 小計・合計・お預かり・お釣り・ポイントの行は items に入れない。
- カテゴリは次から選ぶ: ${CATEGORIES.join("、")}
  - スーパーやコンビニで買った食品・飲み物は「食費」、飲食店での食事は「外食」。
  - 洗剤・ティッシュ・文房具などの消耗品は「日用品」。
  - どれにも当てはまらないものは「その他」。
- 日付が和暦（例: 令和8年）の場合は西暦に直す。
- 読み取れない文字は推測しすぎず、わかる範囲で書く。`;

// 読み取りに失敗したときのエラー（status は HTTP ステータスコード）
export class ReceiptError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

/**
 * レシート画像を読み取る
 * @param {{ mediaType: string, data: string }} image - 画像の形式と Base64 文字列
 * @returns {Promise<{ store: string, date: string, items: Array, total: number }>}
 */
export async function readReceipt(image) {
  let response;
  try {
    response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: image.mediaType, data: image.data },
            },
            { type: "text", text: "このレシートを読み取ってください。" },
          ],
        },
      ],
      output_config: {
        effort: "medium",
        format: zodOutputFormat(ReceiptSchema),
      },
    });
  } catch (error) {
    throw toReceiptError(error);
  }

  // 途中で止まった場合などは、結果が正しくない可能性があるのでエラーにする
  if (response.stop_reason === "refusal") {
    throw new ReceiptError("この画像は読み取れませんでした。別の画像でお試しください。", 422);
  }
  if (response.stop_reason === "max_tokens") {
    throw new ReceiptError("レシートが長すぎて読み取りきれませんでした。", 422);
  }
  const result = response.parsed_output;
  if (!result) {
    throw new ReceiptError("読み取り結果の形式が正しくありませんでした。もう一度お試しください。", 502);
  }

  // 日付の形式が正しくない場合は空にして、画面側で入力してもらう
  if (!isValidDate(result.date)) {
    result.date = "";
  }
  return result;
}

// YYYY-MM-DD 形式で、実在する日付かどうか
function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

// SDK のエラーを、画面に出せる日本語のメッセージに変換する
function toReceiptError(error) {
  if (error instanceof Anthropic.AuthenticationError) {
    return new ReceiptError("API キーが正しくありません。.env の ANTHROPIC_API_KEY を確認してください。", 500);
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new ReceiptError("リクエストが多すぎます。少し待ってからお試しください。", 429);
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new ReceiptError("画像を処理できませんでした。別の画像でお試しください。", 400);
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new ReceiptError("Claude API に接続できませんでした。ネットワークを確認してください。", 502);
  }
  if (error instanceof Anthropic.APIError) {
    return new ReceiptError(`Claude API でエラーが発生しました（${error.status}）。`, 502);
  }
  // API キーが設定されていない場合など
  console.error(error);
  return new ReceiptError("読み取り中にエラーが発生しました。サーバーのログを確認してください。", 500);
}
