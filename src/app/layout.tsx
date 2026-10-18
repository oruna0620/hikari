import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "株式会社光 業務システム",
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
