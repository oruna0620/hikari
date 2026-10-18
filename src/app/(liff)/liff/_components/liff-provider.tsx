"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type LiffState = {
  isReady: boolean;
  isLoggedIn: boolean;
  error: string | null;
  accessToken: string | null;
  userId: string | null;
  displayName: string | null;
};

const GUEST_STATE: LiffState = {
  isReady: true,
  isLoggedIn: true,
  error: null,
  accessToken: null,
  userId: null,
  displayName: "ゲスト",
};

const LiffContext = createContext<LiffState>({
  isReady: false,
  isLoggedIn: false,
  error: null,
  accessToken: null,
  userId: null,
  displayName: null,
});

export function useLiff() {
  return useContext(LiffContext);
}

export function LiffProvider({
  liffId,
  children,
}: {
  liffId: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<LiffState>({
    isReady: false,
    isLoggedIn: false,
    error: null,
    accessToken: null,
    userId: null,
    displayName: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const liffModule = await Promise.race([
          import("@line/liff"),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 5000)
          ),
        ]);
        const liff = liffModule.default;

        await Promise.race([
          liff.init({ liffId }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("init timeout")), 5000)
          ),
        ]);

        if (cancelled) return;

        if (!liff.isLoggedIn()) {
          setState(GUEST_STATE);
          return;
        }

        const accessToken = liff.getAccessToken();
        let displayName = "ゲスト";
        try {
          const profile = await liff.getProfile();
          displayName = profile.displayName;
        } catch {
          // ignore
        }

        try {
          const res = await fetch("/api/line/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken }),
          });

          if (!res.ok) {
            if (!cancelled) setState({ ...GUEST_STATE, displayName });
            return;
          }

          const data = await res.json();
          if (!cancelled) {
            setState({
              isReady: true,
              isLoggedIn: true,
              error: null,
              accessToken,
              userId: data.userId,
              displayName: data.displayName ?? displayName,
            });
          }
        } catch {
          if (!cancelled) setState({ ...GUEST_STATE, displayName });
        }
      } catch {
        if (!cancelled) setState(GUEST_STATE);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [liffId]);

  return <LiffContext.Provider value={state}>{children}</LiffContext.Provider>;
}
