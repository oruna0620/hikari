import Link from "next/link";
import styles from "./page.module.css";

const cards = [
  {
    href: "/estimates",
    title: "見積もり管理",
    desc: "見積書の作成・管理を行います。品目マスタから明細を選択し、PDFを出力できます。",
    iconStyle: "iconEstimate" as const,
  },
  {
    href: "/cashflow",
    title: "入出金管理",
    desc: "請求書の発行や入金確認、経費の記録など、お金の流れを管理します。",
    iconStyle: "iconCashflow" as const,
  },
  {
    href: "/inventory",
    title: "在庫管理",
    desc: "品目の在庫数を管理します。入出庫の履歴やQRコードによる棚卸しに対応します。",
    iconStyle: "iconInventory" as const,
  },
] as const;

export default function Home() {
  return (
    <>
      <h1 className={styles.title}>ダッシュボード</h1>
      <p className={styles.subtitle}>社内管理システム(仮)</p>
      <div className={styles.grid}>
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className={styles.card}>
            <div className={styles.cardTitle}>{c.title}</div>
            <div className={styles.cardDesc}>{c.desc}</div>
            <div className={styles.cardArrow}>→</div>
          </Link>
        ))}
      </div>
    </>
  );
}
