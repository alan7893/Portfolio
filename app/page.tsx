import { readStore } from "@/lib/store";
import { MemoryApp } from "@/components/MemoryApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialStore = await readStore();
  return <MemoryApp initialStore={initialStore} />;
}
