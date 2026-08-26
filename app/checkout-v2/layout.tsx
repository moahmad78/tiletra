import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout | Intrihub",
  description: "Complete your interior and construction supply order securely.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
