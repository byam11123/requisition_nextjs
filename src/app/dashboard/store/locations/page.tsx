"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPinned, Plus, Warehouse } from "lucide-react";

import ActionToast from "@/app/dashboard/action-toast";
import PageHeader from "@/app/dashboard/components/page-header";
import {
  formatStoreDate,
  getLocationTypeClasses,
  StoreItem,
  StoreLocation,
} from "../store-data";

export default function StoreLocationsPage() {
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "OFFICE",
    address: "",
    contactPerson: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [locationsResponse, itemsResponse] = await Promise.all([
        fetch("/api/store/locations", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/store/items", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!locationsResponse.ok || !itemsResponse.ok) {
        throw new Error("Failed to load store location data");
      }

      setLocations((await locationsResponse.json()) as StoreLocation[]);
      setItems((await itemsResponse.json()) as StoreItem[]);
    } catch (error: unknown) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to load store locations.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const stockStats = useMemo(() => {
    const map = new Map<string, { quantity: number; itemCount: number }>();
    for (const location of locations) {
      map.set(location.key, { quantity: 0, itemCount: 0 });
    }

    for (const item of items) {
      for (const entry of item.stockByLocation) {
        const current = map.get(entry.locationKey) || {
          quantity: 0,
          itemCount: 0,
        };
        current.quantity += Number(entry.quantity || 0);
        current.itemCount += 1;
        map.set(entry.locationKey, current);
      }
    }

    return map;
  }, [items, locations]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/store/locations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to create location");
      }

      setLocations((current) => [payload as StoreLocation, ...current]);
      setForm({
        name: "",
        code: "",
        type: "OFFICE",
        address: "",
        contactPerson: "",
      });
      setToast({ message: "Location created.", tone: "success" });
    } catch (error: unknown) {
      setToast({
        message:
          error instanceof Error ? error.message : "Failed to create location.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-indigo-500/50";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast ? (
        <ActionToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}

      <PageHeader
        title="Store Locations"
        subtitle="Manage offices, sites, warehouses, and yards that hold inventory."
      />

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="inline-flex rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-300">
            <Plus size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Add Location
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Create the places where stock and assets are stored.
            </p>
          </div>
        </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Raipur Head Office"
            className={inputClassName}
          />
          <input
            value={form.code}
            onChange={(event) =>
              setForm((current) => ({ ...current, code: event.target.value }))
            }
            placeholder="RHO"
            className={inputClassName}
          />
          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({ ...current, type: event.target.value }))
            }
            className={inputClassName}
          >
            <option value="OFFICE">Office</option>
            <option value="SITE">Site</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="YARD">Yard</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            value={form.contactPerson}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contactPerson: event.target.value,
              }))
            }
            placeholder="Contact person"
            className={inputClassName}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Create
          </button>
        </div>
        <div className="mt-4">
          <input
            value={form.address}
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
            placeholder="Full location address"
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-16 text-center text-slate-500">
            Loading locations...
          </div>
        ) : locations.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-16 text-center text-slate-500">
            No locations created yet.
          </div>
        ) : (
          locations.map((location) => {
            const stat = stockStats.get(location.key) || {
              quantity: 0,
              itemCount: 0,
            };
            return (
              <div
                key={location.key}
                className="rounded-3xl border border-white/5 bg-slate-900/50 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex rounded-2xl border border-white/10 bg-slate-950/40 p-2 text-slate-300">
                      {location.type === "WAREHOUSE" ? (
                        <Warehouse size={18} />
                      ) : (
                        <MapPinned size={18} />
                      )}
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-100">
                      {location.name}
                    </h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {location.code}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getLocationTypeClasses(
                      location.type,
                    )}`}
                  >
                    {location.type}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Item Entries
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-100">
                      {stat.itemCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Total Qty
                    </p>
                    <p className="mt-2 text-xl font-semibold text-slate-100">
                      {stat.quantity}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-slate-300">{location.address || "No address saved"}</p>
                  <p className="text-slate-500">
                    Contact: {location.contactPerson || "Not assigned"}
                  </p>
                  <p className="text-slate-500">
                    Created: {formatStoreDate(location.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
