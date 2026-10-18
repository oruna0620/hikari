"use client";

import { useState } from "react";
import type { Customer } from "@/domain/common/entities/customer";
import { createCustomer, updateCustomer, deleteCustomer } from "./actions";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import s from "../../_components/shared.module.css";

type FormData = Omit<Customer, "id" | "createdAt" | "updatedAt" | "isDeleted">;

const emptyForm: FormData = {
  companyName: null,
  customerName: "",
  contactPerson: null,
  phone: null,
  email: null,
  postalCode: null,
  address: null,
  billingPostalCode: null,
  billingAddress: null,
  notes: null,
};

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      companyName: c.companyName,
      customerName: c.customerName,
      contactPerson: c.contactPerson,
      phone: c.phone,
      email: c.email,
      postalCode: c.postalCode,
      address: c.address,
      billingPostalCode: c.billingPostalCode,
      billingAddress: c.billingAddress,
      notes: c.notes,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (editing) {
      await updateCustomer(editing.id, form);
    } else {
      await createCustomer(form);
    }
    setShowForm(false);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("この顧客を削除しますか？")) return;
    await deleteCustomer(id);
  }

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value || null }));
  }

  return (
    <>
      <div className={s.pageHeader}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
          <h1 className={s.pageTitle}>顧客一覧</h1>
          <span className={s.count}>{customers.length} 件</span>
        </div>
        <button className={s.btnPrimary} onClick={openCreate}>
          <AddRoundedIcon style={{ fontSize: 16 }} />
          顧客を追加
        </button>
      </div>

      <div className={s.tableWrap}>
        {customers.length === 0 ? (
          <div className={s.empty}>顧客が登録されていません。</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>会社名</th>
                <th>顧客名</th>
                <th>担当者</th>
                <th>電話番号</th>
                <th>メール</th>
                <th>住所</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.companyName ?? "—"}</td>
                  <td>{c.customerName}</td>
                  <td>{c.contactPerson ?? "—"}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.address ?? "—"}</td>
                  <td>
                    <div className={s.actionsCell}>
                      <button className={s.btnIcon} onClick={() => openEdit(c)}>
                        <EditRoundedIcon style={{ fontSize: 16 }} />
                      </button>
                      <button className={s.btnIcon} onClick={() => handleDelete(c.id)}>
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

      {showForm && (
        <div className={s.overlay} onClick={() => setShowForm(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={s.modalTitle}>
              {editing ? "顧客を編集" : "顧客を追加"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>会社名</label>
                  <input
                    className={s.formInput}
                    value={form.companyName ?? ""}
                    onChange={(e) => set("companyName", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>顧客名 *</label>
                  <input
                    className={s.formInput}
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    required
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>担当者</label>
                  <input
                    className={s.formInput}
                    value={form.contactPerson ?? ""}
                    onChange={(e) => set("contactPerson", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>電話番号</label>
                  <input
                    className={s.formInput}
                    value={form.phone ?? ""}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>メール</label>
                  <input
                    className={s.formInput}
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>郵便番号</label>
                  <input
                    className={s.formInput}
                    value={form.postalCode ?? ""}
                    onChange={(e) => set("postalCode", e.target.value)}
                  />
                </div>
                <div className={s.formGroupFull}>
                  <label className={s.formLabel}>住所</label>
                  <input
                    className={s.formInput}
                    value={form.address ?? ""}
                    onChange={(e) => set("address", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>請求先郵便番号</label>
                  <input
                    className={s.formInput}
                    value={form.billingPostalCode ?? ""}
                    onChange={(e) => set("billingPostalCode", e.target.value)}
                  />
                </div>
                <div className={s.formGroupFull}>
                  <label className={s.formLabel}>請求先住所</label>
                  <input
                    className={s.formInput}
                    value={form.billingAddress ?? ""}
                    onChange={(e) => set("billingAddress", e.target.value)}
                  />
                </div>
                <div className={s.formGroupFull}>
                  <label className={s.formLabel}>メモ</label>
                  <textarea
                    className={s.formTextarea}
                    value={form.notes ?? ""}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                </div>
              </div>
              <div className={s.formActions}>
                <button type="submit" className={s.btnPrimary} disabled={loading}>
                  {loading ? "保存中..." : "保存"}
                </button>
                <button
                  type="button"
                  className={s.btnSecondary}
                  onClick={() => setShowForm(false)}
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
