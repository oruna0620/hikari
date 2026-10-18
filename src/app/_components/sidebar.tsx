"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import styles from "./sidebar.module.css";

type NavLink = { href: string; label: string; icon: SvgIconComponent };
type NavSection = { section: string };
type NavItem = NavLink | NavSection;

const navItems: NavItem[] = [
  { href: "/", label: "ホーム", icon: DashboardRoundedIcon },
  { section: "共通マスタ" },
  { href: "/products", label: "品目一覧", icon: Inventory2RoundedIcon },
  { href: "/customers", label: "顧客一覧", icon: PeopleRoundedIcon },
  { section: "業務" },
  { href: "/estimates", label: "見積もり管理", icon: DescriptionRoundedIcon },
  { href: "/cashflow", label: "入出金管理", icon: AccountBalanceRoundedIcon },
  { href: "/inventory", label: "在庫管理", icon: WarehouseRoundedIcon },
];

const bottomItems: NavLink[] = [
  { href: "/admin", label: "管理者ページへ", icon: AdminPanelSettingsRoundedIcon },
  { href: "/account", label: "アカウント", icon: AccountCircleRoundedIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const renderLink = (item: NavLink) => {
    const Icon = item.icon;
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={isActive ? styles.linkActive : styles.link}
        title={collapsed ? item.label : undefined}
      >
        <span className={styles.icon}>
          <Icon fontSize="small" />
        </span>
        <span className={collapsed ? styles.labelHidden : styles.label}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <aside className={collapsed ? styles.sidebarCollapsed : styles.sidebar}>
      <div className={styles.header}>
        <span className={collapsed ? styles.logoHidden : styles.logo}>
          <span className={styles.logoText} aria-hidden="true">
            BUTIKOMI
          </span>
          <img
            src="/images/butikomi-logo.png"
            alt="BUTIKOMI"
            className={styles.logoImage}
          />
        </span>
        <button
          className={styles.toggle}
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "メニューを開く" : "メニューを閉じる"}
        >
          {collapsed ? (
            <MenuRoundedIcon fontSize="small" />
          ) : (
            <ChevronLeftRoundedIcon fontSize="small" />
          )}
        </button>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item, i) => {
          if ("section" in item) {
            return (
              <div
                key={i}
                className={
                  collapsed ? styles.sectionCollapsed : styles.section
                }
              >
                {item.section}
              </div>
            );
          }
          return renderLink(item);
        })}
      </nav>

      <div className={styles.footer}>
        {bottomItems.map(renderLink)}
        <button
          onClick={handleLogout}
          className={styles.link}
          title={collapsed ? "ログアウト" : undefined}
        >
          <span className={styles.icon}>
            <LogoutRoundedIcon fontSize="small" />
          </span>
          <span className={collapsed ? styles.labelHidden : styles.label}>
            ログアウト
          </span>
        </button>
      </div>
    </aside>
  );
}
