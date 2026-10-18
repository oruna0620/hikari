"use client";

import Link from "next/link";
import s from "./_components/liff.module.css";

export default function LiffMenuPage() {
  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1 className={s.title}>株式会社光</h1>
        <p className={s.subtitle}>業務メニュー</p>
      </div>

      <Link href="/liff/estimate" className={s.menuCard}>
        <span className={s.menuIcon}>📝</span>
        <div>
          <div className={s.menuLabel}>見積もり作成</div>
          <div className={s.menuDesc}>見積書を作成してPDFを受け取る</div>
        </div>
      </Link>

      <Link href="/liff/invoice" className={s.menuCard}>
        <span className={s.menuIcon}>📄</span>
        <div>
          <div className={s.menuLabel}>請求書作成</div>
          <div className={s.menuDesc}>請求書を作成してPDFを受け取る</div>
        </div>
      </Link>

      <Link href="/liff/inventory" className={s.menuCard}>
        <span className={s.menuIcon}>📦</span>
        <div>
          <div className={s.menuLabel}>在庫操作</div>
          <div className={s.menuDesc}>QRスキャンで入出庫・棚卸</div>
        </div>
      </Link>
    </div>
  );
}
