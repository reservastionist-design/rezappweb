import "./globals.css";

export const metadata = {
  title: "RezApp - Randevu Sistemi",
  description: "Modern randevu yönetim sistemi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        {children}
      </body>
    </html>
  );
}