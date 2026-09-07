import type { Metadata } from "next";
import { Noto_Sans_HK } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n.server";

const notoHK = Noto_Sans_HK({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-hk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "兒童成長紀錄 · Kids Portfolio",
  description: "家庭專用嘅小朋友成長紀錄同作品集。",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  return (
    <html lang={locale} className={notoHK.variable}>
      <body className="font-sans antialiased" data-app={t.appName}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
