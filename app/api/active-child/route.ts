import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALL_CHILDREN_VALUE, isChildId } from "@/lib/child";
import { setActiveChildCookie } from "@/lib/child.server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    childId?: string | null;
  };
  const raw = body.childId;

  if (!raw || raw === ALL_CHILDREN_VALUE) {
    await setActiveChildCookie(null);
    return NextResponse.json({ childId: null });
  }

  if (!isChildId(raw)) {
    return NextResponse.json({ error: "Invalid child id" }, { status: 400 });
  }

  const child = await prisma.child.findUnique({
    where: { id: raw },
    select: { id: true },
  });
  if (!child) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await setActiveChildCookie(child.id);
  return NextResponse.json({ childId: child.id });
}
