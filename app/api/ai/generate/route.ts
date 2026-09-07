import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Phase 2 will implement AI portfolio / testimonial / memory-file generation
 * from a child's events, media and tags. For Phase 1 this is an intentional
 * stub so the client contract exists without any generation logic.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      error: "Not Implemented",
      message:
        "AI generation (portfolio / testimonial / memory file) arrives in Phase 2.",
      phase: 2,
    },
    { status: 501 },
  );
}
