import { Boxes, MapPinned, ShieldAlert, QrCode } from 'lucide-react';
import StatCard from '@/components/ui/stat-card';

export function StoreStats({ items, locations, loading }: any) {
  const lowStock = items.filter((i: any) => i.status === 'LOW_STOCK').length;
  
  const stats = [
    { label: "Total Items", value: items.length, icon: Boxes, tone: "indigo" },
    { label: "Locations", value: locations.length, icon: MapPinned, tone: "emerald" },
    { label: "Low Stock", value: lowStock, icon: ShieldAlert, tone: "amber" },
    { label: "QR Ready", value: items.filter((i: any) => !!i.qrValue).length, icon: QrCode, tone: "purple" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <StatCard key={s.label} title={s.label} value={loading ? '...' : s.value} icon={s.icon} tone={s.tone as any} />
      ))}
    </div>
  );
}
