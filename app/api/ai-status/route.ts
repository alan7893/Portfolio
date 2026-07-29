import { NextResponse } from "next/server";
import { isGeminiConfigured } from "@/lib/gemini";

export async function GET() {
  return NextResponse.json({
    geminiConfigured: isGeminiConfigured(),
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    photoAnalysis: isGeminiConfigured() ? "gemini" : "local-fallback",
    reportWriting: isGeminiConfigured() ? "gemini" : "local-fallback",
    tokenSafeMode: {
      maxPhotosPerReport: 12,
      maxRecordsPerReport: 20,
      targetPages: "4-8",
    },
  });
}
