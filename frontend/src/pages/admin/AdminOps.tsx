import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../api/client';
import { useFetch } from '../../components/useFetch';
import type { CookingVideo, CustomRequest, Order, Quotation } from '../../types';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import VideoCard from '../../components/VideoCard';
import { EmptyState, ErrorState, Modal, PageHeader, PageLoader, Tabs, Toggle, VegMark } from '../../components/ui';
import { downloadCsv, fmtDate, fmtDateTime, mealLabel, rupee } from '../../utils/format';

export function OrdersAdmin() {
  const { data, loading, error, reload } = useFetch<Order[]>('/admin/orders');
  const [status, setStatus] = useState('ALL');
  const [sel, setSel] = useState<Order | null>(null);
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const groups: Record<string, string[]> = { LIVE: ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'], DELIVERED: ['DELIVERED'], CANCELLED: ['CANCELLED', 'REJECTED'], PAYMENT_PENDING: ['PAYMENT_PENDING'] };
  const rows = data.filter((o) => status === 'ALL' || groups[status].includes(o.status));
  return (
    <div>
      <PageHeader title="Orders" subtitle="All orders across the platform" actions={<button className="btn-outline" onClick={() => downloadCsv('orders.csv', rows.map((o) => ({ order: o.orderNumber, date: o.createdAt, customer: o.customer.fullName, kitchen: o.kitchen.name, total: o.totalAmount, commission: o.commission, status: o.status })))}>Export CSV</button>} />
      <Tabs value={status} onChange={setStatus} tabs={[{ value: 'ALL', label: 'All', count: data.length }, ...Object.keys(groups).map((g) => ({ value: g, label: g.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()), count: data.filter((o) => groups[g].includes(o.status)).length }))]} />
      <DataTable rows={rows} onRowClick={setSel} searchText={(o) => `${o.orderNumber} ${o.customer.fullName} ${o.kitchen.name} ${o.deliveryArea}`} columns={[
        { key: 'n', header: 'Order', render: (o) => <><b>{o.orderNumber}</b>{o.orderType === 'CUSTOM_REQUEST' && <span className="ml-1 text-[10px] font-bold text-saffron-600">CUSTOM</span>}<p className="text-xs text-charcoal-400">{fmtDateTime(o.createdAt)}</p></> },
        { key: 'c', header: 'Customer', render: (o) => o.customer.fullName },
        { key: 'k', header: 'Kitchen', render: (o) => o.kitchen.name },
        { key: 'a', header: 'Area', render: (o) => o.deliveryArea ?? '—' },
        { key: 't', header: 'Total', render: (o) => rupee(o.totalAmount) },
        { key: 'cm', header: 'Commission', render: (o) => rupee(o.commission, 2) },
        { key: 'p', header: 'Payment', render: (o) => <StatusBadge status={o.paymentStatus} /> },
        { key: 's', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
      ]} />
      <Modal open={!!sel} onClose={() => setSel(null)} title={`Order ${sel?.orderNumber}`}>
        {sel && <div className="space-y-3 text-sm">
          <div className="flex justify-between"><StatusBadge status={sel.status} /><span>{fmtDateTime(sel.createdAt)}</span></div>
          <p><b>{sel.customer.fullName}</b> ({sel.customer.phone}) ← <b>{sel.kitchen.name}</b></p>
          <p className="text-charcoal-500">{sel.deliveryAddress}</p>
          <ul className="rounded-xl bg-cream-50 p-3">{sel.items.map((i) => <li key={i.id} className="flex justify-between"><span>{i.quantity}× {i.name}</span><span>{rupee(i.lineTotal)}</span></li>)}</ul>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span>Food {rupee(sel.foodTotal, 2)}</span><span>Delivery {rupee(sel.deliveryCharge, 2)}</span><span>Platform fee {rupee(sel.platformFee, 2)}</span><span>Discount {rupee(sel.discount, 2)}</span>
            <span>Commission {rupee(sel.commission, 2)}</span><span>Kitchen earning {rupee(sel.kitchenEarning, 2)}</span>
          </div>
          <p className="font-bold">Total {rupee(sel.totalAmount, 2)} · {sel.paymentMethod} {sel.paymentReference && `· ${sel.paymentReference}`}</p>
          {sel.cancelReason && <p className="text-red-600">Reason: {sel.cancelReason}</p>}
        </div>}
      </Modal>
    </div>
  );
}

interface RRow { request: CustomRequest; quotations: Quotation[]; }
export function CustomRequestsAdmin() {
  const { data, loading, error, reload } = useFetch<RRow[]>('/admin/custom-requests');
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  return (
    <div>
      <PageHeader title="Custom requests" subtitle="Customised homemade food requests and kitchen quotations" />
      <DataTable rows={data} searchText={(r) => `${r.request.requestNumber} ${r.request.dishName} ${r.request.customer?.fullName} ${r.request.deliveryArea}`} columns={[
        { key: 'n', header: 'Request', render: (r) => <><b>{r.request.requestNumber}</b><p className="text-xs text-charcoal-400">{fmtDateTime(r.request.createdAt)}</p></> },
        { key: 'd', header: 'Dish', render: (r) => <span className="flex items-center gap-1.5"><VegMark veg={r.request.veg} />{r.request.dishName} <span className="text-xs text-charcoal-400">({r.request.quantity})</span></span> },
        { key: 'c', header: 'Customer', render: (r) => r.request.customer?.fullName },
        { key: 'w', header: 'Required', render: (r) => `${mealLabel[r.request.mealSlot]} · ${fmtDate(r.request.requiredDate)}` },
        { key: 'a', header: 'Area', render: (r) => r.request.deliveryArea },
        { key: 'q', header: 'Quotes', render: (r) => { const q = r.quotations.filter((x) => x.status !== 'DECLINED'); return q.length ? <span title={q.map((x) => `${x.kitchen.name}: ₹${x.price}`).join('\n')}>{q.length} · from {rupee(Math.min(...q.map((x) => x.price)))}</span> : '—'; } },
        { key: 's', header: 'Status', render: (r) => <StatusBadge status={r.request.status} /> },
      ]} />
    </div>
  );
}

export function VideoReviews() {
  const { data, loading, error, reload } = useFetch<CookingVideo[]>('/admin/videos');
  const [tab, setTab] = useState('PENDING_REVIEW');
  const [sel, setSel] = useState<CookingVideo | null>(null);
  const [f, setF] = useState({ cleanlinessOk: true, storageOk: true, hygieneOk: true, remarks: '' });
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const rows = data.filter((v) => tab === 'ALL' || v.status === tab);
  const review = async (status: CookingVideo['status']) => {
    if (!sel) return;
    if (status !== 'APPROVED' && !f.remarks.trim()) return toast.error('Add a comment explaining what needs to change');
    try { await api.patch(`/admin/videos/${sel.id}/review`, { status, ...f }); toast.success('Review saved'); setSel(null); reload(true); }
    catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div>
      <PageHeader title="Cooking video reviews" subtitle="Check cleanliness, food storage, preparation environment and hygiene." />
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'PENDING_REVIEW', label: 'Pending review', count: data.filter((v) => v.status === 'PENDING_REVIEW').length },
        { value: 'APPROVED', label: 'Approved' }, { value: 'RESUBMISSION_REQUIRED', label: 'Resubmission' }, { value: 'REJECTED', label: 'Rejected' }, { value: 'ALL', label: 'History', count: data.length }]} />
      {rows.length === 0 ? <EmptyState title="Nothing to review" /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((v) => (
            <VideoCard key={v.id} v={v} showKitchen footer={
              <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3 text-xs">
                <Link to={`/admin/kitchens/${v.kitchen.id}`} className="font-semibold text-brand-700">Kitchen details</Link>
                {v.status === 'PENDING_REVIEW' ? <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => { setSel(v); setF({ cleanlinessOk: true, storageOk: true, hygieneOk: true, remarks: '' }); }}>Review</button>
                  : <span className="text-charcoal-400">by {v.reviewedBy ?? '—'} · {fmtDate(v.reviewedAt)}</span>}
              </div>} />
          ))}
        </div>
      )}
      <Modal open={!!sel} onClose={() => setSel(null)} title={`Review · ${sel?.kitchen.name}`} size="lg"
        footer={<><button className="btn-outline text-red-600" onClick={() => review('REJECTED')}>Reject</button><button className="btn-outline" onClick={() => review('RESUBMISSION_REQUIRED')}>Ask to resubmit</button><button className="btn-primary" onClick={() => review('APPROVED')}>Approve</button></>}>
        {sel && <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
          <div>{sel.videoUrl ? <video src={sel.videoUrl} controls className="aspect-video w-full rounded-xl bg-black" /> : <div className="relative"><img src={sel.thumbnailUrl} alt="" className="aspect-video w-full rounded-xl object-cover" /><span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">Demo record — no video file attached</span></div>}
            <p className="mt-2 text-sm text-charcoal-600">{sel.description}</p><p className="text-xs text-charcoal-400">Prepared {fmtDate(sel.preparationDate)} · submitted {fmtDateTime(sel.createdAt)}</p></div>
          <div className="space-y-3">
            <p className="label">Hygiene checklist</p>
            <Toggle checked={f.cleanlinessOk} onChange={(v) => setF({ ...f, cleanlinessOk: v })} label="Kitchen & utensils clean" />
            <Toggle checked={f.storageOk} onChange={(v) => setF({ ...f, storageOk: v })} label="Proper food storage" />
            <Toggle checked={f.hygieneOk} onChange={(v) => setF({ ...f, hygieneOk: v })} label="Personal hygiene followed" />
            <textarea className="input min-h-[100px]" value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} placeholder="Review comments for the kitchen owner" />
          </div>
        </div>}
      </Modal>
    </div>
  );
}
