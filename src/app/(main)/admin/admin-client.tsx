"use client";

import { useState } from "react";
import {
  upsertCompanySettings,
  createUser,
  updateUser,
  upsertTaxSettings,
} from "./actions";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import s from "../../_components/shared.module.css";

type Company = {
  id: string;
  companyName: string;
  postalCode: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  registrationNumber: string | null;
  bankInfo: string | null;
  estimateNotes: string | null;
};

type UserRow = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
};

type Tax = {
  id: string;
  taxRate: string;
  roundingMethod: string;
  displayMode: string;
  effectiveFrom: string;
};

type CompanyForm = {
  companyName: string;
  postalCode: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  registrationNumber: string;
  bankInfo: string;
  estimateNotes: string;
};

type UserForm = {
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
  password: string;
};

type TaxForm = {
  taxRate: string;
  roundingMethod: string;
  displayMode: string;
  effectiveFrom: string;
};

const tabs = ["自社情報", "ユーザー管理", "消費税設定"] as const;

export function AdminClient({
  company,
  users,
  tax,
}: {
  company: Company | null;
  users: UserRow[];
  tax: Tax | null;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("自社情報");

  // Company form
  const [companyForm, setCompanyForm] = useState<CompanyForm>({
    companyName: company?.companyName ?? "",
    postalCode: company?.postalCode ?? "",
    address: company?.address ?? "",
    phone: company?.phone ?? "",
    fax: company?.fax ?? "",
    email: company?.email ?? "",
    registrationNumber: company?.registrationNumber ?? "",
    bankInfo: company?.bankInfo ?? "",
    estimateNotes: company?.estimateNotes ?? "",
  });
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companySuccess, setCompanySuccess] = useState("");

  // User management
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [userForm, setUserForm] = useState<UserForm>({
    username: "",
    displayName: "",
    role: "staff",
    isActive: true,
    password: "",
  });
  const [userLoading, setUserLoading] = useState(false);

  // Tax form
  const [taxForm, setTaxForm] = useState<TaxForm>({
    taxRate: tax?.taxRate ?? "10.00",
    roundingMethod: tax?.roundingMethod ?? "floor",
    displayMode: tax?.displayMode ?? "exclusive",
    effectiveFrom: tax?.effectiveFrom ?? new Date().toISOString().split("T")[0],
  });
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxSuccess, setTaxSuccess] = useState("");

  async function handleCompanySave(e: React.FormEvent) {
    e.preventDefault();
    setCompanyLoading(true);
    setCompanySuccess("");
    await upsertCompanySettings({
      companyName: companyForm.companyName,
      postalCode: companyForm.postalCode || null,
      address: companyForm.address || null,
      phone: companyForm.phone || null,
      fax: companyForm.fax || null,
      email: companyForm.email || null,
      registrationNumber: companyForm.registrationNumber || null,
      bankInfo: companyForm.bankInfo || null,
      estimateNotes: companyForm.estimateNotes || null,
    });
    setCompanySuccess("保存しました");
    setCompanyLoading(false);
  }

  function openCreateUser() {
    setEditingUser(null);
    setUserForm({
      username: "",
      displayName: "",
      role: "staff",
      isActive: true,
      password: "",
    });
    setShowUserForm(true);
  }

  function openEditUser(u: UserRow) {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      displayName: u.displayName,
      role: u.role,
      isActive: u.isActive,
      password: "",
    });
    setShowUserForm(true);
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUserLoading(true);
    if (editingUser) {
      await updateUser(editingUser.id, userForm);
    } else {
      await createUser({
        username: userForm.username,
        displayName: userForm.displayName,
        role: userForm.role,
        password: userForm.password,
      });
    }
    setShowUserForm(false);
    setUserLoading(false);
  }

  async function handleTaxSave(e: React.FormEvent) {
    e.preventDefault();
    setTaxLoading(true);
    setTaxSuccess("");
    await upsertTaxSettings(taxForm);
    setTaxSuccess("保存しました");
    setTaxLoading(false);
  }

  return (
    <>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>管理者ページ</h1>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          marginBottom: "1.25rem",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.8125rem",
              fontWeight: tab === t ? 600 : 400,
              color:
                tab === t
                  ? "var(--color-primary)"
                  : "var(--color-text-secondary)",
              borderBottom:
                tab === t
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              marginBottom: "-1px",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 自社情報 */}
      {tab === "自社情報" && (
        <div className={s.formCard}>
          {companySuccess && (
            <div className={s.formSuccess}>{companySuccess}</div>
          )}
          <form onSubmit={handleCompanySave}>
            <div className={s.formGrid}>
              <div className={s.formGroupFull}>
                <label className={s.formLabel}>会社名 *</label>
                <input
                  className={s.formInput}
                  value={companyForm.companyName}
                  onChange={(e) =>
                    setCompanyForm((f) => ({
                      ...f,
                      companyName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>郵便番号</label>
                <input
                  className={s.formInput}
                  value={companyForm.postalCode}
                  onChange={(e) =>
                    setCompanyForm((f) => ({
                      ...f,
                      postalCode: e.target.value,
                    }))
                  }
                />
              </div>
              <div className={s.formGroupFull}>
                <label className={s.formLabel}>住所</label>
                <input
                  className={s.formInput}
                  value={companyForm.address}
                  onChange={(e) =>
                    setCompanyForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>電話番号</label>
                <input
                  className={s.formInput}
                  value={companyForm.phone}
                  onChange={(e) =>
                    setCompanyForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>FAX</label>
                <input
                  className={s.formInput}
                  value={companyForm.fax}
                  onChange={(e) =>
                    setCompanyForm((f) => ({ ...f, fax: e.target.value }))
                  }
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>メール</label>
                <input
                  className={s.formInput}
                  type="email"
                  value={companyForm.email}
                  onChange={(e) =>
                    setCompanyForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>登録番号</label>
                <input
                  className={s.formInput}
                  value={companyForm.registrationNumber}
                  onChange={(e) =>
                    setCompanyForm((f) => ({
                      ...f,
                      registrationNumber: e.target.value,
                    }))
                  }
                  placeholder="T1234567890123"
                />
              </div>
              <div className={s.formGroupFull}>
                <label className={s.formLabel}>振込先情報</label>
                <textarea
                  className={s.formTextarea}
                  value={companyForm.bankInfo}
                  onChange={(e) =>
                    setCompanyForm((f) => ({ ...f, bankInfo: e.target.value }))
                  }
                />
              </div>
              <div className={s.formGroupFull}>
                <label className={s.formLabel}>見積書備考テンプレート</label>
                <textarea
                  className={s.formTextarea}
                  value={companyForm.estimateNotes}
                  onChange={(e) =>
                    setCompanyForm((f) => ({
                      ...f,
                      estimateNotes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className={s.formActions}>
              <button
                type="submit"
                className={s.btnPrimary}
                disabled={companyLoading}
              >
                {companyLoading ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ユーザー管理 */}
      {tab === "ユーザー管理" && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <button className={s.btnPrimary} onClick={openCreateUser}>
              <AddRoundedIcon style={{ fontSize: 16 }} />
              ユーザーを追加
            </button>
          </div>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>ユーザー名</th>
                  <th>表示名</th>
                  <th>権限</th>
                  <th>状態</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.displayName}</td>
                    <td>
                      <span
                        className={s.badge}
                        style={{
                          background:
                            u.role === "admin"
                              ? "var(--color-primary-light)"
                              : "var(--color-neutral-light)",
                          color:
                            u.role === "admin" ? "var(--color-primary)" : "var(--color-neutral)",
                        }}
                      >
                        {u.role === "admin" ? "管理者" : "スタッフ"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={s.badge}
                        style={{
                          background: u.isActive
                            ? "var(--color-positive-light)"
                            : "var(--color-negative-light)",
                          color: u.isActive ? "var(--color-positive)" : "var(--color-negative)",
                        }}
                      >
                        {u.isActive ? "有効" : "無効"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={s.btnIcon}
                        onClick={() => openEditUser(u)}
                      >
                        <EditRoundedIcon style={{ fontSize: 16 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 消費税設定 */}
      {tab === "消費税設定" && (
        <div className={s.formCard}>
          {taxSuccess && <div className={s.formSuccess}>{taxSuccess}</div>}
          <form onSubmit={handleTaxSave}>
            <div className={s.formGrid}>
              <div className={s.formGroup}>
                <label className={s.formLabel}>税率 (%)</label>
                <input
                  className={s.formInput}
                  type="number"
                  step="0.01"
                  value={taxForm.taxRate}
                  onChange={(e) =>
                    setTaxForm((f) => ({ ...f, taxRate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>端数処理</label>
                <select
                  className={s.formSelect}
                  value={taxForm.roundingMethod}
                  onChange={(e) =>
                    setTaxForm((f) => ({
                      ...f,
                      roundingMethod: e.target.value,
                    }))
                  }
                >
                  <option value="floor">切り捨て</option>
                  <option value="ceil">切り上げ</option>
                  <option value="round">四捨五入</option>
                </select>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>表示方式</label>
                <select
                  className={s.formSelect}
                  value={taxForm.displayMode}
                  onChange={(e) =>
                    setTaxForm((f) => ({
                      ...f,
                      displayMode: e.target.value,
                    }))
                  }
                >
                  <option value="exclusive">税抜</option>
                  <option value="inclusive">税込</option>
                </select>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>適用開始日</label>
                <input
                  className={s.formInput}
                  type="date"
                  value={taxForm.effectiveFrom}
                  onChange={(e) =>
                    setTaxForm((f) => ({
                      ...f,
                      effectiveFrom: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className={s.formActions}>
              <button
                type="submit"
                className={s.btnPrimary}
                disabled={taxLoading}
              >
                {taxLoading ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User modal */}
      {showUserForm && (
        <div className={s.overlay} onClick={() => setShowUserForm(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={s.modalTitle}>
              {editingUser ? "ユーザーを編集" : "ユーザーを追加"}
            </h2>
            <form onSubmit={handleUserSubmit}>
              <div className={s.formGrid}>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>ユーザー名 *</label>
                  <input
                    className={s.formInput}
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm((f) => ({
                        ...f,
                        username: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>表示名 *</label>
                  <input
                    className={s.formInput}
                    value={userForm.displayName}
                    onChange={(e) =>
                      setUserForm((f) => ({
                        ...f,
                        displayName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>権限</label>
                  <select
                    className={s.formSelect}
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm((f) => ({ ...f, role: e.target.value }))
                    }
                  >
                    <option value="staff">スタッフ</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>
                {editingUser && (
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>状態</label>
                    <select
                      className={s.formSelect}
                      value={userForm.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setUserForm((f) => ({
                          ...f,
                          isActive: e.target.value === "true",
                        }))
                      }
                    >
                      <option value="true">有効</option>
                      <option value="false">無効</option>
                    </select>
                  </div>
                )}
                <div className={s.formGroupFull}>
                  <label className={s.formLabel}>
                    パスワード{editingUser ? "（変更する場合のみ）" : " *"}
                  </label>
                  <input
                    className={s.formInput}
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm((f) => ({
                        ...f,
                        password: e.target.value,
                      }))
                    }
                    required={!editingUser}
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className={s.formActions}>
                <button
                  type="submit"
                  className={s.btnPrimary}
                  disabled={userLoading}
                >
                  {userLoading ? "保存中..." : "保存"}
                </button>
                <button
                  type="button"
                  className={s.btnSecondary}
                  onClick={() => setShowUserForm(false)}
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
