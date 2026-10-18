"use client";

import { deleteEstimate } from "./actions";
import Link from "next/link";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import s from "../../_components/shared.module.css";

type Estimate = {
  id: string;
  estimateNumber: string;
  customerName: string | null;
  title: string | null;
  issueDate: string;
  expiryDate: string | null;
  totalAmount: string;
  status: string;
};

const statusLabels: Record<string, string> = {
  draft: "下書き",
  sent: "送付済",
  accepted: "受注",
  rejected: "失注",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "accepted"
      ? s.badgeAccepted
      : status === "sent"
        ? s.badgeSent
        : status === "rejected"
          ? s.badgeRejected
          : s.badgeDraft;
  return <span className={cls}>{statusLabels[status] ?? status}</span>;
}

export function EstimatesClient({
  estimates,
}: {
  estimates: Estimate[];
}) {
  return (
    <>
      <div className={s.pageHeader}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0.75rem",
          }}
        >
          <h1 className={s.pageTitle}>見積もり一覧</h1>
          <span className={s.count}>{estimates.length} 件</span>
        </div>
        <Link href="/estimates/new" className={s.btnPrimary}>
          <AddRoundedIcon style={{ fontSize: 16 }} />
          見積もりを作成
        </Link>
      </div>

      <div className={s.tableWrap}>
        {estimates.length === 0 ? (
          <div className={s.empty}>見積もりがありません。</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>見積番号</th>
                <th>顧客名</th>
                <th>件名</th>
                <th>発行日</th>
                <th>有効期限</th>
                <th className={s.textRight}>合計金額</th>
                <th>状態</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((est) => (
                <tr key={est.id}>
                  <td>{est.estimateNumber}</td>
                  <td>{est.customerName ?? "—"}</td>
                  <td>{est.title ?? "—"}</td>
                  <td>{est.issueDate}</td>
                  <td>{est.expiryDate ?? "—"}</td>
                  <td className={s.textRight}>
                    ¥{Number(est.totalAmount).toLocaleString()}
                  </td>
                  <td>
                    <StatusBadge status={est.status} />
                  </td>
                  <td>
                    <div className={s.actionsCell}>
                      <a
                        href={`/api/estimates/${est.id}/pdf`}
                        className={s.btnIcon}
                        title="PDF出力"
                        download
                      >
                        <PictureAsPdfRoundedIcon style={{ fontSize: 16 }} />
                      </a>
                      <Link
                        href={`/estimates/${est.id}`}
                        className={s.btnIcon}
                        title="編集"
                      >
                        <EditRoundedIcon style={{ fontSize: 16 }} />
                      </Link>
                      <button
                        className={s.btnIcon}
                        title="削除"
                        onClick={async () => {
                          if (!confirm("この見積もりを削除しますか？")) return;
                          await deleteEstimate(est.id);
                        }}
                      >
                        <DeleteRoundedIcon style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
