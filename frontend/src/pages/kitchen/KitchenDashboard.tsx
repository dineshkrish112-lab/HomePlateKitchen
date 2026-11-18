import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ChefHat, Clock, CreditCard, IndianRupee, ListChecks, Rocket, ShoppingBag, Star, Store, TrendingUp, Video, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../components/useFetch';
import { api, errMsg } from '../../api/client';
import type { CookingVideo, CustomRequest, Kitchen, Order, Subscription } from '../../types';
import { AreaTrend, Bars, ChartCard } from '../../components/Charts';
import StatusBadge from '../../components/StatusBadge';
import { ErrorState, PageHeader, PageLoader, Spinner, StatCard } from '../../components/ui';
import { fmtDate, mealLabel, rupee, timeAgo } from '../../utils/format';

interface Dash {
  kpis: { todayOrders: number; pendingOrders: number; completedOrders: number; todayEarnings: number; monthlyEarnings: number; rating: number; ratingCount: number };
  weekly: { day: string; earnings: number; orders: number }[]; monthly: { month: string; earnings: number; orders: number }[];
  recentOrders: Order[]; activeOrders: Order[]; openRequests: { request: CustomRequest; customerName: string; distanceKm: number; myQuote: unknown }[];
  kitchen: Kitchen; subscription: { current: Subscription | null; valid: boolean; daysLeft: number };
  todayVideo: CookingVideo | null; lastVideo: CookingVideo | null;
}

function StatusScreen({ kitchen }: { kitchen: Kitchen }) {
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const activate = async () => {
    setBusy(true);
    try { await api.post('/kitchen/activate'); await refresh(); toast.success('Your kitchen is live! 30-day free trial started.'); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const steps = [
    { label: 'Registered', done: true }, { label: 'Submitted', done: kitchen.status !== 'PENDING' },
    { label: 'Under review', done: ['APPROVED', 'ACTIVE'].includes(kitchen.status) }, { label: 'Approved', done: ['APPROVED', 'ACTIVE'].includes(kitchen.status) },
    { label: 'Active', done: kitchen.status === 'ACTIVE' },
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <div className="card overflow-hidden">
        <img src={kitchen.coverImage || '/images/fresh-vegetables.jpg'} alt="" className="h-48 w-full object-cover" />
        <div className="p-8 text-center">
          <h1 className="font-display text-3xl font-semibold">{kitchen.name}</h1>
          <div className="mx-auto mt-6 flex max-w-xl items-center">
            {steps.map((s, i) => (
              <div key={s.label} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <span className={`h-0.5 flex-1 ${i === 0 ? 'invisible' : s.done ? 'bg-brand-500' : 'bg-cream-300'}`} />
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${s.done ? 'bg-brand-600 text-white' : 'bg-cream-200 text-charcoal-400'}`}>{s.done ? <CheckCircle2 className="h-5 w-5" /> : i + 1}</span>
                  <span className={`h-0.5 flex-1 ${i === steps.length - 1 ? 'invisible' : steps[i + 1].done ? 'bg-brand-500' : 'bg-cream-300'}`} />
                </div>
                <span className="mt-2 text-[11px] font-semibold text-charcoal-500">{s.label}</span>
              </div>
            ))}
          </div>
          {kitchen.status === 'UNDER_REVIEW' && <><Clock className="mx-auto mt-8 h-10 w-10 text-amber-500" /><p className="mt-3 text-lg font-semibold">Your application is under review</p>
            <p className="mt-1 text-sm text-charcoal-500">Submitted {timeAgo(kitchen.submittedAt)}. Our team verifies your identity, FSSAI details and kitchen photos — usually within 48 hours. Meanwhile, prepare your menu.</p>
            <Link to="/kitchen/menu" className="btn-primary mt-5">Prepare my menu</Link></>}
          {kitchen.status === 'APPROVED' && <><Rocket className="mx-auto mt-8 h-10 w-10 text-brand-600" /><p className="mt-3 text-lg font-semibold">Congratulations, you're approved!</p>
            <p className="mt-1 text-sm text-charcoal-500">Activate your kitchen to go live for customers. Your 30-day free trial starts today.</p>
            <button className="btn-accent mt-5 px-8 py-3" onClick={activate} disabled={busy}>{busy && <Spinner className="h-4 w-4 text-white" />}Activate kitchen & start free trial</button></>}
          {['PENDING', 'DOCS_REQUESTED', 'REJECTED'].includes(kitchen.status) && <><Store className="mx-auto mt-8 h-10 w-10 text-saffron-500" />
            <p className="mt-3 text-lg font-semibold">{kitchen.status === 'PENDING' ? 'Complete your onboarding' : 'Action needed on your application'}</p>
            {kitchen.adminRemarks && <p className="mx-auto mt-2 max-w-md rounded-xl bg-saffron-50 p-3 text-sm text-saffron-800">{kitchen.adminRemarks}</p>}
            <Link to="/kitchen/onboarding" className="btn-primary mt-5">Continue onboarding <ArrowRight className="h-4 w-4" /></Link></>}
          {kitchen.status === 'SUSPENDED' && <p className="mt-8 text-sm text-red-600">Your kitchen is suspended. {kitchen.adminRemarks}</p>}
        </div>
      </div>
    </div>
  );
}

export default function KitchenDashboard() {
  const { kitchen, user } = useAuth();
  const active = kitchen?.status === 'ACTIVE';
  const { data, loading, error, reload } = useFetch<Dash>(active ? '/kitchen/dashboard' : null, [active]);

  if (!kitchen) return <PageLoader />;
  if (!active) return <StatusScreen kitchen={kitchen} />;
  if (loading || !data) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />;
  const k = data.kpis;
  const sub = data.subscription;

  return (
    <div>
      <PageHeader title={`Vanakkam, ${user?.fullName.split(' ')[0]} 👋`} subtitle={`Here's what's cooking at ${kitchen.name} today.`}
        actions={<><Link to="/kitchen/menu" className="btn-outline">Update today's menu</Link><Link to="/kitchen/orders" className="btn-primary">Manage orders</Link></>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Today's orders" value={k.todayOrders} icon={ShoppingBag} />
        <StatCard label="Pending" value={k.pendingOrders} icon={ListChecks} tone="orange" />
        <StatCard label="Completed today" value={k.completedOrders} icon={CheckCircle2} tone="blue" />
        <StatCard label="Today's earnings" value={rupee(k.todayEarnings)} icon={IndianRupee} tone="green" />
        <StatCard label="This month" value={rupee(k.monthlyEarnings)} icon={Wallet} tone="purple" />
        <StatCard label="Rating" value={<span className="flex items-center gap-1">{k.rating?.toFixed(1)}<Star className="h-5 w-5 fill-amber-400 text-amber-400" /></span>} icon={Star} tone="yellow" hint={`${k.ratingCount} reviews`} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <span className="rounded-xl bg-brand-50 p-3"><Store className="h-6 w-6 text-brand-600" /></span>
          <div className="flex-1"><p className="text-xs font-semibold uppercase text-charcoal-400">Kitchen status</p><p className="font-semibold">{kitchen.acceptingOrders ? 'Live · accepting orders' : 'Live · orders paused'}</p></div>
          <StatusBadge status={kitchen.status} />
        </div>
        <Link to="/kitchen/subscription" className="card flex items-center gap-4 p-5 hover:shadow-lift">
          <span className="rounded-xl bg-violet-50 p-3"><CreditCard className="h-6 w-6 text-violet-600" /></span>
          <div className="flex-1"><p className="text-xs font-semibold uppercase text-charcoal-400">Subscription</p><p className="font-semibold">{sub.current?.planName ?? 'None'} · {sub.daysLeft} days left</p><p className="text-xs text-charcoal-400">Ends {fmtDate(sub.current?.endDate)}</p></div>
          <StatusBadge status={sub.valid ? sub.current?.status : 'EXPIRED'} />
        </Link>
        <Link to="/kitchen/videos" className="card flex items-center gap-4 p-5 hover:shadow-lift">
          <span className="rounded-xl bg-saffron-50 p-3"><Video className="h-6 w-6 text-saffron-600" /></span>
          <div className="flex-1"><p className="text-xs font-semibold uppercase text-charcoal-400">Today's cooking video</p><p className="font-semibold">{data.todayVideo ? 'Submitted' : 'Not uploaded yet'}</p><p className="text-xs text-charcoal-400">{data.todayVideo ? fmtDate(data.todayVideo.preparationDate) : 'Upload to keep your trust badge'}</p></div>
          {data.todayVideo ? <StatusBadge status={data.todayVideo.status} /> : <span className="text-xs font-semibold text-saffron-600">Upload →</span>}
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Weekly earnings" subtitle="Last 7 days (net of commission)"><AreaTrend data={data.weekly} x="day" series={[{ key: 'earnings', name: 'Earnings', money: true }]} /></ChartCard>
        <ChartCard title="Monthly revenue" subtitle="Last 6 months"><Bars data={data.monthly} x="month" series={[{ key: 'earnings', name: 'Earnings', money: true, color: '#F07315' }]} /></ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold">Recent orders</h3><Link to="/kitchen/orders" className="text-sm font-semibold text-brand-700">View all</Link></div>
          <div className="divide-y divide-cream-100">
            {data.recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{o.customer.fullName} <span className="font-normal text-charcoal-400">· {o.orderNumber}</span></p>
                  <p className="truncate text-xs text-charcoal-500">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p></div>
                <span className="text-xs text-charcoal-400">{timeAgo(o.createdAt)}</span>
                <span className="w-16 text-right text-sm font-semibold">{rupee(o.kitchenEarning)}</span>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold"><ChefHat className="h-5 w-5 text-saffron-500" />Custom food requests</h3><Link to="/kitchen/requests" className="text-sm font-semibold text-brand-700">Open</Link></div>
          {data.openRequests.length === 0 && <p className="text-sm text-charcoal-400">No open requests near you right now.</p>}
          <div className="space-y-3">
            {data.openRequests.map((r) => (
              <Link to="/kitchen/requests" key={r.request.id} className="block rounded-xl border border-cream-200 p-3 hover:border-brand-300">
                <div className="flex items-center justify-between"><p className="text-sm font-semibold">{r.request.dishName}</p>{r.myQuote ? <StatusBadge status="SUBMITTED" /> : <span className="text-xs font-bold text-saffron-600">Quote now</span>}</div>
                <p className="text-xs text-charcoal-500">{r.request.quantity} · {mealLabel[r.request.mealSlot]} {fmtDate(r.request.requiredDate)} · {r.distanceKm} km · {r.customerName}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-xs text-brand-800"><TrendingUp className="h-4 w-4" />Kitchens that quote within 30 minutes win 3× more requests.</div>
        </div>
      </div>
    </div>
  );
}
