import { Link } from 'react-router-dom';
import { BadgeCheck, ClipboardList, CreditCard, IndianRupee, Store, TrendingUp, Users, Wallet } from 'lucide-react';
import { useFetch } from '../../components/useFetch';
import type { Kitchen, Order } from '../../types';
import { AreaTrend, Bars, ChartCard, Donut, Lines } from '../../components/Charts';
import StatusBadge from '../../components/StatusBadge';
import { ErrorState, PageHeader, PageLoader, StatCard } from '../../components/ui';
import { rupee, timeAgo } from '../../utils/format';

interface D {
  kpis: Record<string, number>;
  monthly: { month: string; orders: number; gmv: number; platformRevenue: number; subscriptionRevenue: number; newKitchens: number; newCustomers: number; totalCustomers: number; activeSubscriptions: number }[];
  subscriptionBreakdown: { name: string; value: number }[]; ordersByStatus: { name: string; value: number }[]; ordersByArea: { name: string; value: number }[];
  recentOrders: Order[]; pendingKitchens: Kitchen[];
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch<D>('/admin/dashboard');
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const k = data.kpis;
  const revenueSeries = data.monthly.map((m) => ({ ...m, total: Number(m.platformRevenue) + Number(m.subscriptionRevenue) }));

  return (
    <div>
      <PageHeader title="Platform overview" subtitle="HomePlate · Coimbatore" actions={<Link to="/admin/reports" className="btn-outline">Reports</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Registered kitchens" value={k.totalKitchens} icon={Store} />
        <StatCard label="Active kitchens" value={k.activeKitchens} icon={BadgeCheck} tone="green" />
        <StatCard label="Pending approvals" value={k.pendingApprovals} icon={Store} tone="orange" hint={<Link to="/admin/verification" className="font-semibold text-saffron-600">Review now →</Link>} />
        <StatCard label="Total customers" value={k.totalCustomers} icon={Users} tone="blue" />
        <StatCard label="Total orders" value={k.totalOrders.toLocaleString('en-IN')} icon={ClipboardList} tone="purple" hint={`${k.activeOrders} live now`} />
        <StatCard label="Today's revenue" value={rupee(k.todayRevenue)} icon={IndianRupee} tone="green" hint={`GMV ${rupee(k.todayGmv)} · ${k.todayOrders} orders`} />
        <StatCard label="Monthly platform revenue" value={rupee(k.monthlyPlatformRevenue)} icon={Wallet} tone="yellow" hint="Commission + fees + subscriptions" />
        <StatCard label="Active subscriptions" value={k.activeSubscriptions} icon={CreditCard} tone="purple" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly orders" subtitle="Completed + live orders, last 6 months"><Bars data={data.monthly} x="month" series={[{ key: 'orders', name: 'Orders' }]} /></ChartCard>
        <ChartCard title="Platform revenue" subtitle="Commission & fees vs subscriptions">
          <AreaTrend data={revenueSeries} x="month" series={[{ key: 'platformRevenue', name: 'Commission + fees', money: true }, { key: 'subscriptionRevenue', name: 'Subscriptions', money: true, color: '#8B5CF6' }]} />
        </ChartCard>
        <ChartCard title="New kitchen registrations"><Bars data={data.monthly} x="month" series={[{ key: 'newKitchens', name: 'New kitchens', color: '#F07315' }]} height={220} /></ChartCard>
        <ChartCard title="Customer growth"><Lines data={data.monthly} x="month" series={[{ key: 'totalCustomers', name: 'Total customers', color: '#0EA5E9' }, { key: 'newCustomers', name: 'New', color: '#2E9455' }]} height={220} /></ChartCard>
        <ChartCard title="Subscription analytics" subtitle="Live & suspended kitchens by plan status"><Donut data={data.subscriptionBreakdown} height={200} /></ChartCard>
        <ChartCard title="Orders by kitchen area"><Bars data={data.ordersByArea} x="name" series={[{ key: 'value', name: 'Orders', color: '#14B8A6' }]} height={220} /></ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Recent orders</h3><Link to="/admin/orders" className="text-sm font-semibold text-brand-700">All orders</Link></div>
          <div className="divide-y divide-cream-100">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-20 font-semibold">{o.orderNumber}</span>
                <span className="min-w-0 flex-1 truncate">{o.customer.fullName} <span className="text-charcoal-400">→ {o.kitchen.name}</span></span>
                <span className="hidden text-xs text-charcoal-400 sm:inline">{timeAgo(o.createdAt)}</span>
                <span className="w-16 text-right font-semibold">{rupee(o.totalAmount)}</span>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold"><TrendingUp className="h-5 w-5 text-saffron-500" />Awaiting verification</h3>
          {data.pendingKitchens.length === 0 && <p className="text-sm text-charcoal-400">All caught up!</p>}
          <div className="space-y-2">
            {data.pendingKitchens.map((kt) => (
              <Link key={kt.id} to={`/admin/kitchens/${kt.id}`} className="flex items-center gap-3 rounded-xl border border-cream-200 p-3 hover:border-brand-300">
                <img src={kt.coverImage} alt="" className="h-11 w-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{kt.name}</p><p className="text-xs text-charcoal-400">{kt.owner.fullName} · {kt.area} · {timeAgo(kt.submittedAt)}</p></div>
                <StatusBadge status={kt.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
