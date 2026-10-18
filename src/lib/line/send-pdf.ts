import { getLineClient } from "./client";
import type { messagingApi } from "@line/bot-sdk";

export async function sendPdfLink(params: {
  lineUserId: string;
  title: string;
  documentNumber: string;
  downloadUrl: string;
}): Promise<void> {
  const client = getLineClient();

  const flexMessage: messagingApi.FlexMessage = {
    type: "flex",
    altText: `${params.title} ${params.documentNumber}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: params.title,
            weight: "bold",
            size: "lg",
            color: "#1a1a1a",
          },
        ],
        paddingBottom: "none",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: params.documentNumber,
            size: "sm",
            color: "#666666",
            margin: "md",
          },
          {
            type: "text",
            text: "作成が完了しました。下のボタンからPDFをダウンロードできます。",
            size: "sm",
            color: "#888888",
            wrap: true,
            margin: "lg",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "PDFをダウンロード",
              uri: params.downloadUrl,
            },
            style: "primary",
            color: "#0ea5e9",
          },
        ],
      },
    },
  };

  await client.pushMessage({
    to: params.lineUserId,
    messages: [flexMessage],
  });
}
