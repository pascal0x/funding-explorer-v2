import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Funding Explorer V2",
  description: "Explorer, compare, spread, and hedge funding fees across perp venues.",
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
