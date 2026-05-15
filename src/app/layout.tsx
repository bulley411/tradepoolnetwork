import "./globals.css";
import type { Metadata } from "next";

import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "TradePoolNetwork",
  description: "TradePoolNetwork Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}
         <Toaster richColors />
      </body>
    </html>
  );
}