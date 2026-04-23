"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Loader2,
  PackagePlus,
  Upload,
  X,
} from "lucide-react";

import type { StoreLocation } from "../../store-data";

export default function CreateStoreItemPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    subcategory: "",
    itemType: "ASSET",
    unit: "Nos",
    brand: "",
    model: "",
    serialNumber: "",
    description: "",
    initialLocationKey: "",
    initialQuantity: "0",
    minimumStock: "0",
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/store/locations", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch locations");
        }

        const payload = (await response.json()) as StoreLocation[];
        setLocations(payload);
        if (payload[0]) {
          setForm((current) => ({
            ...current,
            initialLocationKey: current.initialLocationKey || payload[0].key,
          }));
        }
      } catch (fetchError) {
        console.error(fetchError);
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };

    void fetchLocations();
  }, []);

  const setField =
    (key: keyof typeof form) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const currentQty = useMemo(
    () => Number(form.initialQuantity || 0),
    [form.initialQuantity],
  );

  const uploadImage = async (itemId: string) => {
    if (!imageFile) {
      return;
    }

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch(`/api/store/items/${itemId}/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Item image upload failed");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Item name is required");
      return;
    }
    if (!form.category.trim()) {
      setError("Category is required");
      return;
    }
    if (locations.length === 0) {
      setError("Create at least one location before adding store items");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/store/items", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Failed to create store item");
      }

      await uploadImage(payload.id as string);
      router.push(`/dashboard/store/items/${payload.id}`);
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create store item",
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50";
  const labelClassName =
    "mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500";

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in-up">
      <Link
        href="/dashboard/store"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} /> Back to Store Management
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-100">
          New Store Item
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          Create an image-based asset or stock item with QR identity and location mapping.
        </p>

        {error ? (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
            <AlertCircle size={16} />
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClassName}>Item Name *</label>
                  <input
                    value={form.name}
                    onChange={setField("name")}
                    className={inputClassName}
                    placeholder="Lenovo ThinkPad Dispatch Laptop"
                    required
                  />
                </div>
                <div>
                  <label className={labelClassName}>Item Type *</label>
                  <select
                    value={form.itemType}
                    onChange={setField("itemType")}
                    className={inputClassName}
                  >
                    <option value="ASSET">Asset</option>
                    <option value="STOCK">Stock</option>
                  </select>
                </div>
                <div>
                  <label className={labelClassName}>Category *</label>
                  <input
                    value={form.category}
                    onChange={setField("category")}
                    className={inputClassName}
                    placeholder="Devices"
                    required
                  />
                </div>
                <div>
                  <label className={labelClassName}>Subcategory</label>
                  <input
                    value={form.subcategory}
                    onChange={setField("subcategory")}
                    className={inputClassName}
                    placeholder="Laptop"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Unit</label>
                  <input
                    value={form.unit}
                    onChange={setField("unit")}
                    className={inputClassName}
                    placeholder="Nos"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Brand</label>
                  <input
                    value={form.brand}
                    onChange={setField("brand")}
                    className={inputClassName}
                    placeholder="Lenovo"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Model</label>
                  <input
                    value={form.model}
                    onChange={setField("model")}
                    className={inputClassName}
                    placeholder="ThinkPad E14"
                  />
                </div>
                <div>
                  <label className={labelClassName}>Serial Number</label>
                  <input
                    value={form.serialNumber}
                    onChange={setField("serialNumber")}
                    className={inputClassName}
                    placeholder="LP-RHO-2401"
                  />
                </div>
              </div>

              <div>
                <label className={labelClassName}>Description</label>
                <textarea
                  value={form.description}
                  onChange={setField("description")}
                  rows={4}
                  className={`${inputClassName} resize-none`}
                  placeholder="Add useful notes, usage context, or issue/handling instructions."
                />
              </div>

              <div className="border-t border-white/5 pt-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-400">
                  Stock Mapping
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className={labelClassName}>Initial Location</label>
                    <select
                      value={form.initialLocationKey}
                      onChange={setField("initialLocationKey")}
                      className={inputClassName}
                      disabled={loadingLocations || locations.length === 0}
                    >
                      {locations.map((location) => (
                        <option key={location.key} value={location.key}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClassName}>Initial Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={form.initialQuantity}
                      onChange={setField("initialQuantity")}
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>Minimum Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={form.minimumStock}
                      onChange={setField("minimumStock")}
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-white/5 bg-slate-950/40">
                <div className="relative h-64 border-b border-white/5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Item preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Boxes size={36} className="text-slate-600" />
                    </div>
                  )}
                  {imagePreview ? (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute right-3 top-3 rounded-full bg-slate-950/80 p-1.5 text-slate-300 transition-colors hover:text-rose-400"
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
                <div className="p-4">
                  <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5">
                    <Upload size={14} />
                    Upload Item Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setImageFile(file);
                        setImagePreview(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Preview Summary
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Type</span>
                    <span className="text-slate-100">{form.itemType}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Category</span>
                    <span className="text-right text-slate-100">
                      {form.category || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Initial Qty</span>
                    <span className="text-slate-100">{currentQty} {form.unit}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">QR</span>
                    <span className="text-slate-100">Auto on create</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <PackagePlus size={16} />
              )}
              Create Store Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
