"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "ログインに失敗しました");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit} className={styles.card}>
        <h1 className={styles.title}>ログイン</h1>
        <p className={styles.subtitle}>社内管理システム</p>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label}>
          ユーザー名
          <input
            name="username"
            type="text"
            required
            autoFocus
            className={styles.input}
            placeholder="username"
          />
        </label>

        <label className={styles.label}>
          パスワード
          <input
            name="password"
            type="password"
            required
            className={styles.input}
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
