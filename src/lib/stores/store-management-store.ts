import fs from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";

export type StoreItemType = "ASSET" | "STOCK";
export type StoreLocationType = "OFFICE" | "SITE" | "WAREHOUSE" | "YARD" | "OTHER";

export type StoreLocation = {
  id: string;
  key: string;
  name: string;
  code: string;
  type: StoreLocationType;
  address: string;
  contactPerson: string;
  isActive: boolean;
  createdAt: string;
};

export type StoreStockEntry = {
  locationKey: string;
  quantity: number;
  minimumStock: number;
};

export type StoreItem = {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  subcategory: string;
  itemType: StoreItemType;
  unit: string;
  brand: string;
  model: string;
  serialNumber: string;
  description: string;
  imageUrl: string | null;
  qrValue: string;
  isActive: boolean;
  createdAt: string;
  stockByLocation: StoreStockEntry[];
};

type StoreOrganizationState = {
  items: StoreItem[];
  locations: StoreLocation[];
  itemCounter: number;
  locationCounter: number;
};

const STORE_PATH = path.join(process.cwd(), ".local", "store-management-store.json");

function buildDefaultState(): StoreOrganizationState {
  return {
    items: [],
    locations: [],
    itemCounter: 0,
    locationCounter: 0,
  };
}

function createDemoSeedState(): StoreOrganizationState {
  const now = new Date().toISOString();
  const locations: StoreLocation[] = [
    {
      id: "LOC-1",
      key: "RAIPUR_HO",
      name: "Raipur Head Office",
      code: "RHO",
      type: "OFFICE",
      address: "Raipur HO, Main Admin Block",
      contactPerson: "Admin Desk",
      isActive: true,
      createdAt: now,
    },
    {
      id: "LOC-2",
      key: "BILASPUR_YARD",
      name: "Bilaspur Yard",
      code: "BYP",
      type: "YARD",
      address: "Bilaspur Dispatch Yard",
      contactPerson: "Yard Supervisor",
      isActive: true,
      createdAt: now,
    },
    {
      id: "LOC-3",
      key: "KORBA_SITE",
      name: "Korba Mine Site",
      code: "KMS",
      type: "SITE",
      address: "Korba Active Mine Site",
      contactPerson: "Site Incharge",
      isActive: true,
      createdAt: now,
    },
  ];

  const items: StoreItem[] = [
    {
      id: "ITEM-1",
      itemCode: "AST-0001",
      name: "Lenovo ThinkPad Dispatch Laptop",
      category: "Devices",
      subcategory: "Laptop",
      itemType: "ASSET",
      unit: "Nos",
      brand: "Lenovo",
      model: "ThinkPad E14",
      serialNumber: "LP-RHO-2401",
      description: "Primary dispatch desk laptop used for route planning and tracking.",
      imageUrl: null,
      qrValue: "/dashboard/store/items/ITEM-1",
      isActive: true,
      createdAt: now,
      stockByLocation: [
        { locationKey: "RAIPUR_HO", quantity: 1, minimumStock: 0 },
      ],
    },
    {
      id: "ITEM-2",
      itemCode: "STK-0002",
      name: "Safety Helmets",
      category: "Safety",
      subcategory: "PPE",
      itemType: "STOCK",
      unit: "Nos",
      brand: "SafeWorks",
      model: "",
      serialNumber: "",
      description: "Standard safety helmets issued for yard and site visits.",
      imageUrl: null,
      qrValue: "/dashboard/store/items/ITEM-2",
      isActive: true,
      createdAt: now,
      stockByLocation: [
        { locationKey: "RAIPUR_HO", quantity: 12, minimumStock: 6 },
        { locationKey: "KORBA_SITE", quantity: 18, minimumStock: 10 },
      ],
    },
    {
      id: "ITEM-3",
      itemCode: "STK-0003",
      name: "Diesel Transfer Drum",
      category: "Fuel Support",
      subcategory: "Containers",
      itemType: "ASSET",
      unit: "Nos",
      brand: "HPCL",
      model: "200L Drum",
      serialNumber: "DRM-BYP-99",
      description: "Transfer drum used for temporary diesel handling at the yard.",
      imageUrl: null,
      qrValue: "/dashboard/store/items/ITEM-3",
      isActive: true,
      createdAt: now,
      stockByLocation: [
        { locationKey: "BILASPUR_YARD", quantity: 1, minimumStock: 0 },
      ],
    },
  ];

  return {
    items,
    locations,
    itemCounter: items.length,
    locationCounter: locations.length,
  };
}

async function getOrganizationState(organizationId: string): Promise<StoreOrganizationState> {
  if (organizationId === "demo") {
    return createDemoSeedState();
  }

  try {
    const dbConfig = await prisma.storeManagementConfig.findUnique({
      where: { organizationId: BigInt(organizationId) },
    });

    if (dbConfig?.payload) {
      return JSON.parse(dbConfig.payload);
    }
  } catch (error) {
    console.error("Error fetching store state from DB:", error);
  }

  return buildDefaultState();
}

async function saveOrganizationState(organizationId: string, state: StoreOrganizationState) {
  if (organizationId === "demo") {
    return;
  }

  try {
    await prisma.storeManagementConfig.upsert({
      where: { organizationId: BigInt(organizationId) },
      update: { payload: JSON.stringify(state) },
      create: {
        organizationId: BigInt(organizationId),
        payload: JSON.stringify(state),
      },
    });
  } catch (error) {
    console.error("Error saving store state to DB:", error);
  }
}

function normalizeStoreItem(item: StoreItem): StoreItem {
  return {
    ...item,
    stockByLocation: Array.isArray(item.stockByLocation)
      ? item.stockByLocation.map((entry) => ({
          locationKey: String(entry.locationKey || ""),
          quantity: Number(entry.quantity || 0),
          minimumStock: Number(entry.minimumStock || 0),
        }))
      : [],
  };
}

export async function listStoreLocations(organizationId: string) {
  const state = await getOrganizationState(organizationId);
  return [...state.locations];
}

export async function createStoreLocation(
  organizationId: string,
  input: Omit<StoreLocation, "id" | "key" | "createdAt">,
) {
  const orgState = await getOrganizationState(organizationId);
  orgState.locationCounter += 1;
  const created: StoreLocation = {
    id: `LOC-${orgState.locationCounter}`,
    key: `${input.code.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_") || `LOC_${orgState.locationCounter}`}`,
    name: input.name.trim(),
    code: input.code.trim().toUpperCase(),
    type: input.type,
    address: input.address.trim(),
    contactPerson: input.contactPerson.trim(),
    isActive: input.isActive,
    createdAt: new Date().toISOString(),
  };

  orgState.locations.unshift(created);
  await saveOrganizationState(organizationId, orgState);
  return created;
}

export async function listStoreItems(organizationId: string) {
  const state = await getOrganizationState(organizationId);
  return state.items.map(normalizeStoreItem);
}

export async function getStoreItem(organizationId: string, itemId: string) {
  const state = await getOrganizationState(organizationId);
  const item = state.items.find((entry) => entry.id === itemId);
  return item ? normalizeStoreItem(item) : null;
}

export async function createStoreItem(
  organizationId: string,
  input: Omit<StoreItem, "id" | "itemCode" | "qrValue" | "createdAt" | "imageUrl"> & {
    initialLocationKey?: string;
    initialQuantity?: number;
    minimumStock?: number;
  },
) {
  const orgState = await getOrganizationState(organizationId);
  orgState.itemCounter += 1;
  const id = `ITEM-${orgState.itemCounter}`;
  const itemCode = `${input.itemType === "ASSET" ? "AST" : "STK"}-${String(orgState.itemCounter).padStart(4, "0")}`;

  const stockByLocation: StoreStockEntry[] = [];
  if (input.initialLocationKey && Number(input.initialQuantity || 0) > 0) {
    stockByLocation.push({
      locationKey: input.initialLocationKey,
      quantity: Number(input.initialQuantity || 0),
      minimumStock: Number(input.minimumStock || 0),
    });
  }

  const created: StoreItem = {
    id,
    itemCode,
    name: input.name.trim(),
    category: input.category.trim(),
    subcategory: input.subcategory.trim(),
    itemType: input.itemType,
    unit: input.unit.trim(),
    brand: input.brand.trim(),
    model: input.model.trim(),
    serialNumber: input.serialNumber.trim(),
    description: input.description.trim(),
    imageUrl: null,
    qrValue: `/dashboard/store/items/${id}`,
    isActive: input.isActive,
    createdAt: new Date().toISOString(),
    stockByLocation,
  };

  orgState.items.unshift(created);
  await saveOrganizationState(organizationId, orgState);
  return created;
}

export async function updateStoreItemImage(
  organizationId: string,
  itemId: string,
  imageUrl: string,
) {
  const orgState = await getOrganizationState(organizationId);
  const index = orgState.items.findIndex((entry) => entry.id === itemId);
  if (index === -1) {
    return null;
  }

  orgState.items[index] = {
    ...orgState.items[index],
    imageUrl,
  };
  await saveOrganizationState(organizationId, orgState);
  return normalizeStoreItem(orgState.items[index]);
}

export async function deleteStoreLocation(organizationId: string, locationKey: string) {
  const orgState = await getOrganizationState(organizationId);
  const index = orgState.locations.findIndex((entry) => entry.key === locationKey);
  if (index === -1) {
    return false;
  }

  orgState.locations.splice(index, 1);
  await saveOrganizationState(organizationId, orgState);
  return true;
}
