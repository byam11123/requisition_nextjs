"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPinned, Plus, Trash2, Warehouse } from "lucide-react";
import ConfirmationModal from "@/components/ui/confirmation-modal";

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

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    locationKey: string;
  }>({
    isOpen: false,
    locationKey: "",
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

  const handleDelete = async (key: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/store/locations?key=${key}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setLocations((prev) => prev.filter((l) => l.key !== key));
        setToast({ message: "Location deleted successfully.", tone: "success" });
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete location");
      }
    } catch (error: unknown) {
      setToast({
        message: error instanceof Error ? error.message : "Deletion failed",
        tone: "error",
      });
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition-colors focus:border-[var(--app-accent-border)]";

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

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={() => handleDelete(deleteModal.locationKey)}
        title="Delete Location?"
        message="Are you sure you want to delete this location? Any items at this location will lose their location mapping."
        confirmLabel="Yes, Delete"
        cancelLabel="Keep Location"
        tone="danger"
      />

      <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="inline-flex rounded-2xl border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] p-2 text-[var(--app-accent)]">
            <Plus size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--app-text)]">
              Add Location
            </h2>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--app-accent-hover)] disabled:opacity-50 shadow-lg shadow-[var(--app-accent)]/20"
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
          <div className="col-span-full rounded-3xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-16 text-center text-[var(--app-muted)]">
            Loading locations...
          </div>
        ) : locations.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] px-6 py-16 text-center text-[var(--app-muted)]">
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
                className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-2 text-[var(--app-muted)] group-hover:text-[var(--app-accent)] transition-colors">
                        {location.type === "WAREHOUSE" ? (
                          <Warehouse size={18} />
                        ) : (
                          <MapPinned size={18} />
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            locationKey: location.key,
                          })
                        }
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Location"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-[var(--app-text)] truncate">
                      {location.name}
                    </h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
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
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                      Item Entries
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--app-text)]">
                      {stat.itemCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                      Total Qty
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[var(--app-text)]">
                      {stat.quantity}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-[var(--app-text)] opacity-90">{location.address || "No address saved"}</p>
                  <p className="text-[var(--app-muted)]">
                    Contact: {location.contactPerson || "Not assigned"}
                  </p>
                  <p className="text-[var(--app-muted)] text-xs">
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
