import OpenAI from "openai";
import { readFile } from "fs/promises";
import { join } from "path";
import { db } from "@/infrastructure/db/client";
import { uploadedDocuments } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";

export type ExtractedLineItem = {
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
};

export type ExtractedInvoiceData = {
  vendorName: string;
  issueDate: string | null;
  dueDate: string | null;
  items: ExtractedLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
};

const SYSTEM_PROMPT = `あなたは請求書データ抽出AIです。アップロードされた請求書画像/PDFから以下の情報をJSON形式で抽出してください。

必ず以下のJSON形式で返してください（他のテキストは不要）:
{
  "vendorName": "取引先名（会社名）",
  "issueDate": "発行日（YYYY-MM-DD形式、不明ならnull）",
  "dueDate": "支払期限（YYYY-MM-DD形式、不明ならnull）",
  "items": [
    {
      "itemName": "品名・項目名",
      "quantity": 1,
      "unit": "個",
      "unitPrice": 10000,
      "amount": 10000
    }
  ],
  "subtotal": 10000,
  "taxAmount": 1000,
  "totalAmount": 11000
}

注意:
- 金額は数値（number）で返すこと（カンマや円マークは含めない）
- 日付はYYYY-MM-DD形式で返すこと
- 明細が読み取れない場合は、合計金額を1行の明細として返すこと
- 税額が不明な場合は小計の10%として計算すること
- 読み取れない項目はnullまたは空文字を使用すること`;

export async function extractInvoiceData(
  documentId: string
): Promise<ExtractedInvoiceData> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Fetch document record
  const [doc] = await db
    .select()
    .from(uploadedDocuments)
    .where(eq(uploadedDocuments.id, documentId));

  if (!doc) {
    throw new Error("ドキュメントが見つかりません");
  }

  // Read file from disk
  const filePath = join(process.cwd(), "public", doc.fileUrl);
  const fileBuffer = await readFile(filePath);
  const base64 = fileBuffer.toString("base64");

  // Determine media type
  const ext = doc.fileType.toLowerCase();
  let mediaType: string;
  if (ext === "pdf") {
    mediaType = "application/pdf";
  } else if (ext === "png") {
    mediaType = "image/png";
  } else if (ext === "jpg" || ext === "jpeg") {
    mediaType = "image/jpeg";
  } else if (ext === "webp") {
    mediaType = "image/webp";
  } else if (ext === "gif") {
    mediaType = "image/gif";
  } else {
    mediaType = "application/octet-stream";
  }

  const dataUrl = `data:${mediaType};base64,${base64}`;

  // Build content parts depending on file type
  const isPdf = ext === "pdf";
  const userContent = isPdf
    ? [
        {
          type: "input_file" as const,
          file_data: dataUrl,
          filename: doc.fileName,
        },
        {
          type: "input_text" as const,
          text: "この請求書からデータを抽出してください。",
        },
      ]
    : [
        {
          type: "input_image" as const,
          image_url: dataUrl,
          detail: "high" as const,
        },
        {
          type: "input_text" as const,
          text: "この請求書からデータを抽出してください。",
        },
      ];

  // Call OpenAI Responses API (supports both images and PDFs)
  const response = await openai.responses.create({
    model: "gpt-4o",
    instructions: SYSTEM_PROMPT,
    input: [
      {
        role: "user",
        content: userContent,
      },
    ],
    temperature: 0,
  });

  const rawContent = response.output_text ?? "";

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = rawContent.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  let extracted: ExtractedInvoiceData;
  try {
    extracted = JSON.parse(jsonStr);
  } catch {
    // If parsing fails, store raw response and return defaults
    await db
      .update(uploadedDocuments)
      .set({
        aiRawResponse: { raw: rawContent },
        status: "extraction_failed",
      })
      .where(eq(uploadedDocuments.id, documentId));
    throw new Error("AIレスポンスの解析に失敗しました");
  }

  // Ensure items array exists
  if (!Array.isArray(extracted.items)) {
    extracted.items = [];
  }

  // Save to DB
  await db
    .update(uploadedDocuments)
    .set({
      aiRawResponse: { raw: rawContent },
      aiExtractedData: extracted,
      status: "extracted",
    })
    .where(eq(uploadedDocuments.id, documentId));

  return extracted;
}
