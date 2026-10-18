import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { db } from "@/infrastructure/db/client";
import { uploadedDocuments } from "@/infrastructure/db/schema";
import { eq } from "drizzle-orm";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : "";
}

/* ── POST: upload file ── */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const estimateId = formData.get("estimateId") as string | null;
    const invoiceId = formData.get("invoiceId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが必要です" }, { status: 400 });
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = getExtension(file.name);
    const storedName = `${randomUUID()}${ext ? `.${ext}` : ""}`;
    const filePath = join(UPLOAD_DIR, storedName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const fileUrl = `/uploads/${storedName}`;

    const [doc] = await db
      .insert(uploadedDocuments)
      .values({
        fileName: file.name,
        fileUrl,
        fileType: ext.slice(0, 10) || "bin",
        status: "uploaded",
        estimateId: estimateId || null,
        invoiceId: invoiceId || null,
      })
      .returning();

    return NextResponse.json({
      id: doc.id,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileType: doc.fileType,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}

/* ── DELETE: remove file ── */
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(uploadedDocuments)
      .where(eq(uploadedDocuments.id, id));

    const doc = rows[0];
    if (!doc) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 404 }
      );
    }

    // Delete physical file
    const filePath = join(process.cwd(), "public", doc.fileUrl);
    try {
      await unlink(filePath);
    } catch {
      // File may already be deleted from disk
    }

    // Delete DB record
    await db.delete(uploadedDocuments).where(eq(uploadedDocuments.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { error: "削除に失敗しました" },
      { status: 500 }
    );
  }
}
