import { NextResponse } from "next/server";
import { addRecord, deleteRecord, readStore } from "@/lib/store";
import type { TrackRecord } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const store = await readStore();
  return NextResponse.json(store.records.filter((r) => r.personId === id));
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as Partial<TrackRecord>;

  if (!body.title?.trim() || !body.date || !body.category) {
    return NextResponse.json(
      { error: "title, date, and category are required" },
      { status: 400 },
    );
  }

  try {
    const record = await addRecord(id, {
      title: body.title.trim(),
      date: body.date,
      category: body.category,
      notes: body.notes?.trim() || "",
      highlight: body.highlight ?? 3,
    });
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  await params;
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get("recordId");
  if (!recordId) {
    return NextResponse.json({ error: "recordId is required" }, { status: 400 });
  }
  await deleteRecord(recordId);
  return NextResponse.json({ ok: true });
}
