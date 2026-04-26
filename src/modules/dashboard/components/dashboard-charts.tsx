"use client";

import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface ChartProps {
  data: any[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--app-surface)]/90 backdrop-blur-md border border-[var(--app-border)] p-4 rounded-2xl shadow-2xl">
        <p className="text-xs font-bold text-[var(--app-text)] mb-2 uppercase tracking-widest">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs font-medium text-[var(--app-muted)]">{entry.name}:</span>
              <span className="text-sm font-bold text-[var(--app-text)] ml-auto">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function ActivityTrendChart({ data }: ChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-full w-full bg-[var(--app-panel)]/20 animate-pulse rounded-2xl" />;

  return (
    <div className="h-full w-full py-2 min-w-0">
      <ResponsiveContainer width="100%" height="100%" debounce={10}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--app-accent)" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="var(--app-accent)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRepair" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--app-muted)', fontSize: 11, fontWeight: 500 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--app-muted)', fontSize: 11, fontWeight: 500 }} 
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" opacity={0.5} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--app-border)', strokeWidth: 1 }} />
          <Area 
            type="monotone" 
            dataKey="requisitions" 
            stroke="var(--app-accent)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorReq)" 
            name="Requisitions"
            activeDot={{ r: 6, stroke: 'var(--app-surface)', strokeWidth: 2 }}
          />
          <Area 
            type="monotone" 
            dataKey="repair" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRepair)" 
            name="Repairs"
            activeDot={{ r: 6, stroke: 'var(--app-surface)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ModuleDistributionChart({ data }: ChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const COLORS = ['var(--app-accent)', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (!mounted) return <div className="h-full w-full flex items-center justify-center"><div className="w-32 h-32 rounded-full border-4 border-dashed border-[var(--app-border)] animate-spin" /></div>;

  return (
    <div className="h-full w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" debounce={10}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            nameKey="label"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--app-surface)', 
              borderRadius: '16px', 
              border: '1px solid var(--app-border)',
              color: 'var(--app-text)'
            }} 
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-xs text-[var(--app-muted)]">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
