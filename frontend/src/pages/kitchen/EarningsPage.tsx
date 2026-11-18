import { BadgePercent, Ban, CalendarDays, CheckCircle2, IndianRupee, ShoppingBag, Truck, Wallet } from 'lucide-react';
import { useFetch } from '../../components/useFetch';
import type { Order } from '../../types';
import { AreaTrend, ChartCard } from '../../components/Charts';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { ErrorState, PageHeader, PageLoader, StatCard } from '../../components/ui';
import { downloadCsv, fmtDateTime, rupee } from '../../utils/format';

interface E { daily: number; weekly: number; monthly: number; totalOrders: number; completedOrders: number; cancelledOrders: number;
  grossSales: number; deliveryCharges: number; platformCommission: number; netEarnings: number; last30Days: { day: string; earnings: number; orders: number }[]; orders: Order[]; }

export default function EarningsPage() {
  const { data: e, loading, error, reload } = useFetch<E>('/kitchen/earnings');
  if (loading) return <PageLoader />;
  if (error || !e) return <ErrorState message={error ?? ''} onRetry={reload} />;
  return (
    <div>
      <PageHeader title="Earnings" subtitle="Your sales, platform commission and net payout"
        actions={<button className="btn-outline" onClick={() => downloadCsv('homeplate-earnings.csv', e.orders.map((o) => ({ Order: o.orderNumber, Date: o.createdAt, Customer: o.customer.fullName, Food: o.foodTotal, Delivery: o.deliveryCharge, Commission: o.commission, Net: o.kitchenEarning, Status: o.status })))}>Export CSV</button>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today" value={rupee(e.daily)} icon={IndianRupee} />
        <StatCard label="Last 7 days" value={rupee(e.weekly)} icon={CalendarDays} tone="blue" />
        <StatCard label="This month" value={rupee(e.monthly)} icon={Wallet} tone="purple" />
        <StatCard label="Net earnings (all time)" value={rupee(e.netEarnings)} icon={CheckCircle2} tone="green" />
        <StatCard label="Total orders" value={e.totalOrders} icon={ShoppingBag} tone="orange" />
        <StatCard label="Completed" value={e.completedOrders} icon={CheckCircle2} tone="green" />
        <StatCard label="Cancelled / rejected" value={e.cancelledOrders} icon={Ban} tone="red" />
        <StatCard label="Platform commission" value={rupee(e.platformCommission)} icon={BadgePercent} tone="yellow" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <ChartCard title="Daily earnings" subtitle="Last 30 days"><AreaTrend data={e.last30Days} x="day" series={[{ key: 'earnings', name: 'Net earnings', money: true }]} height={280} /></ChartCard>
        <div className="card space-y-3 p-5 text-sm">
          <h3 className="font-semibold">Payout breakdown</h3>
          <Row l="Gross food sales" v={rupee(e.grossSales)} />
          <Row l={<span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />Delivery charges (yours)</span>} v={`+ ${rupee(e.deliveryCharges)}`} />
          <Row l="Platform commission" v={`− ${rupee(e.platformCommission)}`} red />
          <div className="flex justify-between border-t border-cream-200 pt-3 text-base font-bold"><span>Net earnings</span><span className="text-brand-700">{rupee(e.netEarnings)}</span></div>
          <p className="text-xs text-charcoal-400">Coupon discounts are funded by HomePlate and never reduce your earnings.</p>
        </div>
      </div>
      <h3 className="mb-3 mt-8 font-semibold">Order-wise earnings</h3>
      <DataTable rows={e.orders} searchText={(o) => `${o.orderNumber} ${o.customer.fullName}`} columns={[
        { key: 'o', header: 'Order', render: (o) => <><b>{o.orderNumber}</b><p className="text-xs text-charcoal-400">{fmtDateTime(o.createdAt)}</p></> },
        { key: 'f', header: 'Food', render: (o) => rupee(o.foodTotal) },
        { key: 'd', header: 'Delivery', render: (o) => rupee(o.deliveryCharge) },
        { key: 'c', header: 'Commission', render: (o) => <span className="text-red-600">−{rupee(o.commission, 2)}</span> },
        { key: 'n', header: 'Net', render: (o) => <b>{rupee(o.kitchenEarning, 2)}</b> },
        { key: 's', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
      ]} />
    </div>
  );
}

function Row({ l, v, red }: { l: React.ReactNode; v: string; red?: boolean }) {
  return <div className="flex justify-between"><span className="text-charcoal-500">{l}</span><span className={red ? 'text-red-600' : ''}>{v}</span></div>;
}
