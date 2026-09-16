import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Risk Intelligence",
  description: "Risk-based case prioritization and scoring dashboard"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
