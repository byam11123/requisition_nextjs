"use client";

import Link from "next/link";
import { MapPinned, PackagePlus, Search } from "lucide-react";
import { useStore } from "@/modules/store/hooks/use-store";
import { StoreStats } from "@/modules/store/components/store-stats";
import { StoreItemCard } from "@/modules/store/components/store-item-card";
import PageHeader from "@/app/dashboard/components/page-header";
import FilterDropdown from "@/components/ui/filter-dropdown";

export default function StoreManagementPage() {
  const { 
    items, locations, loading, searchQuery, setSearchQuery, 
    typeFilter, setTypeFilter 
  } = useStore();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Store Management"
        subtitle="Full item lifecycle: images, QR codes, and multi-location tracking."
        actions={
          <>
            <Link href="/dashboard/store/locations" className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
              <MapPinned size={16} /> Manage Locations
            </Link>
            <Link href="/dashboard/store/items/create" className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 text-white">
              <PackagePlus size={16} /> New Item
            </Link>
          </>
        }
      />

      <StoreStats items={items} locations={locations} loading={loading} />

      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search inventory..." 
            className="w-full bg-slate-950/50 border border-white/5 py-2.5 pl-9 pr-4 rounded-xl text-sm outline-none focus:border-indigo-500/50" 
          />
        </div>
        <FilterDropdown 
          label="Item Type" 
          value={typeFilter} 
          options={[{value:'ALL', label:'All Types'}, {value:'ASSET', label:'Assets'}, {value:'STOCK', label:'Stock'}]} 
          onChange={setTypeFilter} 
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-500">Loading inventory...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 italic border border-dashed border-white/10 rounded-3xl">No items found matching your filters</div>
        ) : (
          items.map(item => <StoreItemCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

