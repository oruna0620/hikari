export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages (login) don't show sidebar
  return <>{children}</>;
}
