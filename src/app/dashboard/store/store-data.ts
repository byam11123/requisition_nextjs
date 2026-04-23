"use client";

import type {
  StoreItem,
  StoreLocation,
  StoreLocationType,
  StoreStockEntry,
} from "@/lib/store-management-store";

export type { StoreItem, StoreLocation, StoreLocationType, StoreStockEntry };

export function getStoreItemStatus(item: StoreItem) {
  if (!item.isActive) {
    return "INACTIVE" as const;
  }

  const totalQty = getStoreItemTotalQuantity(item);
  const hasLowStock = item.stockByLocation.some(
    (entry) => entry.minimumStock > 0 && entry.quantity <= entry.minimumStock,
  );

  if (hasLowStock) {
    return "LOW_STOCK" as const;
  }

  if (totalQty === 0) {
    return "OUT_OF_STOCK" as const;
  }

  return "ACTIVE" as const;
}

export function getStoreItemStatusClasses(status: ReturnType<typeof getStoreItemStatus>) {
  if (status === "LOW_STOCK") {
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }
  if (status === "OUT_OF_STOCK") {
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }
  if (status === "INACTIVE") {
    return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
  return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
}

export function getStoreItemTotalQuantity(item: StoreItem) {
  return item.stockByLocation.reduce(
    (sum, entry) => sum + Number(entry.quantity || 0),
    0,
  );
}

export function getStoreLocationLabel(
  key: string,
  locations: StoreLocation[],
) {
  return locations.find((location) => location.key === key)?.name || key;
}

export function formatStoreDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatStoreQuantity(value: number, unit: string) {
  return `${Number(value || 0)} ${unit || "Nos"}`;
}

export function getStoreItemQrImageUrl(qrValue: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrValue)}`;
}

export function getLocationTypeClasses(type: StoreLocationType) {
  if (type === "OFFICE") {
    return "bg-sky-500/10 text-sky-300 border-sky-500/20";
  }
  if (type === "SITE") {
    return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  }
  if (type === "WAREHOUSE") {
    return "bg-purple-500/10 text-purple-300 border-purple-500/20";
  }
  if (type === "YARD") {
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  }
  return "bg-slate-500/10 text-slate-300 border-slate-500/20";
}
