import { useState } from 'react';
import { Check, Crown, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../api/client';
import { useFetch } from '../../components/useFetch';
import type { PaymentMethod, Subscription, SubscriptionPlan } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import DataTable from '../../components/DataTable';
import { ErrorState, PageHeader, PageLoader, cx } from '../../components/ui';
import { fmtDate, rupee } from '../../utils/format';
import PaymentModal from '../customer/PaymentModal';

interface S { current: Subscription | null; valid: boolean; daysLeft: number; history: Subscription[]; trial: Subscription | null; plans: SubscriptionPlan[]; }

export default function SubscriptionPage() {
  const { data, loading, error, reload } = useFetch<S>('/kitchen/subscription');
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const cur = data.current;
  const pct = cur ? Math.max(0, Math.min(100, (data.daysLeft / Math.max(1, (new Date(cur.endDate).getTime() - new Date(cur.startDate).getTime()) / 86400000)) * 100)) : 0;

  const pay = async (method: PaymentMethod) => {
    if (!plan) return;
    try {
      await api.post('/kitchen/subscription', { planId: plan.id, paymentMethod: method });
      toast.success(`${plan.name} plan activated!`);
      setPlan(null); reload(true);
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Subscription" subtitle="First month free. Then a simple monthly or annual plan + a small commission per order." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card relative overflow-hidden p-6 lg:col-span-1">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-50" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase text-charcoal-400">Current plan</p>
            <div className="mt-1 flex items-center gap-2"><p className="text-2xl font-bold">{cur?.planName ?? 'No plan'}</p><StatusBadge status={data.valid ? cur?.status : 'EXPIRED'} /></div>
            <p className="mt-1 text-sm text-charcoal-500">{fmtDate(cur?.startDate)} → {fmtDate(cur?.endDate)}</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-cream-200"><div className={cx('h-full rounded-full', data.daysLeft <= 5 ? 'bg-red-500' : 'bg-brand-500')} style={{ width: `${pct}%` }} /></div>
            <p className="mt-2 text-sm"><b>{Math.max(0, data.daysLeft)} days</b> left · renews {fmtDate(cur?.endDate)}</p>
            {data.trial && <div className="mt-5 flex gap-3 rounded-xl bg-violet-50 p-3 text-sm text-violet-800"><Gift className="h-5 w-5 shrink-0" />Free trial: {fmtDate(data.trial.startDate)} – {fmtDate(data.trial.endDate)}</div>}
            {data.daysLeft <= 7 && <p className="mt-3 text-sm font-semibold text-saffron-600">Renew soon to stay visible to customers.</p>}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
          {data.plans.map((p) => (
            <div key={p.id} className={cx('card relative flex flex-col p-5', p.popular && 'ring-2 ring-saffron-400')}>
              {p.popular && <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-saffron-500 px-3 py-1 text-xs font-bold text-white"><Crown className="h-3 w-3" />Popular</span>}
              <p className="font-semibold">{p.name}</p>
              <p className="mt-2 text-3xl font-bold">{rupee(p.price)}</p>
              <p className="text-xs text-charcoal-400">for {p.durationDays} days · {rupee(Math.round(p.price / (p.durationDays / 30)))}/month</p>
              <p className="mt-2 text-xs text-charcoal-500">{p.description}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">{(p.features ?? '').split('|').filter(Boolean).map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />{f}</li>)}</ul>
              <button className={cx('mt-5 w-full', p.popular ? 'btn-accent' : 'btn-outline')} onClick={() => setPlan(p)}>{data.valid ? 'Renew / extend' : 'Subscribe'}</button>
            </div>
          ))}
        </div>
      </div>
      <h3 className="mb-3 mt-8 font-semibold">Subscription & payment history</h3>
      <DataTable rows={data.history} columns={[
        { key: 'p', header: 'Plan', render: (s) => <b>{s.planName}</b> },
        { key: 'per', header: 'Period', render: (s) => `${fmtDate(s.startDate)} – ${fmtDate(s.endDate)}` },
        { key: 'a', header: 'Amount', render: (s) => (s.amount > 0 ? rupee(s.amount) : 'Free') },
        { key: 'm', header: 'Payment', render: (s) => s.paymentReference ? `${s.paymentMethod} · ${s.paymentReference}` : '—' },
        { key: 's', header: 'Status', render: (s) => <StatusBadge status={new Date(s.endDate) < new Date() ? 'EXPIRED' : s.status} /> },
      ]} />
      <PaymentModal open={!!plan} amount={plan?.price ?? 0} allowCod={false} onClose={() => setPlan(null)} onPay={pay} />
    </div>
  );
}
