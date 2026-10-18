import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceData } from "@/lib/ai/extract-invoice";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await extractInvoiceData(id);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Extraction error:", err);
    const message =
      err instanceof Error ? err.message : "抽出に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
