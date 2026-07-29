import { NextResponse } from "next/server";
import { getPersonBundle, readStore, saveReport } from "@/lib/store";
import { generateReport } from "@/lib/report";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const store = await readStore();
  const bundle = getPersonBundle(store, id);
  if (!bundle) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }
  return NextResponse.json(bundle.report);
}

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const store = await readStore();
  const bundle = getPersonBundle(store, id);
  if (!bundle) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }

  const report = generateReport(bundle.person, bundle.photos, bundle.records);
  await saveReport(report);
  return NextResponse.json(report, { status: 201 });
}
