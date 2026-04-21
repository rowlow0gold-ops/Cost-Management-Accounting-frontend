import "./globals.css";
import Shell from "@/components/Shell";
import ToastHost from "@/components/Toast";

export const metadata = {
  title: "원가/관리회계",
  description: "Cost & Management Accounting Platform",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Shell>{children}</Shell>
        <ToastHost />
      </body>
    </html>
  );
}
