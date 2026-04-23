import fs from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";

type DevRole = "ADMIN" | "PURCHASER" | "MANAGER" | "ACCOUNTANT";

type DevOrganization = {
  id: string;
  name: string;
  requisitionPrefix: string;
  contactEmail: string;
  contactPhone: string | null;
  address: string | null;
  isActive: boolean;
};

type DevUser = {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: DevRole;
  designation: string | null;
  department: string | null;
  isActive: boolean;
  lastLogin: string | null;
};

const g = globalThis as typeof globalThis & {
  __devAuthOrganizations?: DevOrganization[];
  __devAuthUsers?: DevUser[];
  __devAuthOrgCounter?: number;
  __devAuthUserCounter?: number;
  __devAuthLoaded?: boolean;
};

const DEV_AUTH_STORE_PATH = path.join(
  process.cwd(),
  ".local",
  "dev-auth-store.json",
);

type PersistedDevAuthState = {
  organizations: DevOrganization[];
  users: DevUser[];
  orgCounter: number;
  userCounter: number;
};

function loadState() {
  if (g.__devAuthLoaded) {
    return;
  }

  g.__devAuthLoaded = true;

  try {
    if (!fs.existsSync(DEV_AUTH_STORE_PATH)) {
      return;
    }

    const raw = fs.readFileSync(DEV_AUTH_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<PersistedDevAuthState>;

    g.__devAuthOrganizations = Array.isArray(parsed.organizations)
      ? parsed.organizations
      : [];
    g.__devAuthUsers = Array.isArray(parsed.users) ? parsed.users : [];
    g.__devAuthOrgCounter = Number.isFinite(parsed.orgCounter)
      ? Number(parsed.orgCounter)
      : 0;
    g.__devAuthUserCounter = Number.isFinite(parsed.userCounter)
      ? Number(parsed.userCounter)
      : 0;
  } catch {
    g.__devAuthOrganizations = [];
    g.__devAuthUsers = [];
    g.__devAuthOrgCounter = 0;
    g.__devAuthUserCounter = 0;
  }
}

function persistState() {
  fs.mkdirSync(path.dirname(DEV_AUTH_STORE_PATH), { recursive: true });

  const payload: PersistedDevAuthState = {
    organizations: g.__devAuthOrganizations || [],
    users: g.__devAuthUsers || [],
    orgCounter: g.__devAuthOrgCounter || 0,
    userCounter: g.__devAuthUserCounter || 0,
  };

  fs.writeFileSync(DEV_AUTH_STORE_PATH, JSON.stringify(payload, null, 2), "utf8");
}

function getOrganizations() {
  loadState();

  if (!g.__devAuthOrganizations) {
    g.__devAuthOrganizations = [];
  }

  return g.__devAuthOrganizations;
}

function getUsers() {
  loadState();

  if (!g.__devAuthUsers) {
    g.__devAuthUsers = [];
  }

  return g.__devAuthUsers;
}

function nextOrganizationId() {
  g.__devAuthOrgCounter = (g.__devAuthOrgCounter || 0) + 1;
  return String(20000 + g.__devAuthOrgCounter);
}

function nextUserId() {
  g.__devAuthUserCounter = (g.__devAuthUserCounter || 0) + 1;
  return String(30000 + g.__devAuthUserCounter);
}

function buildOrganizationPrefix(name: string) {
  const prefix = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 4);

  return prefix || "REQ";
}

export function findDevUserByEmail(email: string) {
  return getUsers().find((user) => user.email === email.trim().toLowerCase()) || null;
}

export function findDevUserById(id: string) {
  return getUsers().find((user) => user.id === id) || null;
}

export function findDevOrganizationById(id: string) {
  return getOrganizations().find((organization) => organization.id === id) || null;
}

export function getDevUsersForOrganization(organizationId: string) {
  return getUsers().filter((user) => user.organizationId === organizationId);
}

export async function verifyDevUserPassword(userId: string, password: string) {
  const user = findDevUserById(userId);
  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}

export function updateDevUserLastLogin(userId: string) {
  const user = findDevUserById(userId);
  if (user) {
    user.lastLogin = new Date().toISOString();
    persistState();
  }
}

export async function createDevSignupAccount(input: {
  organizationName: string;
  fullName: string;
  email: string;
  password: string;
  contactPhone?: string;
  address?: string;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (findDevUserByEmail(normalizedEmail)) {
    throw new Error("An account with this email already exists");
  }

  const organization: DevOrganization = {
    id: nextOrganizationId(),
    name: input.organizationName.trim(),
    requisitionPrefix: buildOrganizationPrefix(input.organizationName),
    contactEmail: normalizedEmail,
    contactPhone: input.contactPhone?.trim() || null,
    address: input.address?.trim() || null,
    isActive: true,
  };

  const user: DevUser = {
    id: nextUserId(),
    organizationId: organization.id,
    email: normalizedEmail,
    fullName: input.fullName.trim(),
    passwordHash: await bcrypt.hash(input.password, 10),
    role: "ADMIN",
    designation: "Administrator",
    department: "Administration",
    isActive: true,
    lastLogin: new Date().toISOString(),
  };

  getOrganizations().push(organization);
  getUsers().push(user);
  persistState();

  return { organization, user };
}
