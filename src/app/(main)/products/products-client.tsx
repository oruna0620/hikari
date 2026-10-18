"use client";

import { useState } from "react";
import type { Product } from "@/domain/common/entities/product";
import { createProduct, updateProduct, deleteProduct } from "./actions";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import s from "../../_components/shared.module.css";

type FormData = Omit<Product, "id" | "createdAt" | "updatedAt" | "isDeleted">;

const emptyForm: FormData = {
  productCode: null,
  name: "",
  modelNumber: null,
  manufacturer: null,
  unitPrice: "0",
  unit: "個",
  category: null,
  description: null,
};

export function ProductsClient({ products }: { products: Product[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      productCode: p.productCode,
      name: p.name,
      modelNumber: p.modelNumber,
      manufacturer: p.manufacturer,
      unitPrice: p.unitPrice,
      unit: p.unit,
      category: p.category,
      description: p.description,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (editing) {
      await updateProduct(editing.id, form);
    } else {
      await createProduct(form);
    }
    setShowForm(false);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("この品目を削除しますか？")) return;
    await deleteProduct(id);
  }

  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value || null }));
  }

  return (
    <>
      <div className={s.pageHeader}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
          <h1 className={s.pageTitle}>品目一覧</h1>
          <span className={s.count}>{products.length} 件</span>
        </div>
        <button className={s.btnPrimary} onClick={openCreate}>
          <AddRoundedIcon style={{ fontSize: 16 }} />
          品目を追加
        </button>
      </div>

      <div className={s.tableWrap}>
        {products.length === 0 ? (
          <div className={s.empty}>品目が登録されていません。</div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>品目コード</th>
                <th>品目名</th>
                <th>型番</th>
                <th>メーカー</th>
                <th className={s.textRight}>単価</th>
                <th>単位</th>
                <th>カテゴリ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.productCode ?? "—"}</td>
                  <td>{p.name}</td>
                  <td>{p.modelNumber ?? "—"}</td>
                  <td>{p.manufacturer ?? "—"}</td>
                  <td className={s.textRight}>
                    {Number(p.unitPrice).toLocaleString("ja-JP")}
                  </td>
                  <td>{p.unit}</td>
                  <td>{p.category ?? "—"}</td>
                  <td>
                    <div className={s.actionsCell}>
                      <button className={s.btnIcon} onClick={() => openEdit(p)}>
                        <EditRoundedIcon style={{ fontSize: 16 }} />
                      </button>
                      <button className={s.btnIcon} onClick={() => handleDelete(p.id)}>
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
              {editing ? "品目を編集" : "品目を追加"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>品目コード</label>
                  <input
                    className={s.formInput}
                    value={form.productCode ?? ""}
                    onChange={(e) => set("productCode", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>品目名 *</label>
                  <input
                    className={s.formInput}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>型番</label>
                  <input
                    className={s.formInput}
                    value={form.modelNumber ?? ""}
                    onChange={(e) => set("modelNumber", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>メーカー</label>
                  <input
                    className={s.formInput}
                    value={form.manufacturer ?? ""}
                    onChange={(e) => set("manufacturer", e.target.value)}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>単価</label>
                  <input
                    className={s.formInput}
                    type="number"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>単位</label>
                  <input
                    className={s.formInput}
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>カテゴリ</label>
                  <input
                    className={s.formInput}
                    value={form.category ?? ""}
                    onChange={(e) => set("category", e.target.value)}
                  />
                </div>
                <div className={s.formGroupFull}>
                  <label className={s.formLabel}>説明</label>
                  <textarea
                    className={s.formTextarea}
                    value={form.description ?? ""}
                    onChange={(e) => set("description", e.target.value)}
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
