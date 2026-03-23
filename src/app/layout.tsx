import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Agentic Enterprise",
  description: "AI-powered autonomous business management system",
};

/**
 * Root layout for the entire application.
 * Wraps all pages with HTML structure and global styles.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
