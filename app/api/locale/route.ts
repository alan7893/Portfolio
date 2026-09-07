import { NextResponse } from "next/server";
import { LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";

export async function POST(request: Request) {
  const { locale } = (await request.json().catch(() => ({}))) as {
    locale?: string;
  };
  const value = normalizeLocale(locale);
  const res = NextResponse.json({ locale: value });
  res.cookies.set(LOCALE_COOKIE, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}
