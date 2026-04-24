"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Boxes,
  Copy,
  ExternalLink,
  MapPinned,
  QrCode,
  ZoomIn,
} from "lucide-react";
import ImagePreviewModal from "@/components/ui/image-preview-modal";

import ActionToast from "@/app/dashboard/action-toast";
import {
  formatStoreDate,
  formatStoreQuantity,
  getLocationTypeClasses,
  getStoreItemQrImageUrl,
  getStoreItemStatus,
  getStoreItemStatusClasses,
  getStoreLocationLabel,
  StoreItem,
  StoreLocation,
} from "../../store-data";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <div className="text-slate-100">{value}</div>
    </div>
  );
}

export default function StoreItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<StoreItem | null>(null);
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [previewData, setPreviewData] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const [itemResponse, locationResponse] = await Promise.all([
          fetch(`/api/store/items/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/store/locations", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!itemResponse.ok || !locationResponse.ok) {
          throw new Error("Failed to fetch store item detail");
        }

        setItem((await itemResponse.json()) as StoreItem);
        setLocations((await locationResponse.json()) as StoreLocation[]);
      } catch (error) {
        console.error(error);
        setItem(null);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id]);

  const status = useMemo(
    () => (item ? getStoreItemStatus(item) : "ACTIVE"),
    [item],
  );

  const qrImageUrl = item ? getStoreItemQrImageUrl(item.qrValue) : "";

  const copyQrValue = async () => {
    if (!item) {
      return;
    }

    try {
      await navigator.clipboard.writeText(item.qrValue);
      setToast({ message: "QR route copied.", tone: "success" });
    } catch {
      setToast({ message: "Could not copy QR route.", tone: "error" });
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 px-6 py-16 text-center text-slate-500">
        Loading item details...
      </div>
    );
  }

  if (!item) {
    return (
      <p className="py-12 text-center text-slate-400">Store item not found</p>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      {toast ? (
        <ActionToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}

      <Link
        href="/dashboard/store"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} /> Back to Store Management
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-white/5 bg-slate-900/50">
            <div 
              className="relative h-72 border-b border-white/5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 cursor-zoom-in group"
              onClick={() => item.imageUrl && setPreviewData({ url: item.imageUrl, title: item.name })}
            >
              {item.imageUrl ? (
                <>
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                    <ZoomIn className="text-white drop-shadow-lg" size={32} />
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Boxes size={42} className="text-slate-600" />
                </div>
              )}
              <div className="absolute left-5 top-5 inline-flex rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-200 backdrop-blur">
                {item.itemType}
              </div>
            </div>

            <div className="space-y-6 p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {item.itemCode}
                  </p>
                  <h1 className="mt-2 text-2xl font-bold text-slate-100">
                    {item.name}
                  </h1>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.category}
                    {item.subcategory ? ` / ${item.subcategory}` : ""}
                  </p>
                </div>
                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${getStoreItemStatusClasses(
                    status,
                  )}`}
                >
                  {status.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-6">
                <DetailRow label="Brand" value={item.brand || "-"} />
                <DetailRow label="Model" value={item.model || "-"} />
                <DetailRow label="Serial Number" value={item.serialNumber || "-"} />
                <DetailRow label="Unit" value={item.unit || "Nos"} />
                <DetailRow
                  label="Created At"
                  value={formatStoreDate(item.createdAt)}
                />
                <DetailRow
                  label="Description"
                  value={item.description || "-"}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Stock by Location
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Current mapped quantity and safety level per location.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="border-b border-white/5 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Minimum Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {item.stockByLocation.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                        No stock mapped yet for this item.
                      </td>
                    </tr>
                  ) : (
                    item.stockByLocation.map((entry) => {
                      const location = locations.find(
                        (value) => value.key === entry.locationKey,
                      );

                      return (
                        <tr key={entry.locationKey}>
                          <td className="px-4 py-4 text-slate-200">
                            {getStoreLocationLabel(entry.locationKey, locations)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                                location
                                  ? getLocationTypeClasses(location.type)
                                  : "border-white/10 bg-white/5 text-slate-400"
                              }`}
                            >
                              {location?.type || "UNKNOWN"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-100">
                            {formatStoreQuantity(entry.quantity, item.unit)}
                          </td>
                          <td className="px-4 py-4 text-slate-400">
                            {formatStoreQuantity(entry.minimumStock, item.unit)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-300">
                <QrCode size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">QR Identity</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Scan to open this item record directly.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mt-5 w-full overflow-hidden rounded-3xl border border-white/5 bg-white p-4 cursor-zoom-in group transition-transform hover:scale-[1.02]"
              onClick={() => setPreviewData({ url: qrImageUrl, title: `QR Identity - ${item.name}` })}
            >
              <div
                className="aspect-square w-full rounded-2xl bg-contain bg-center bg-no-repeat transition-opacity group-hover:opacity-80"
                style={{ backgroundImage: `url("${qrImageUrl}")` }}
              />
            </button>

            <div className="mt-4 rounded-2xl border border-white/5 bg-slate-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                QR Route
              </p>
              <p className="mt-2 break-all text-sm text-slate-300">
                {item.qrValue}
              </p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyQrValue}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5"
              >
                <Copy size={14} />
                Copy Route
              </button>
              <a
                href={qrImageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                <ExternalLink size={14} />
                Open QR
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300">
                <MapPinned size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Location Summary
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Quick look at where this item currently lives.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {item.stockByLocation.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-500">
                  No stock locations assigned yet.
                </div>
              ) : (
                item.stockByLocation.map((entry) => {
                  const location = locations.find(
                    (value) => value.key === entry.locationKey,
                  );

                  return (
                    <div
                      key={entry.locationKey}
                      className="rounded-2xl border border-white/5 bg-slate-950/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-100">
                            {getStoreLocationLabel(entry.locationKey, locations)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {location?.address || "No address saved"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                            location
                              ? getLocationTypeClasses(location.type)
                              : "border-white/10 bg-white/5 text-slate-400"
                          }`}
                        >
                          {location?.type || "UNKNOWN"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {previewData && (
        <ImagePreviewModal
          isOpen={!!previewData}
          onClose={() => setPreviewData(null)}
          imageUrl={previewData.url}
          title={previewData.title}
        />
      )}
    </div>
  );
}
