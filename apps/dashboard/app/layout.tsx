import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cur8r Research",
  description: "Research and editorial workspace for Cur8r podcast channels.",
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
