import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BUTIKOMI",
  description: "見積もり・入出金・在庫管理システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
