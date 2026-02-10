import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextWave Solutions - Feedback Platform",
  description: "Client email feedback platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
