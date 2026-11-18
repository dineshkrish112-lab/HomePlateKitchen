import type { ReactNode } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { shortRupee } from '../utils/format';

export const PALETTE = ['#2E9455', '#F07315', '#0EA5E9', '#8B5CF6', '#E11D48', '#EAB308', '#14B8A6'];
const axis = { fontSize: 11, fill: '#6B6F76' };
const grid = <CartesianGrid strokeDasharray="3 3" stroke="#EFE8DA" vertical={false} />;
const tooltipStyle = { borderRadius: 12, border: '1px solid #E9DFCC', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,.08)' };

export function ChartCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div><h3 className="font-semibold">{title}</h3>{subtitle && <p className="text-xs text-charcoal-400">{subtitle}</p>}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

type Series = { key: string; name: string; color?: string; money?: boolean };

export function AreaTrend({ data, x, series, height = 260 }: { data: object[]; x: string; series: Series[]; height?: number }) {
  const money = series.some((s) => s.money);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -10, right: 8, top: 4 }}>
        <defs>{series.map((s, i) => (
          <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color ?? PALETTE[i]} stopOpacity={0.28} /><stop offset="100%" stopColor={s.color ?? PALETTE[i]} stopOpacity={0} />
          </linearGradient>))}</defs>
        {grid}
        <XAxis dataKey={x} tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => (money ? shortRupee(v) : v)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [series.find((s) => s.name === n)?.money ? shortRupee(v) : v, n]} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color ?? PALETTE[i]} strokeWidth={2.5} fill={`url(#g-${s.key})`} />)}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Bars({ data, x, series, height = 260, stacked }: { data: object[]; x: string; series: Series[]; height?: number; stacked?: boolean }) {
  const money = series.some((s) => s.money);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -10, right: 8, top: 4 }}>
        {grid}
        <XAxis dataKey={x} tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => (money ? shortRupee(v) : v)} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#FBF7EF' }} formatter={(v: number, n: string) => [series.find((s) => s.name === n)?.money ? shortRupee(v) : v, n]} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color ?? PALETTE[i]} radius={stacked ? 0 : [6, 6, 0, 0]} stackId={stacked ? 'a' : undefined} maxBarSize={36} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Lines({ data, x, series, height = 260 }: { data: object[]; x: string; series: Series[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -10, right: 8, top: 4 }}>
        {grid}
        <XAxis dataKey={x} tick={axis} axisLine={false} tickLine={false} />
        <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color ?? PALETTE[i]} strokeWidth={2.5} dot={{ r: 3 }} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 240 }: { data: { name: string; value: number }[]; height?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold">{total}</span><span className="text-xs text-charcoal-400">total</span></div>
      </div>
      <ul className="flex-1 space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="flex-1 text-charcoal-600">{d.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</span><b>{d.value}</b></li>
        ))}
      </ul>
    </div>
  );
}
