import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Direct Upload Portal",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
