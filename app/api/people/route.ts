import { NextResponse } from "next/server";
import { createPerson, deletePerson, readStore, setActivePerson } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; role?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const person = await createPerson(body.name, body.role);
  const store = await readStore();
  return NextResponse.json({ person, store }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { activePersonId?: string };
  if (!body.activePersonId) {
    return NextResponse.json({ error: "activePersonId is required" }, { status: 400 });
  }
  try {
    const store = await setActivePerson(body.activePersonId);
    return NextResponse.json(store);
  } catch {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const store = await deletePerson(id);
  return NextResponse.json(store);
}
