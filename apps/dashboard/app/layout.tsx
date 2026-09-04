import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RSRCH Pilot",
  description: "Local-first research operations dashboard powered by Codex.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
