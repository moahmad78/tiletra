import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "IntriHub Customer Desk — WhatsApp Live Support",
  description: "Official WhatsApp Customer Support & Service Desk for Intrihub",
  icons: {
    icon: "/logo/intri-icon.png",
    shortcut: "/logo/intri-icon.png",
    apple: "/logo/intri-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="flex h-full bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#f8fafc]">
          {children}
        </main>
      </body>
    </html>
  );
}
