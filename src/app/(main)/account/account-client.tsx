"use client";

import { useState } from "react";
import type { UserRole } from "@/domain/common/entities/user";
import s from "../../_components/shared.module.css";

interface AccountClientProps {
  username: string;
  displayName: string;
  role: UserRole;
}

const roleLabel: Record<UserRole, string> = {
  admin: "管理者",
  staff: "スタッフ",
};

export function AccountClient({
  username,
  displayName,
  role,
}: AccountClientProps) {
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);
  const [nameInput, setNameInput] = useState(displayName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    setNameSuccess("");

    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("表示名を入力してください");
      return;
    }
    if (trimmed === currentDisplayName) {
      setNameError("変更がありません");
      return;
    }

    setNameLoading(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error ?? "エラーが発生しました");
      } else {
        setCurrentDisplayName(trimmed);
        setNameSuccess("表示名を更新しました");
      }
    } catch {
      setNameError("通信エラーが発生しました");
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!currentPassword) {
      setPwError("現在のパスワードを入力してください");
      return;
    }
    if (!newPassword) {
      setPwError("新しいパスワードを入力してください");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("新しいパスワードは6文字以上で入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("新しいパスワードが一致しません");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error ?? "エラーが発生しました");
      } else {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPwSuccess("パスワードを変更しました");
      }
    } catch {
      setPwError("通信エラーが発生しました");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>アカウント設定</h1>
      </div>

      {/* Profile info */}
      <div className={s.formCard} style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          プロフィール
        </h2>
        <div className={s.formGrid}>
          <div className={s.formGroup}>
            <span className={s.formLabel}>ユーザー名</span>
            <span style={{ fontSize: "0.875rem" }}>{username}</span>
          </div>
          <div className={s.formGroup}>
            <span className={s.formLabel}>表示名</span>
            <span style={{ fontSize: "0.875rem" }}>{currentDisplayName}</span>
          </div>
          <div className={s.formGroup}>
            <span className={s.formLabel}>権限</span>
            <span>
              <span
                className={s.badge}
                style={{
                  background:
                    role === "admin"
                      ? "var(--color-primary-light)"
                      : "var(--color-neutral-light)",
                  color: role === "admin" ? "var(--color-primary)" : "var(--color-neutral)",
                }}
              >
                {roleLabel[role]}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Display name form */}
      <div className={s.formCard} style={{ marginBottom: "1.5rem" }}>
        <h2
          style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          表示名の変更
        </h2>
        {nameError && <div className={s.formError}>{nameError}</div>}
        {nameSuccess && <div className={s.formSuccess}>{nameSuccess}</div>}
        <form onSubmit={handleNameSubmit}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>表示名</label>
            <input
              className={s.formInput}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
            />
          </div>
          <div className={s.formActions}>
            <button
              type="submit"
              className={s.btnPrimary}
              disabled={nameLoading}
            >
              {nameLoading ? "更新中..." : "更新"}
            </button>
          </div>
        </form>
      </div>

      {/* Password change form */}
      <div className={s.formCard}>
        <h2
          style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}
        >
          パスワードの変更
        </h2>
        {pwError && <div className={s.formError}>{pwError}</div>}
        {pwSuccess && <div className={s.formSuccess}>{pwSuccess}</div>}
        <form onSubmit={handlePasswordSubmit}>
          <div className={s.formGroup} style={{ marginBottom: "1rem" }}>
            <label className={s.formLabel}>現在のパスワード</label>
            <input
              className={s.formInput}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className={s.formGroup} style={{ marginBottom: "1rem" }}>
            <label className={s.formLabel}>新しいパスワード</label>
            <input
              className={s.formInput}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>新しいパスワード（確認）</label>
            <input
              className={s.formInput}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className={s.formActions}>
            <button
              type="submit"
              className={s.btnPrimary}
              disabled={pwLoading}
            >
              {pwLoading ? "変更中..." : "パスワードを変更"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
