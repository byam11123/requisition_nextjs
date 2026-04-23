"use client";

export type AttendanceStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DriverAttendanceRecord = {
  id: string;
  requestId: string;
  status: AttendanceStatus;
  timestamp: string;
  adminName: string;
  driverName: string;
  fromSiteName: string;
  toSiteName: string;
  fatherName: string;
  vehicleType: string;
  vehicleName: string;
  vehicleNumber: string;
  geoTagPhotoUrl: string | null;
};

export function formatAttendanceDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getAttendanceStatusClasses(status: AttendanceStatus) {
  if (status === "APPROVED") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
  if (status === "REJECTED") {
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }
  return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}

export function getAttendanceRouteType(record: DriverAttendanceRecord) {
  const from = record.fromSiteName.trim().toLowerCase();
  const to = record.toSiteName.trim().toLowerCase();

  if (!from || !to) {
    return "INTER_SITE";
  }

  if (from === to || from.includes(to) || to.includes(from)) {
    return "INTRA_CITY";
  }

  return "INTER_SITE";
}
