import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { useFetch } from '../../components/useFetch';
import type { Order } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import { EmptyState, ErrorState, PageHeader, PageLoader, Tabs } from '../../components/ui';
import { fmtDateTime, rupee } from '../../utils/format';

const ACTIVE = ['PAYMENT_PENDING', 'PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'];

export default function Orders() {
  const { data, loading, error, reload } = useFetch<Order[]>('/customer/orders');
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const rows = (data ?? []).filter((o) => (tab === 'active') === ACTIVE.includes(o.status));
  const activeCount = (data ?? []).filter((o) => ACTIVE.includes(o.status)).length;

  return (
    <div className="container-x py-8">
      <PageHeader title="My orders" subtitle="Track live orders and reorder your favourites" />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'active', label: 'Active', count: activeCount }, { value: 'past', label: 'Past orders', count: (data?.length ?? 0) - activeCount }]} />
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : !rows.length ? (
        <EmptyState icon={ClipboardList} title={tab === 'active' ? 'No active orders' : 'No past orders yet'} action={<Link to="/kitchens" className="btn-primary">Order homemade food</Link>} />
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lift">
              <img src={o.items[0]?.imageUrl || o.kitchen.coverImage} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{o.kitchen.name}</p><StatusBadge status={o.status} />{o.orderType === 'CUSTOM_REQUEST' && <span className="text-[11px] font-bold uppercase text-saffron-600">Custom</span>}</div>
                <p className="mt-0.5 truncate text-sm text-charcoal-500">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
                <p className="mt-0.5 text-xs text-charcoal-400">{o.orderNumber} · {fmtDateTime(o.createdAt)}</p>
              </div>
              <p className="font-bold">{rupee(o.totalAmount)}</p>
              <ChevronRight className="h-5 w-5 text-charcoal-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
