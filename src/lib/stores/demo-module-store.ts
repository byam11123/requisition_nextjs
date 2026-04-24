import fs from "node:fs";
import path from "node:path";

const DEMO_MODULE_STORE_PATH = path.join(process.cwd(), ".local", "demo-module-data.json");

type DemoModuleData = {
  requisitions: unknown[];
  repairs: unknown[];
  attendance: unknown[];
  salaryAdvances: unknown[];
  requisitionCounter: number;
  repairCounter: number;
  attendanceCounter: number;
  salaryAdvanceCounter: number;
  seededAt: string | null;
};

type DemoGlobals = typeof globalThis & {
  __devReqStore?: unknown[];
  __devReqCounter?: number;
  __devRepairStore?: unknown[];
  __devRepairCounter?: number;
  __devAttendanceStore?: unknown[];
  __devAttendanceCounter?: number;
  __devSalaryAdvanceStore?: unknown[];
  __devSalaryAdvanceCounter?: number;
};

const g = globalThis as DemoGlobals;

function defaultDemoModuleData(): DemoModuleData {
  return {
    requisitions: [],
    repairs: [],
    attendance: [],
    salaryAdvances: [],
    requisitionCounter: 0,
    repairCounter: 0,
    attendanceCounter: 0,
    salaryAdvanceCounter: 0,
    seededAt: null,
  };
}

function normalizeStore(value: unknown): DemoModuleData {
  if (!value || typeof value !== "object") {
    return defaultDemoModuleData();
  }

  const source = value as Partial<DemoModuleData>;
  return {
    requisitions: Array.isArray(source.requisitions) ? source.requisitions : [],
    repairs: Array.isArray(source.repairs) ? source.repairs : [],
    attendance: Array.isArray(source.attendance) ? source.attendance : [],
    salaryAdvances: Array.isArray(source.salaryAdvances) ? source.salaryAdvances : [],
    requisitionCounter: Number.isFinite(source.requisitionCounter) ? Number(source.requisitionCounter) : 0,
    repairCounter: Number.isFinite(source.repairCounter) ? Number(source.repairCounter) : 0,
    attendanceCounter: Number.isFinite(source.attendanceCounter) ? Number(source.attendanceCounter) : 0,
    salaryAdvanceCounter: Number.isFinite(source.salaryAdvanceCounter) ? Number(source.salaryAdvanceCounter) : 0,
    seededAt: typeof source.seededAt === "string" ? source.seededAt : null,
  };
}

function readStore() {
  try {
    if (!fs.existsSync(DEMO_MODULE_STORE_PATH)) {
      return defaultDemoModuleData();
    }

    const raw = fs.readFileSync(DEMO_MODULE_STORE_PATH, "utf8");
    return normalizeStore(JSON.parse(raw));
  } catch {
    return defaultDemoModuleData();
  }
}

function writeStore(store: DemoModuleData) {
  fs.mkdirSync(path.dirname(DEMO_MODULE_STORE_PATH), { recursive: true });
  fs.writeFileSync(DEMO_MODULE_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export function hydrateDemoModuleGlobals() {
  const store = readStore();

  if (!g.__devReqStore) {
    g.__devReqStore = store.requisitions;
  }
  if (typeof g.__devReqCounter !== "number") {
    g.__devReqCounter = store.requisitionCounter || store.requisitions.length;
  }

  if (!g.__devRepairStore) {
    g.__devRepairStore = store.repairs;
  }
  if (typeof g.__devRepairCounter !== "number") {
    g.__devRepairCounter = store.repairCounter || store.repairs.length;
  }

  if (!g.__devAttendanceStore) {
    g.__devAttendanceStore = store.attendance;
  }
  if (typeof g.__devAttendanceCounter !== "number") {
    g.__devAttendanceCounter = store.attendanceCounter || store.attendance.length;
  }

  if (!g.__devSalaryAdvanceStore) {
    g.__devSalaryAdvanceStore = store.salaryAdvances;
  }
  if (typeof g.__devSalaryAdvanceCounter !== "number") {
    g.__devSalaryAdvanceCounter =
      store.salaryAdvanceCounter || store.salaryAdvances.length;
  }

  return store;
}

export function replaceDemoModuleData(input: Omit<DemoModuleData, "seededAt">) {
  const store: DemoModuleData = {
    ...input,
    seededAt: new Date().toISOString(),
  };

  g.__devReqStore = store.requisitions;
  g.__devReqCounter = store.requisitionCounter;
  g.__devRepairStore = store.repairs;
  g.__devRepairCounter = store.repairCounter;
  g.__devAttendanceStore = store.attendance;
  g.__devAttendanceCounter = store.attendanceCounter;
  g.__devSalaryAdvanceStore = store.salaryAdvances;
  g.__devSalaryAdvanceCounter = store.salaryAdvanceCounter;

  writeStore(store);
  return store;
}
