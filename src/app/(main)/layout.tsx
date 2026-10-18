import { Sidebar } from "../_components/sidebar";
import styles from "../layout.module.css";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
