import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "KYA Staff — Operations",
  description: "KYA Digital Services — Internal Operations Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-slate-950 text-white antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}