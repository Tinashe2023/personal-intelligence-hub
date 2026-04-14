import "./globals.css";

export const metadata = {
  title: "PIOS - Intelligent Dashboard",
  description:
    "Centralized dashboard aggregating system metrics, weather, news, emails, research, and analytics",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
