import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart | Intrihub",
  description: "View and manage items in your Intrihub shopping cart.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
