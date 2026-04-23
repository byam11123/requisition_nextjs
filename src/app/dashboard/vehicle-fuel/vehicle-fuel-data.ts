"use client";

export type VehicleFuelStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export type VehicleFuelType = "PETROL" | "DIESEL";

export type VehicleFuelRecord = {
  id: string;
  requestId: string;
  status: VehicleFuelStatus;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  entryTimestamp: string;
  requestedByName: string;
  fuelType: VehicleFuelType;
  vehicleType: string;
  rcNo: string;
  lastPurchaseDate: string;
  lastIssuedQtyLitres: number;
  lastReading: number;
  currentReading: number;
  totalRunning: number;
  currentRequirementLitres: number;
  lastReadingPhotoUrl: string | null;
  billPhotoUrl: string | null;
  billAmount: number;
  fuelPumpName: string;
  approvedAt: string | null;
  approvedByName: string | null;
  billUploadedAt: string | null;
};

export function formatVehicleFuelDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatVehicleFuelShortDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatFuelQuantity(value: number) {
  return `${Number(value || 0).toFixed(2).replace(/\.00$/, "")} Ltr`;
}

export function formatFuelDistance(value: number) {
  return `${Math.max(0, Number(value || 0))} KM/Hrs`;
}

export function formatFuelCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function getVehicleFuelStatusClasses(status: VehicleFuelStatus) {
  if (status === "COMPLETED") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
  if (status === "APPROVED") {
    return "bg-sky-500/10 text-sky-400 border-sky-500/20";
  }
  if (status === "REJECTED") {
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }
  return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}

export function getVehicleFuelStatusTone(status: VehicleFuelStatus) {
  if (status === "COMPLETED") {
    return "emerald" as const;
  }
  if (status === "APPROVED") {
    return "sky" as const;
  }
  if (status === "REJECTED") {
    return "rose" as const;
  }
  return "amber" as const;
}

export function getVehicleFuelBillStatus(record: VehicleFuelRecord) {
  return record.billPhotoUrl ? "UPLOADED" : "PENDING";
}

export function calculateTotalRunning(lastReading: number, currentReading: number) {
  return Math.max(0, Number(currentReading || 0) - Number(lastReading || 0));
}
