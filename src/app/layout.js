import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { DiaryProvider } from "@/context/DiaryContext";

export const metadata = {
  title: "AI 일기장 - 당신의 하루를 분석합니다",
  description: "AI 기반 일기 분석 및 회고 서비스. 매일의 기록을 통해 더 나은 내일을 만들어보세요.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <DiaryProvider>
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </DiaryProvider>
      </body>
    </html>
  );
}
