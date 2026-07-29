import { promises as fs } from "fs";
import path from "path";
import type { AppStore, Person, PhotoMemory, PortfolioReport, TrackRecord } from "./types";

const DATA_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const PUBLIC_UPLOADS_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");

const PERSON_COLORS = ["#3D9B8F", "#E8B86D", "#5B7C99", "#C46B5B", "#7A6BB0", "#4F8F6A"];

const emptyStore = (): AppStore => ({
  activePersonId: null,
  people: [],
  photos: [],
  records: [],
  reports: {},
});

async function ensureDataDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(PUBLIC_UPLOADS_DIR, { recursive: true });
}

export { PUBLIC_UPLOADS_DIR };

export async function readStore(): Promise<AppStore> {
  await ensureDataDirs();
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return { ...emptyStore(), ...JSON.parse(raw) } as AppStore;
  } catch {
    const store = emptyStore();
    await writeStore(store);
    return store;
  }
}

export async function writeStore(store: AppStore): Promise<void> {
  await ensureDataDirs();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function nextPersonColor(people: Person[]): string {
  return PERSON_COLORS[people.length % PERSON_COLORS.length];
}

export async function createPerson(name: string, role?: string): Promise<Person> {
  const store = await readStore();
  const person: Person = {
    id: crypto.randomUUID(),
    name: name.trim(),
    role: role?.trim() || undefined,
    color: nextPersonColor(store.people),
    createdAt: new Date().toISOString(),
  };
  store.people.push(person);
  store.activePersonId = person.id;
  await writeStore(store);
  return person;
}

export async function setActivePerson(personId: string): Promise<AppStore> {
  const store = await readStore();
  if (!store.people.some((p) => p.id === personId)) {
    throw new Error("Person not found");
  }
  store.activePersonId = personId;
  await writeStore(store);
  return store;
}

export async function deletePerson(personId: string): Promise<AppStore> {
  const store = await readStore();
  store.people = store.people.filter((p) => p.id !== personId);
  store.photos = store.photos.filter((p) => p.personId !== personId);
  store.records = store.records.filter((r) => r.personId !== personId);
  delete store.reports[personId];
  if (store.activePersonId === personId) {
    store.activePersonId = store.people[0]?.id ?? null;
  }
  await writeStore(store);
  return store;
}

export async function addPhoto(photo: PhotoMemory): Promise<PhotoMemory> {
  const store = await readStore();
  store.photos.unshift(photo);
  await writeStore(store);
  return photo;
}

export async function addRecord(
  personId: string,
  input: Omit<TrackRecord, "id" | "personId" | "createdAt">,
): Promise<TrackRecord> {
  const store = await readStore();
  if (!store.people.some((p) => p.id === personId)) {
    throw new Error("Person not found");
  }
  const record: TrackRecord = {
    id: crypto.randomUUID(),
    personId,
    createdAt: new Date().toISOString(),
    ...input,
    highlight: Math.min(5, Math.max(1, Number(input.highlight) || 3)),
  };
  store.records.unshift(record);
  await writeStore(store);
  return record;
}

export async function deleteRecord(recordId: string): Promise<void> {
  const store = await readStore();
  store.records = store.records.filter((r) => r.id !== recordId);
  await writeStore(store);
}

export async function saveReport(report: PortfolioReport): Promise<PortfolioReport> {
  const store = await readStore();
  store.reports[report.personId] = report;
  await writeStore(store);
  return report;
}

export function getPersonBundle(store: AppStore, personId: string) {
  const person = store.people.find((p) => p.id === personId);
  if (!person) return null;
  return {
    person,
    photos: store.photos.filter((p) => p.personId === personId),
    records: store.records.filter((r) => r.personId === personId),
    report: store.reports[personId] ?? null,
  };
}
