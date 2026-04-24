import fs from "node:fs";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CONTACT_ENTITY_TYPE = "CONTACT_MANAGER";
const CONTACT_STORE_PATH = path.join(process.cwd(), ".local", "contacts.json");

export type ContactDefinition = {
  id: string;
  name: string;
  role: string;
  department: string;
  phones: string[];
  notes?: string;
};

type ContactStoreFile = Record<string, ContactDefinition[]>;

export function normalizeContactDefinition(value: unknown): ContactDefinition | null {
  if (!value || typeof value !== "object") return null;

  const source = value as Record<string, unknown>;
  const id = typeof source.id === "string" ? source.id.trim() : "";
  const name = typeof source.name === "string" ? source.name.trim() : "";
  
  if (!id || !name) return null;

  const phones = Array.isArray(source.phones) 
    ? source.phones.filter(p => typeof p === "string" && p.trim() !== "")
    : [];

  return {
    id,
    name,
    role: typeof source.role === "string" ? source.role.trim() : "",
    department: typeof source.department === "string" ? source.department.trim() : "",
    phones,
    notes: typeof source.notes === "string" ? source.notes.trim() : "",
  };
}

export function normalizeContactDefinitions(value: unknown): ContactDefinition[] | null {
  if (!Array.isArray(value)) return null;

  const normalized = value.map(normalizeContactDefinition);
  if (normalized.some((entry) => !entry)) return null;

  const unique = new Map<string, ContactDefinition>();
  for (const contact of normalized) {
    if (!contact || unique.has(contact.id)) return null;
    unique.set(contact.id, contact);
  }

  return [...unique.values()];
}

function readContactFileStore(): ContactStoreFile {
  try {
    if (process.env.VERCEL || !fs.existsSync(CONTACT_STORE_PATH)) return {};
    const raw = fs.readFileSync(CONTACT_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const normalizedEntries = Object.entries(parsed).flatMap(([key, value]) => {
      const contacts = normalizeContactDefinitions(value);
      return contacts ? [[key, contacts] as const] : [];
    });
    return Object.fromEntries(normalizedEntries) as ContactStoreFile;
  } catch {
    return {};
  }
}

function writeContactFileStore(store: ContactStoreFile) {
  if (process.env.VERCEL) return;
  fs.mkdirSync(path.dirname(CONTACT_STORE_PATH), { recursive: true });
  fs.writeFileSync(CONTACT_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function toOrganizationKey(organizationId: bigint | string) {
  return typeof organizationId === "bigint" ? organizationId.toString() : organizationId;
}

export async function getContactsForOrganization(organizationId: bigint | string) {
  const orgKey = toOrganizationKey(organizationId);
  const fileStore = readContactFileStore();
  const fileContacts = fileStore[orgKey];

  if (typeof organizationId === "string") return fileContacts || [];

  try {
    const dbConfig = await prisma.contactConfig.findUnique({
      where: { organizationId },
    });

    const dbContacts = dbConfig?.payload
      ? normalizeContactDefinitions(JSON.parse(dbConfig.payload))
      : null;

    return dbContacts || fileContacts || [];
  } catch (error) {
    console.error("Error fetching contacts from DB:", error);
    return fileContacts || [];
  }
}

export async function saveContactsForOrganization(
  organizationId: bigint | string,
  contacts: ContactDefinition[],
) {
  const normalized = normalizeContactDefinitions(contacts);
  if (!normalized) throw new Error("Invalid contact payload");

  const orgKey = toOrganizationKey(organizationId);
  const fileStore = readContactFileStore();
  fileStore[orgKey] = normalized;
  writeContactFileStore(fileStore);

  if (typeof organizationId === "bigint") {
    try {
      await prisma.contactConfig.upsert({
        where: { organizationId },
        update: {
          payload: JSON.stringify(normalized),
        },
        create: {
          organizationId,
          payload: JSON.stringify(normalized),
        },
      });
    } catch (error) {
      console.error("Error saving contacts to DB:", error);
      // File fallback already covers offline mode.
    }
  }

  return normalized;
}
