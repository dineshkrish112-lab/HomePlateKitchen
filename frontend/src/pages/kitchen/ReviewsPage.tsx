import { useState } from 'react';
import { MessageSquareQuote, Reply } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../api/client';
import { useFetch } from '../../components/useFetch';
import type { Complaint, Review } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import { Avatar, EmptyState, ErrorState, PageHeader, PageLoader, Stars, Tabs } from '../../components/ui';
import { fmtDate, timeAgo } from '../../utils/format';

export default function ReviewsPage() {
  const { data, loading, error, reload } = useFetch<Review[]>('/kitchen/reviews');
  const complaints = useFetch<Complaint[]>('/kitchen/complaints');
  const [tab, setTab] = useState<'reviews' | 'complaints'>('reviews');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [text, setText] = useState('');

  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const avg = data.length ? data.reduce((a, r) => a + r.rating, 0) / data.length : 0;
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: data.filter((r) => r.rating === s).length }));

  const reply = async (id: number) => {
    try { await api.post(`/kitchen/reviews/${id}/reply`, { reply: text }); toast.success('Reply posted'); setReplyTo(null); setText(''); reload(true); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div>
      <PageHeader title="Reviews & feedback" subtitle="Reply to customers — kitchens that respond get better ratings." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'reviews', label: 'Reviews', count: data.length }, { value: 'complaints', label: 'Complaints', count: complaints.data?.length }]} />
      {tab === 'reviews' ? (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="card h-fit p-6 text-center">
            <p className="text-5xl font-bold">{avg.toFixed(1)}</p><Stars value={avg} size="h-5 w-5" /><p className="mt-1 text-sm text-charcoal-400">{data.length} reviews</p>
            <div className="mt-5 space-y-1.5">{dist.map((d) => (
              <div key={d.s} className="flex items-center gap-2 text-xs"><span className="w-3">{d.s}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-200"><div className="h-full bg-amber-400" style={{ width: `${data.length ? (d.n / data.length) * 100 : 0}%` }} /></div><span className="w-5 text-right">{d.n}</span></div>
            ))}</div>
          </div>
          <div className="space-y-3">
            {data.length === 0 && <EmptyState icon={MessageSquareQuote} title="No reviews yet" />}
            {data.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Avatar name={r.customerName} size="h-9 w-9" /><div><p className="text-sm font-semibold">{r.customerName}</p><Stars value={r.rating} size="h-3.5 w-3.5" /></div></div><span className="text-xs text-charcoal-400">{timeAgo(r.createdAt)}</span></div>
                {r.comment && <p className="mt-3 text-sm text-charcoal-700">{r.comment}</p>}
                {r.kitchenReply ? <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-800"><b>Your reply:</b> {r.kitchenReply}</p>
                  : replyTo === r.id ? (
                    <div className="mt-3 flex gap-2"><input className="input" autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Thank you for ordering…" /><button className="btn-primary" disabled={!text.trim()} onClick={() => reply(r.id)}>Post</button></div>
                  ) : <button className="btn-ghost mt-2 px-2 py-1 text-xs" onClick={() => { setReplyTo(r.id); setText(''); }}><Reply className="h-3.5 w-3.5" />Reply</button>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.data?.length === 0 && <EmptyState title="No complaints. Keep it up!" />}
          {complaints.data?.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{c.subject}</p><div className="flex gap-2"><StatusBadge status={c.priority} /><StatusBadge status={c.status} /></div></div>
              <p className="mt-1 text-xs text-charcoal-400">{c.category} · {c.customer.fullName} · {fmtDate(c.createdAt)}</p>
              <p className="mt-2 text-sm text-charcoal-600">{c.description}</p>
              {c.resolution && <p className="mt-2 rounded-xl bg-cream-100 p-3 text-sm"><b>Resolution:</b> {c.resolution}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
