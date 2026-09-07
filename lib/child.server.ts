import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ACTIVE_CHILD_COOKIE, ALL_CHILDREN_VALUE, isChildId } from "@/lib/child";

export async function getActiveChildId(): Promise<string | null> {
  try {
    const store = await cookies();
    const raw = store.get(ACTIVE_CHILD_COOKIE)?.value;
    if (!raw || raw === ALL_CHILDREN_VALUE || !isChildId(raw)) return null;
    const exists = await prisma.child.findUnique({
      where: { id: raw },
      select: { id: true },
    });
    return exists?.id ?? null;
  } catch {
    return null;
  }
}

export async function setActiveChildCookie(childId: string | null) {
  const store = await cookies();
  if (!childId) {
    store.set(ACTIVE_CHILD_COOKIE, ALL_CHILDREN_VALUE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return;
  }
  store.set(ACTIVE_CHILD_COOKIE, childId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function childEventWhere(): Promise<{ childId?: string }> {
  const childId = await getActiveChildId();
  return childId ? { childId } : {};
}
