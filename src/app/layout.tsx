import type { Metadata } from "next";
import { Geist, Cairo } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./convexClientProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Cairo provides excellent readability for both Latin and Arabic scripts
const cairo = Cairo({ subsets: ["latin", "arabic"] });

export const metadata: Metadata = {
  title: "تجربة الإدراك السمعي للغة العربية",
  description: "منصة لاختبار وتقييم الإدراك السمعي للأصوات العربية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="ar" dir="rtl">
        <body className={`${cairo.className} bg-gray-50 text-gray-900 min-h-screen`}>
          {/* ConvexClientProvider connects the app to your real-time database */}
          <ConvexClientProvider>
            {children}
          </ConvexClientProvider>
        </body>
      </html>
  );
}
