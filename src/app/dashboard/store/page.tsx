"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  MapPinned,
  PackagePlus,
  QrCode,
  Search,
  ShieldAlert,
} from "lucide-react";

import {
  formatStoreQuantity,
  getStoreItemStatus,
  getStoreItemStatusClasses,
  getStoreItemTotalQuantity,
  getStoreLocationLabel,
  StoreItem,
  StoreLocation,
} from "./store-data";
import FilterDropdown, {
  type FilterDropdownOption,
} from "@/components/ui/filter-dropdown";
import PageHeader from "@/app/dashboard/components/page-header";
import StatCard from "@/components/ui/stat-card";

export default function StoreManagementPage() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "ASSET" | "STOCK">("ALL");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [itemsResponse, locationsResponse] = await Promise.all([
          fetch("/api/store/items", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/store/locations", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!itemsResponse.ok || !locationsResponse.ok) {
          throw new Error("Failed to fetch store data");
        }

        setItems((await itemsResponse.json()) as StoreItem[]);
        setLocations((await locationsResponse.json()) as StoreLocation[]);
      } catch (error) {
        console.error(error);
        setItems([]);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== "ALL" && item.itemType !== typeFilter) {
        return false;
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        return true;
      }

      return (
        item.name.toLowerCase().includes(query) ||
        item.itemCode.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.subcategory.toLowerCase().includes(query) ||
        item.serialNumber.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery, typeFilter]);

  const stats = useMemo(() => {
    const lowStock = items.filter(
      (item) => getStoreItemStatus(item) === "LOW_STOCK",
    ).length;
    return {
      totalItems: items.length,
      totalLocations: locations.length,
      lowStock,
      qrReady: items.filter((item) => !!item.qrValue).length,
    };
  }, [items, locations]);

  const statCards = [
    {
      label: "Total Items",
      value: stats.totalItems,
      helper: "Visual item master records",
      icon: Boxes,
      tone: "indigo",
    },
    {
      label: "Locations",
      value: stats.totalLocations,
      helper: "Office, site, yard, and warehouse points",
      icon: MapPinned,
      tone: "emerald",
    },
    {
      label: "Low Stock",
      value: stats.lowStock,
      helper: "Items at or below safety level",
      icon: ShieldAlert,
      tone: "amber",
    },
    {
      label: "QR Ready",
      value: stats.qrReady,
      helper: "Items ready for scan-based lookup",
      icon: QrCode,
      tone: "purple",
    },
  ];

  const typeOptions: FilterDropdownOption<"ALL" | "ASSET" | "STOCK">[] = [
    { value: "ALL", label: "All Item Types" },
    { value: "ASSET", label: "Assets" },
    { value: "STOCK", label: "Stock Items" },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Store Management"
        subtitle="Image-based item master with QR identity, multi-location stock, and future GRN/STN support."
        align="end"
        actions={
          <>
          <Link
            href="/dashboard/store/locations"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5"
          >
            <MapPinned size={16} />
            Manage Locations
          </Link>
          <Link
            href="/dashboard/store/items/create"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
          >
            <PackagePlus size={16} />
            New Store Item
          </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            title={card.label}
            value={loading ? "..." : (card.value || 0).toLocaleString("en-IN")}
            helper={card.helper}
            icon={card.icon}
            tone={card.tone as any}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by item code, name, category, serial, or subcategory..."
              className="w-full rounded-xl border border-white/5 bg-slate-950/50 py-2.5 pl-9 pr-4 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50"
            />
          </div>
          <FilterDropdown
            label="Item Type"
            value={typeFilter}
            options={typeOptions}
            onChange={setTypeFilter}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-16 text-center text-slate-500">
            Loading store records...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 text-slate-400">
              <Boxes size={20} />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-100">
              No store items found
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Start by creating image-based devices, materials, or support stock for your locations.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const totalQuantity = getStoreItemTotalQuantity(item);
            const status = getStoreItemStatus(item);
            const primaryLocation = item.stockByLocation[0];

            return (
              <Link
                key={item.id}
                href={`/dashboard/store/items/${item.id}`}
                className="group overflow-hidden rounded-3xl border border-white/5 bg-slate-900/50 transition-colors hover:border-white/10 hover:bg-white/[0.03]"
              >
                <div className="relative h-48 overflow-hidden border-b border-white/5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Boxes size={34} className="text-slate-600" />
                    </div>
                  )}
                  <div className="absolute left-4 top-4 inline-flex rounded-full border border-white/10 bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300 backdrop-blur">
                    {item.itemType}
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {item.itemCode}
                      </p>
                      <h2 className="mt-1 truncate text-lg font-semibold text-slate-100">
                        {item.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {item.category}
                        {item.subcategory ? ` / ${item.subcategory}` : ""}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getStoreItemStatusClasses(
                        status,
                      )}`}
                    >
                      {status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Total Qty
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-100">
                        {formatStoreQuantity(totalQuantity, item.unit)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        QR
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-100">
                        Ready
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 text-sm text-slate-400">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Primary Location
                      </p>
                      <p className="mt-1 truncate text-slate-300">
                        {primaryLocation
                          ? getStoreLocationLabel(primaryLocation.locationKey, locations)
                          : "No stock mapped yet"}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
