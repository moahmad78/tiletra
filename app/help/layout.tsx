import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Help Desk & Support | IntriHub",
  description: "IntriHub customer support desk for live order tracking, tickets, and grievance escalation.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

