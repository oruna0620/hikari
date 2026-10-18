import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "株式会社光",
  description: "LINE業務システム",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function LiffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div style={{ minHeight: "100dvh" }}>{children}</div>;
}
