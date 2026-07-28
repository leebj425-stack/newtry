import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SETEUK STUDIO · 세특 초안 워크벤치",
  description: "학생 활동의 과정을 세특 문장으로 기록하는 AI 워크스페이스.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className="antialiased">{children}</body></html>;
}
