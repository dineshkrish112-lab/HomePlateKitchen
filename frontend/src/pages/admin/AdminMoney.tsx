import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgePercent, CreditCard, Download, IndianRupee, Pencil, Plus, Receipt, Tag, Trash2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../api/client';
import { useFetch } from '../../components/useFetch';
import type { Offer, PlatformSettings, Subscription, SubscriptionPlan } from '../../types';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { AreaTrend, Bars, ChartCard } from '../../components/Charts';
import { ConfirmDialog, EmptyState, ErrorState, Field, Modal, PageHeader, PageLoader, Spinner, StatCard, Tabs, Toggle, cx } from '../../components/ui';
import { addDaysISO, downloadCsv, fmtDate, rupee, todayISO } from '../../utils/format';

// ---------------------------------------------------------------- subscriptions
export function SubscriptionsAdmin() {
  const { data, loading, error, reload } = useFetch<{ subscriptions: Subscription[]; plans: SubscriptionPlan[]; settings: PlatformSettings }>('/admin/subscriptions');
  const [tab, setTab] = useState<'subs' | 'plans'>('subs');
  const [edit, setEdit] = useState<Partial<SubscriptionPlan> | null>(null);
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const today = new Date();
  const save = async () => {
    if (!edit) return;
    try { if (edit.id) await api.put(`/admin/plans/${edit.id}`, edit); else await api.post('/admin/plans', edit); toast.success('Plan saved'); setEdit(null); reload(true); }
    catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div>
      <PageHeader title="Subscriptions" subtitle={`Free trial: ${data.settings.freeTrialDays} days · Commission: ${data.settings.commissionPercent}% per order`}
        actions={<Link to="/admin/settings" className="btn-outline">Configure rules</Link>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'subs', label: 'Kitchen subscriptions', count: data.subscriptions.length }, { value: 'plans', label: 'Plans', count: data.plans.length }]} />
      {tab === 'subs' ? (
        <DataTable rows={data.subscriptions} searchText={(s) => `${s.kitchen.name} ${s.planName} ${s.paymentReference}`} columns={[
          { key: 'k', header: 'Kitchen', render: (s) => <b>{s.kitchen.name}</b> },
          { key: 'p', header: 'Plan', render: (s) => s.planName },
          { key: 'a', header: 'Amount', render: (s) => (s.amount > 0 ? rupee(s.amount) : 'Free') },
          { key: 'd', header: 'Period', render: (s) => `${fmtDate(s.startDate)} – ${fmtDate(s.endDate)}` },
          { key: 'r', header: 'Payment ref', render: (s) => <span className="font-mono text-xs">{s.paymentReference ?? '—'}</span> },
          { key: 's', header: 'Status', render: (s) => <StatusBadge status={new Date(s.endDate) < today ? 'EXPIRED' : s.status} /> },
        ]} />
      ) : (
        <>
          <div className="mb-4 flex justify-end"><button className="btn-primary" onClick={() => setEdit({ name: '', price: 499, durationDays: 30, description: '', features: '', active: true, popular: false })}><Plus className="h-4 w-4" />New plan</button></div>
          <div className="grid gap-4 md:grid-cols-3">
            {data.plans.map((p) => (
              <div key={p.id} className={cx('card p-5', !p.active && 'opacity-60')}>
                <div className="flex items-center justify-between"><p className="font-semibold">{p.name}</p><div className="flex gap-1">{p.popular && <StatusBadge status="SELECTED" />}{!p.active && <StatusBadge status="CLOSED" />}</div></div>
                <p className="mt-2 text-3xl font-bold">{rupee(p.price)}</p><p className="text-xs text-charcoal-400">{p.durationDays} days</p>
                <p className="mt-2 text-sm text-charcoal-500">{p.description}</p>
                <ul className="mt-3 list-disc pl-5 text-xs text-charcoal-600">{(p.features ?? '').split('|').filter(Boolean).map((f) => <li key={f}>{f}</li>)}</ul>
                <button className="btn-outline mt-4 w-full" onClick={() => setEdit(p)}><Pencil className="h-4 w-4" />Edit</button>
              </div>
            ))}
          </div>
        </>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit plan' : 'New plan'} footer={<><button className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save plan</button></>}>
        {edit && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Price (₹)"><input className="input" type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></Field>
          <Field label="Duration (days)"><input className="input" type="number" value={edit.durationDays} onChange={(e) => setEdit({ ...edit, durationDays: Number(e.target.value) })} /></Field>
          <Field label="Description"><input className="input" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          <Field label="Features (one per line)" className="sm:col-span-2"><textarea className="input min-h-[90px]" value={(edit.features ?? '').split('|').join('\n')} onChange={(e) => setEdit({ ...edit, features: e.target.value.split('\n').join('|') })} /></Field>
          <Toggle checked={!!edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Active" />
          <Toggle checked={!!edit.popular} onChange={(v) => setEdit({ ...edit, popular: v })} label="Highlight as popular" />
        </div>}
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------- revenue
interface Rev { gmv: number; commission: number; platformFees: number; discounts: number; subscriptionRevenue: number; totalPlatformRevenue: number; monthlyRevenue: number;
  monthly: { month: string; gmv: number; commission: number; platformRevenue: number; subscriptionRevenue: number; orders: number }[];
  expiringSoon: Record<string, string>[]; expired: Record<string, string>[];
  perKitchen: { kitchenId: number; kitchenName: string; area: string; orders: number; gmv: number; commission: number; kitchenEarnings: number }[]; }

export function RevenuePage() {
  const { data, loading, error, reload } = useFetch<Rev>('/admin/revenue');
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  return (
    <div>
      <PageHeader title="Revenue & commission" subtitle="Hybrid model: kitchen subscriptions + commission per order + small platform fee" actions={<Link to="/admin/settings" className="btn-outline">Commission settings</Link>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total platform revenue" value={rupee(data.totalPlatformRevenue)} icon={Wallet} />
        <StatCard label="This month (orders)" value={rupee(data.monthlyRevenue)} icon={IndianRupee} tone="blue" />
        <StatCard label="Subscription revenue" value={rupee(data.subscriptionRevenue)} icon={CreditCard} tone="purple" />
        <StatCard label="Commission earned" value={rupee(data.commission)} icon={BadgePercent} tone="orange" />
        <StatCard label="Platform fees" value={rupee(data.platformFees)} icon={Receipt} tone="yellow" />
        <StatCard label="Gross order value" value={rupee(data.gmv)} icon={IndianRupee} tone="green" hint={`Discounts given ${rupee(data.discounts)}`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly platform revenue" subtitle="Last 12 months"><Bars stacked data={data.monthly} x="month" series={[{ key: 'commission', name: 'Commission', money: true }, { key: 'subscriptionRevenue', name: 'Subscriptions', money: true, color: '#8B5CF6' }]} /></ChartCard>
        <ChartCard title="Gross order value (GMV)"><AreaTrend data={data.monthly} x="month" series={[{ key: 'gmv', name: 'GMV', money: true, color: '#F07315' }]} /></ChartCard>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {[{ title: 'Expiring in 10 days (outstanding)', rows: data.expiringSoon }, { title: 'Expired subscriptions', rows: data.expired }].map((b) => (
          <div key={b.title} className="card p-5">
            <h3 className="mb-3 font-semibold">{b.title}</h3>
            {b.rows.length === 0 ? <p className="text-sm text-charcoal-400">None</p> : (
              <div className="divide-y divide-cream-100">{b.rows.map((r) => (
                <div key={r.kitchenId} className="flex items-center justify-between py-2 text-sm"><div><Link to={`/admin/kitchens/${r.kitchenId}`} className="font-semibold hover:text-brand-700">{r.kitchenName}</Link><p className="text-xs text-charcoal-400">{r.ownerName} · {r.phone}</p></div><div className="text-right"><p>{r.planName}</p><p className="text-xs text-charcoal-400">ends {fmtDate(r.endDate)}</p></div></div>
              ))}</div>
            )}
          </div>
        ))}
      </div>
      <h3 className="mb-3 mt-8 font-semibold">Revenue by kitchen</h3>
      <DataTable rows={data.perKitchen} searchText={(r) => `${r.kitchenName} ${r.area}`} columns={[
        { key: 'k', header: 'Kitchen', render: (r) => <b>{r.kitchenName}</b> }, { key: 'a', header: 'Area', render: (r) => r.area },
        { key: 'o', header: 'Orders', render: (r) => r.orders }, { key: 'g', header: 'GMV', render: (r) => rupee(r.gmv) },
        { key: 'c', header: 'Commission', render: (r) => rupee(r.commission) }, { key: 'e', header: 'Kitchen earnings', render: (r) => rupee(r.kitchenEarnings) },
      ]} />
    </div>
  );
}

// ---------------------------------------------------------------- offers
export function OffersPage() {
  const { data, loading, error, reload } = useFetch<Offer[]>('/admin/offers');
  const [edit, setEdit] = useState<Partial<Offer> | null>(null);
  const [del, setDel] = useState<Offer | null>(null);
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const save = async () => {
    if (!edit) return;
    try { if (edit.id) await api.put(`/admin/offers/${edit.id}`, edit); else await api.post('/admin/offers', edit); toast.success('Offer saved'); setEdit(null); reload(true); }
    catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div>
      <PageHeader title="Offers & coupons" subtitle="Discounts are funded by the platform — kitchen earnings are not affected."
        actions={<button className="btn-primary" onClick={() => setEdit({ code: '', description: '', discountPercent: 10, maxDiscount: 50, minOrder: 150, validTill: addDaysISO(30), active: true })}><Plus className="h-4 w-4" />New coupon</button>} />
      {data.length === 0 ? <EmptyState icon={Tag} title="No coupons yet" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((o) => (
            <div key={o.id} className={cx('card relative overflow-hidden p-5', !o.active && 'opacity-60')}>
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-saffron-50" />
              <p className="relative font-mono text-lg font-bold tracking-wider text-saffron-600">{o.code}</p>
              <p className="text-sm text-charcoal-600">{o.description}</p>
              <p className="mt-3 text-2xl font-bold">{o.discountPercent}% <span className="text-sm font-normal text-charcoal-400">up to {rupee(o.maxDiscount)}</span></p>
              <p className="text-xs text-charcoal-400">Min order {rupee(o.minOrder)} · valid till {fmtDate(o.validTill)} · used {o.usageCount}×</p>
              <div className="mt-4 flex gap-2"><button className="btn-outline flex-1 py-2" onClick={() => setEdit(o)}><Pencil className="h-4 w-4" />Edit</button><button className="btn-outline py-2 text-red-600" onClick={() => setDel(o)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button></div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit coupon' : 'New coupon'} footer={<><button className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary" onClick={save}>Save</button></>}>
        {edit && <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code"><input className="input uppercase" disabled={!!edit.id} value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} /></Field>
          <Field label="Discount %"><input className="input" type="number" value={edit.discountPercent} onChange={(e) => setEdit({ ...edit, discountPercent: Number(e.target.value) })} /></Field>
          <Field label="Max discount (₹)"><input className="input" type="number" value={edit.maxDiscount} onChange={(e) => setEdit({ ...edit, maxDiscount: Number(e.target.value) })} /></Field>
          <Field label="Min order (₹)"><input className="input" type="number" value={edit.minOrder} onChange={(e) => setEdit({ ...edit, minOrder: Number(e.target.value) })} /></Field>
          <Field label="Valid till"><input className="input" type="date" value={edit.validTill ?? ''} onChange={(e) => setEdit({ ...edit, validTill: e.target.value })} /></Field>
          <div className="flex items-end pb-2"><Toggle checked={!!edit.active} onChange={(v) => setEdit({ ...edit, active: v })} label="Active" /></div>
          <Field label="Description" className="sm:col-span-2"><input className="input" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
        </div>}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} tone="danger" title={`Delete ${del?.code}?`} confirmLabel="Delete" message="Customers will no longer be able to use this coupon."
        onConfirm={async () => { try { await api.delete(`/admin/offers/${del!.id}`); toast.success('Deleted'); setDel(null); reload(true); } catch (e) { toast.error(errMsg(e)); } }} />
    </div>
  );
}

// ---------------------------------------------------------------- reports
const TYPES = [
  { v: 'orders', label: 'Orders' }, { v: 'kitchens', label: 'Kitchens' }, { v: 'customers', label: 'Customers' },
  { v: 'earnings', label: 'Earnings' }, { v: 'subscriptions', label: 'Subscriptions' }, { v: 'requests', label: 'Custom requests' },
];
export function ReportsPage() {
  const [type, setType] = useState('orders');
  const [range, setRange] = useState('month');
  const [from, setFrom] = useState(addDaysISO(-29));
  const [to, setTo] = useState(todayISO());
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [busy, setBusy] = useState(false);

  const preset = (r: string) => {
    setRange(r);
    if (r === 'today') { setFrom(todayISO()); setTo(todayISO()); }
    if (r === 'week') { setFrom(addDaysISO(-6)); setTo(todayISO()); }
    if (r === 'month') { const d = new Date(); setFrom(new Date(d.getFullYear(), d.getMonth(), 1, 12).toISOString().slice(0, 10)); setTo(todayISO()); }
    if (r === 'all') { setFrom('2020-01-01'); setTo(todayISO()); }
  };
  const run = async () => {
    setBusy(true);
    try { const { data } = await api.get('/admin/reports', { params: { type, from, to } }); setRows(data); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const cols = rows && rows.length ? Object.keys(rows[0]) : [];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate export-ready reports for any date range" />
      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap gap-2">{TYPES.map((t) => <button key={t.v} onClick={() => { setType(t.v); setRows(null); }} className={cx('chip', type === t.v && 'chip-active')}>{t.label}</button>)}</div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-1.5">{[['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['all', 'All time'], ['custom', 'Custom range']].map(([v, l]) => (
            <button key={v} onClick={() => preset(v)} className={cx('chip py-1.5 text-xs', range === v && 'chip-active')}>{l}</button>))}</div>
          <Field label="From"><input type="date" className="input py-2" value={from} onChange={(e) => { setFrom(e.target.value); setRange('custom'); }} /></Field>
          <Field label="To"><input type="date" className="input py-2" value={to} onChange={(e) => { setTo(e.target.value); setRange('custom'); }} /></Field>
          <button className="btn-primary" onClick={run} disabled={busy}>{busy && <Spinner className="h-4 w-4 text-white" />}Generate</button>
          {rows && rows.length > 0 && <button className="btn-accent" onClick={() => downloadCsv(`homeplate-${type}-${from}-to-${to}.csv`, rows)}><Download className="h-4 w-4" />Export CSV (Excel)</button>}
        </div>
      </div>
      {rows && (
        <div className="mt-6">
          {rows.length === 0 ? <EmptyState title="No records in this range" /> : (
            <DataTable rows={rows} pageSize={15} searchText={(r) => Object.values(r).join(' ')}
              columns={cols.map((c) => ({ key: c, header: c, render: (r: Record<string, unknown>) => (c === 'Status' ? <StatusBadge status={String(r[c])} /> : String(r[c] ?? '—')) }))} />
          )}
        </div>
      )}
    </div>
  );
}
