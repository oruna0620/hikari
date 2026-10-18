import { NextResponse } from "next/server";
import { verifySignature } from "@/lib/line/verify-signature";
import { getLineClient } from "@/lib/line/client";
import {
  getState,
  setState,
  clearState,
  type ConversationState,
} from "@/lib/line/conversation";
import { repositories } from "@/lib/di/container";
import { sendPdfLink } from "@/lib/line/send-pdf";
import { db } from "@/infrastructure/db/client";
import {
  estimates,
  estimateItems,
  invoices,
  invoiceItems,
} from "@/infrastructure/db/schema";
import { desc, eq, like, or, ilike } from "drizzle-orm";
import { products } from "@/infrastructure/db/schema";
import type { messagingApi } from "@line/bot-sdk";

// ── Number generators ──

async function generateEstimateNumber(): Promise<string> {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const prefix = `EST-${y}${m}${d}-`;

  const existing = await db
    .select({ estimateNumber: estimates.estimateNumber })
    .from(estimates)
    .where(like(estimates.estimateNumber, `${prefix}%`))
    .orderBy(desc(estimates.estimateNumber))
    .limit(1);

  let seq = 1;
  if (existing.length > 0) {
    const lastSeq = parseInt(
      existing[0].estimateNumber.split("-").pop() ?? "0",
      10
    );
    seq = lastSeq + 1;
  }
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const prefix = `INV-${y}${m}${d}-`;

  const existing = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(like(invoices.invoiceNumber, `${prefix}%`))
    .orderBy(desc(invoices.invoiceNumber))
    .limit(1);

  let seq = 1;
  if (existing.length > 0) {
    const lastSeq = parseInt(
      existing[0].invoiceNumber.split("-").pop() ?? "0",
      10
    );
    seq = lastSeq + 1;
  }
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

// ── Reply helpers ──

// Use pushMessage with userId (more reliable than replyToken)
let _currentUserId = "";

async function reply(replyToken: string, text: string) {
  const client = getLineClient();
  try {
    await client.replyMessage({
      replyToken,
      messages: [{ type: "text", text }],
    });
  } catch {
    // Fallback to push if reply fails
    await client.pushMessage({
      to: _currentUserId,
      messages: [{ type: "text", text }],
    });
  }
}

async function replyWithQuickReply(
  replyToken: string,
  text: string,
  items: { label: string; text: string }[]
) {
  const client = getLineClient();
  const message = {
    type: "text" as const,
    text,
    quickReply: {
      items: items.map((item) => ({
        type: "action" as const,
        action: {
          type: "message" as const,
          label: item.label.slice(0, 20),
          text: item.text,
        },
      })),
    },
  };
  try {
    await client.replyMessage({ replyToken, messages: [message] });
  } catch {
    await client.pushMessage({ to: _currentUserId, messages: [message] });
  }
}

async function replyWithPostbackQuickReply(
  replyToken: string,
  text: string,
  items: { label: string; data: string; displayText: string }[]
) {
  const client = getLineClient();
  const message = {
    type: "text" as const,
    text,
    quickReply: {
      items: items.map((item) => ({
        type: "action" as const,
        action: {
          type: "postback" as const,
          label: item.label.slice(0, 20),
          data: item.data,
          displayText: item.displayText,
        },
      })),
    },
  };
  try {
    await client.replyMessage({ replyToken, messages: [message] });
  } catch {
    await client.pushMessage({ to: _currentUserId, messages: [message] });
  }
}

// ── Show item summary ──

async function showItemSummary(state: ConversationState, replyToken: string) {
  const summary = state.items
    .map(
      (item, i) =>
        `${i + 1}. ${item.itemName}\n   ${item.quantity}${item.unit} × ¥${item.unitPrice.toLocaleString()} = ¥${(item.quantity * item.unitPrice).toLocaleString()}`
    )
    .join("\n");

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  return replyWithQuickReply(
    replyToken,
    `【明細】\n${summary}\n\n小計: ¥${subtotal.toLocaleString()}\n\n品目を追加しますか？`,
    [
      { label: "追加する", text: "追加する" },
      { label: "作成する", text: "作成する" },
      { label: "キャンセル", text: "キャンセル" },
    ]
  );
}

// ── Show main menu ──

async function showMenu(replyToken: string) {
  await replyWithQuickReply(
    replyToken,
    "BUTIKOMIです。\n操作を選択してください。",
    [
      { label: "見積もり作成", text: "見積もり作成" },
      { label: "請求書作成", text: "請求書作成" },
    ]
  );
}

// ── Start document flow ──

async function startDocumentFlow(
  userId: string,
  docType: "estimate" | "invoice",
  replyToken: string
) {
  const customerList = await repositories.customer.findAll();

  if (customerList.length === 0) {
    return reply(
      replyToken,
      "顧客が登録されていません。先にシステムで顧客を登録してください。"
    );
  }

  const state: ConversationState = {
    step: "select_customer",
    docType,
    items: [],
    currentItem: {},
  };
  setState(userId, state);

  const label = docType === "estimate" ? "見積もり" : "請求書";

  // Quick Reply can have up to 13 items
  const quickReplyItems = customerList.slice(0, 12).map((c) => ({
    label: (c.customerName || c.companyName || "名無し").slice(0, 20),
    data: `customer:${c.id}`,
    displayText: c.customerName || c.companyName || "名無し",
  }));

  // Add cancel button
  quickReplyItems.push({
    label: "キャンセル",
    data: "cancel",
    displayText: "キャンセル",
  });

  await replyWithPostbackQuickReply(
    replyToken,
    `【${label}作成】\n顧客を選択してください。`,
    quickReplyItems
  );
}

// ── Create document ──

async function createDocument(
  lineUserId: string,
  state: ConversationState,
  replyToken: string
) {
  // Resolve LINE user to system user
  let mapping =
    await repositories.lineUserMapping.findByLineUserId(lineUserId);
  if (!mapping) {
    const users = await repositories.user.findAll();
    if (users.length === 0) {
      clearState(lineUserId);
      return reply(replyToken, "システムにユーザーが登録されていません。");
    }
    mapping = await repositories.lineUserMapping.upsert({
      lineUserId,
      userId: users[0].id,
    });
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://hikari.example.com";
  const today = new Date().toISOString().split("T")[0];

  // Calculate totals
  let subtotal = 0;
  const processedItems = state.items.map((item, idx) => {
    const amount = item.quantity * item.unitPrice;
    subtotal += amount;
    return {
      sortOrder: idx + 1,
      itemName: item.itemName,
      quantity: String(item.quantity),
      unit: item.unit,
      unitPrice: String(item.unitPrice),
      amount: String(amount),
    };
  });

  const taxRate = "10.00";
  const taxAmount = Math.floor(subtotal * 0.1);
  const totalAmount = subtotal + taxAmount;

  try {
    if (state.docType === "estimate") {
      const estimateNumber = await generateEstimateNumber();

      const result = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(estimates)
          .values({
            estimateNumber,
            customerId: state.customerId || null,
            customerName: state.customerName || null,
            issueDate: today,
            subtotal: String(subtotal),
            taxRate,
            taxAmount: String(taxAmount),
            totalAmount: String(totalAmount),
            status: "draft",
            sourceType: "line",
            createdBy: mapping!.userId,
          })
          .returning();

        if (processedItems.length > 0) {
          await tx.insert(estimateItems).values(
            processedItems.map((item) => ({
              estimateId: inserted.id,
              ...item,
            }))
          );
        }
        return inserted;
      });

      clearState(lineUserId);

      // Send PDF link
      try {
        await sendPdfLink({
          lineUserId,
          title: "見積書",
          documentNumber: estimateNumber,
          downloadUrl: `${appUrl}/api/estimates/${result.id}/pdf`,
        });
      } catch {
        // If push fails, reply instead
        await reply(
          replyToken,
          `見積書を作成しました。\n番号: ${estimateNumber}\n合計: ¥${totalAmount.toLocaleString()}\n\nPDF: ${appUrl}/api/estimates/${result.id}/pdf`
        );
        return;
      }

      await reply(
        replyToken,
        `見積書を作成しました!\n番号: ${estimateNumber}\n顧客: ${state.customerName}\n合計: ¥${totalAmount.toLocaleString()}（税込）\n\nPDFをお送りしました。`
      );
    } else {
      const invoiceNumber = await generateInvoiceNumber();

      const result = await db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(invoices)
          .values({
            invoiceNumber,
            customerId: state.customerId!,
            issueDate: today,
            subtotal: String(subtotal),
            taxRate,
            taxAmount: String(taxAmount),
            totalAmount: String(totalAmount),
            sourceType: "line",
            createdBy: mapping!.userId,
          })
          .returning();

        if (processedItems.length > 0) {
          await tx.insert(invoiceItems).values(
            processedItems.map((item) => ({
              invoiceId: inserted.id,
              ...item,
            }))
          );
        }
        return inserted;
      });

      clearState(lineUserId);

      try {
        await sendPdfLink({
          lineUserId,
          title: "請求書",
          documentNumber: invoiceNumber,
          downloadUrl: `${appUrl}/api/invoices/${result.id}/pdf`,
        });
      } catch {
        await reply(
          replyToken,
          `請求書を作成しました。\n番号: ${invoiceNumber}\n合計: ¥${totalAmount.toLocaleString()}\n\nPDF: ${appUrl}/api/invoices/${result.id}/pdf`
        );
        return;
      }

      await reply(
        replyToken,
        `請求書を作成しました!\n番号: ${invoiceNumber}\n顧客: ${state.customerName}\n合計: ¥${totalAmount.toLocaleString()}（税込）\n\nPDFをお送りしました。`
      );
    }
  } catch (err) {
    clearState(lineUserId);
    const msg = err instanceof Error ? err.message : "不明なエラー";
    await reply(replyToken, `作成に失敗しました: ${msg}`);
  }
}

// ── Handle text message ──

async function handleTextMessage(
  userId: string,
  text: string,
  replyToken: string
) {
  // Cancel at any point
  if (text === "キャンセル" || text === "取消") {
    clearState(userId);
    return reply(replyToken, "キャンセルしました。");
  }

  // Keywords always restart the flow (even if state exists)
  if (text.includes("見積")) {
    clearState(userId);
    return startDocumentFlow(userId, "estimate", replyToken);
  }
  if (text.includes("請求")) {
    clearState(userId);
    return startDocumentFlow(userId, "invoice", replyToken);
  }

  const state = getState(userId);

  // No active conversation → show menu
  if (!state) {
    return showMenu(replyToken);
  }

  // Active conversation → handle based on step
  switch (state.step) {
    case "select_customer": {
      // User typed text instead of using Quick Reply → try to match
      const customerList = await repositories.customer.findAll();
      const matched = customerList.find(
        (c) =>
          c.customerName?.includes(text) || c.companyName?.includes(text)
      );
      if (matched) {
        state.customerId = matched.id;
        state.customerName =
          matched.customerName || matched.companyName || "";
        state.step = "search_product";
        setState(userId, state);
        return reply(
          replyToken,
          `顧客: ${state.customerName}\n\n商品名や型番の一部を入力してください。\n（例: NC-220、ネオコイル）\n\n手入力する場合は「手入力」と送信してください。`
        );
      }
      return reply(
        replyToken,
        "該当する顧客が見つかりません。正確な名前を入力するか、下の選択肢から選んでください。"
      );
    }

    case "search_product": {
      // Manual entry mode
      if (text === "手入力") {
        state.step = "enter_item_name";
        setState(userId, state);
        return reply(replyToken, "品名を入力してください。");
      }

      // Search products by name or model number
      const keyword = `%${text}%`;
      const results = await db
        .select()
        .from(products)
        .where(
          or(
            ilike(products.name, keyword),
            ilike(products.modelNumber, keyword)
          )
        )
        .limit(12);

      if (results.length === 0) {
        return replyWithQuickReply(
          replyToken,
          `「${text}」に該当する商品が見つかりません。\n別のキーワードで検索するか、手入力してください。`,
          [
            { label: "手入力", text: "手入力" },
            { label: "キャンセル", text: "キャンセル" },
          ]
        );
      }

      const quickReplyItems = results.map((p) => ({
        label: (p.modelNumber || p.name).slice(0, 20),
        data: `product:${p.id}`,
        displayText: (p.modelNumber || p.name).slice(0, 20),
      }));

      quickReplyItems.push({
        label: "手入力",
        data: "manual_entry",
        displayText: "手入力",
      });

      await replyWithPostbackQuickReply(
        replyToken,
        `${results.length}件見つかりました。選択してください。\n\n${results.map((p) => `・${p.name} ¥${Number(p.unitPrice).toLocaleString()}/${p.unit}`).join("\n")}`,
        quickReplyItems
      );
      return;
    }

    case "enter_item_name": {
      state.currentItem = { itemName: text };
      state.step = "enter_quantity";
      setState(userId, state);
      return reply(replyToken, "数量を入力してください。（例: 1）");
    }

    case "enter_quantity": {
      const qty = Number(text.replace(/,/g, ""));
      if (isNaN(qty) || qty <= 0) {
        return reply(replyToken, "正の数字で入力してください。");
      }
      state.currentItem.quantity = qty;

      // If unit price is already set (from product selection), skip to confirm
      if (state.currentItem.unitPrice != null) {
        state.items.push({
          itemName: state.currentItem.itemName!,
          quantity: qty,
          unit: state.currentItem.unit || "式",
          unitPrice: state.currentItem.unitPrice,
        });
        state.currentItem = {};
        state.step = "confirm_more";
        setState(userId, state);
        return showItemSummary(state, replyToken);
      }

      // Manual entry → ask for unit price
      state.currentItem.unit = "式";
      state.step = "enter_unit_price";
      setState(userId, state);
      return reply(replyToken, "単価（円）を入力してください。（例: 50000）");
    }

    case "enter_unit_price": {
      const price = Number(text.replace(/[,¥￥]/g, ""));
      if (isNaN(price) || price < 0) {
        return reply(replyToken, "正しい金額を入力してください。");
      }
      state.items.push({
        itemName: state.currentItem.itemName!,
        quantity: state.currentItem.quantity!,
        unit: state.currentItem.unit || "式",
        unitPrice: price,
      });
      state.currentItem = {};
      state.step = "confirm_more";
      setState(userId, state);
      return showItemSummary(state, replyToken);
    }

    case "confirm_more": {
      if (text === "追加する" || text === "追加") {
        state.step = "search_product";
        setState(userId, state);
        return reply(
          replyToken,
          "商品名や型番の一部を入力してください。\n\n手入力する場合は「手入力」と送信してください。"
        );
      }
      if (text === "作成する" || text === "作成") {
        return createDocument(userId, state, replyToken);
      }
      return replyWithQuickReply(
        replyToken,
        "下の選択肢から選んでください。",
        [
          { label: "追加する", text: "追加する" },
          { label: "作成する", text: "作成する" },
          { label: "キャンセル", text: "キャンセル" },
        ]
      );
    }

    default:
      clearState(userId);
      return showMenu(replyToken);
  }
}

// ── Handle postback (customer selection) ──

async function handlePostback(
  userId: string,
  data: string,
  replyToken: string
) {
  if (data === "cancel") {
    clearState(userId);
    return reply(replyToken, "キャンセルしました。");
  }

  if (data.startsWith("customer:")) {
    const customerId = data.replace("customer:", "");
    const state = getState(userId);

    if (!state || state.step !== "select_customer") {
      return reply(replyToken, "最初からやり直してください。");
    }

    const customer = await repositories.customer.findById(customerId);
    if (!customer) {
      clearState(userId);
      return reply(replyToken, "顧客が見つかりません。最初からやり直してください。");
    }

    state.customerId = customer.id;
    state.customerName =
      customer.customerName || customer.companyName || "";
    state.step = "search_product";
    setState(userId, state);

    return reply(
      replyToken,
      `顧客: ${state.customerName}\n\n商品名や型番の一部を入力してください。\n（例: NC-220、ネオコイル）\n\n手入力する場合は「手入力」と送信してください。`
    );
  }

  if (data === "manual_entry") {
    const state = getState(userId);
    if (!state) {
      return reply(replyToken, "最初からやり直してください。");
    }
    state.step = "enter_item_name";
    setState(userId, state);
    return reply(replyToken, "品名を入力してください。");
  }

  if (data.startsWith("product:")) {
    const productId = data.replace("product:", "");
    const state = getState(userId);

    if (!state || state.step !== "search_product") {
      return reply(replyToken, "最初からやり直してください。");
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return reply(replyToken, "商品が見つかりません。もう一度検索してください。");
    }

    state.currentItem = {
      itemName: product.name,
      unit: product.unit,
      unitPrice: Number(product.unitPrice),
    };
    state.step = "enter_quantity";
    setState(userId, state);

    return reply(
      replyToken,
      `${product.name}\n単価: ¥${Number(product.unitPrice).toLocaleString()} / ${product.unit}\n\n数量を入力してください。`
    );
  }
}

// ── Webhook entry point ──

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!signature || !verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = JSON.parse(body);
  const events = parsed.events ?? [];

  for (const event of events) {
    const userId = event.source?.userId;
    if (!userId) continue;

    _currentUserId = userId;

    try {
      if (event.type === "message" && event.message.type === "text") {
        await handleTextMessage(userId, event.message.text, event.replyToken);
      } else if (event.type === "postback") {
        await handlePostback(userId, event.postback.data, event.replyToken);
      } else if (event.type === "follow") {
        // New friend added
        await reply(
          event.replyToken,
          "BUTIKOMIです。\n「見積もり」または「請求書」と送信してください。"
        );
      }
    } catch (err) {
      console.error("Webhook event error:", err);
    }
  }

  return NextResponse.json({ status: "ok" });
}
