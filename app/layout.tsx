import "./globals.css";
import { Viewport } from 'next';

export const metadata = {
  title: "RezApp - Randevu Sistemi",
  description: "Modern randevu yönetim sistemi",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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