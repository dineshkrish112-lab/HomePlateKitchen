import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../api/client';
import { useFetch } from '../../components/useFetch';
import type { Complaint, User } from '../../types';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { Avatar, ConfirmDialog, ErrorState, Field, Modal, PageHeader, PageLoader, Tabs } from '../../components/ui';
import { fmtDate, fmtDateTime, rupee, timeAgo } from '../../utils/format';

interface CRow { user: User; orders: number; totalSpent: number; lastOrderAt?: string; }

export function CustomersPage() {
  const { data, loading, error, reload } = useFetch<CRow[]>('/admin/customers');
  const [target, setTarget] = useState<User | null>(null);
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const toggle = async () => {
    if (!target) return;
    try { await api.patch(`/admin/users/${target.id}/status`, { status: target.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }); toast.success('Customer status updated'); setTarget(null); reload(true); }
    catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div>
      <PageHeader title="Customer management" subtitle={`${data.length} customers`} />
      <DataTable rows={data} searchText={(r) => `${r.user.fullName} ${r.user.username} ${r.user.phone} ${r.user.area} ${r.user.hometown}`} columns={[
        { key: 'n', header: 'Customer', render: (r) => <div className="flex items-center gap-3"><Avatar name={r.user.fullName} size="h-8 w-8" /><div><b>{r.user.fullName}</b><p className="text-xs text-charcoal-400">@{r.user.username}</p></div></div> },
        { key: 'p', header: 'Mobile', render: (r) => r.user.phone },
        { key: 'a', header: 'Area', render: (r) => r.user.area ?? '—' },
        { key: 'h', header: 'Hometown', render: (r) => r.user.hometown ?? '—' },
        { key: 'j', header: 'Joined', render: (r) => fmtDate(r.user.createdAt) },
        { key: 'o', header: 'Orders', render: (r) => r.orders },
        { key: 't', header: 'Spent', render: (r) => rupee(r.totalSpent) },
        { key: 'l', header: 'Last order', render: (r) => (r.lastOrderAt ? timeAgo(r.lastOrderAt) : '—') },
        { key: 's', header: 'Status', render: (r) => <StatusBadge status={r.user.status} /> },
        { key: 'x', header: '', render: (r) => <button onClick={() => setTarget(r.user)} className={`text-xs font-semibold ${r.user.status === 'ACTIVE' ? 'text-red-600' : 'text-brand-700'}`}>{r.user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</button> },
      ]} />
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} onConfirm={toggle} tone={target?.status === 'ACTIVE' ? 'danger' : 'primary'}
        title={`${target?.status === 'ACTIVE' ? 'Suspend' : 'Activate'} ${target?.fullName}?`} confirmLabel="Confirm"
        message={target?.status === 'ACTIVE' ? 'The customer will not be able to log in or place orders.' : 'The customer can log in again.'} />
    </div>
  );
}

export function ComplaintsPage() {
  const { data, loading, error, reload } = useFetch<Complaint[]>('/admin/complaints');
  const [tab, setTab] = useState('OPEN');
  const [sel, setSel] = useState<Complaint | null>(null);
  const [f, setF] = useState({ status: 'IN_PROGRESS', resolution: '', priority: 'MEDIUM' });
  if (loading) return <PageLoader />;
  if (error || !data) return <ErrorState message={error ?? ''} onRetry={reload} />;
  const rows = data.filter((c) => tab === 'ALL' || (tab === 'OPEN' ? ['OPEN', 'IN_PROGRESS'].includes(c.status) : ['RESOLVED', 'CLOSED'].includes(c.status)));
  const save = async () => {
    if (!sel) return;
    try { await api.patch(`/admin/complaints/${sel.id}`, f); toast.success('Complaint updated'); setSel(null); reload(true); }
    catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div>
      <PageHeader title="Complaints" subtitle="Customer complaints feed into each kitchen's public trust profile." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'OPEN', label: 'Open', count: data.filter((c) => ['OPEN', 'IN_PROGRESS'].includes(c.status)).length }, { value: 'RESOLVED', label: 'Resolved' }, { value: 'ALL', label: 'All', count: data.length }]} />
      <DataTable rows={rows} onRowClick={(c) => { setSel(c); setF({ status: c.status === 'OPEN' ? 'IN_PROGRESS' : c.status, resolution: c.resolution ?? '', priority: c.priority }); }}
        searchText={(c) => `${c.subject} ${c.customer.fullName} ${c.kitchen?.name} ${c.category}`} columns={[
          { key: 's', header: 'Subject', render: (c) => <><b>{c.subject}</b><p className="text-xs text-charcoal-400">{c.category}{c.orderId ? ` · order #${c.orderId}` : ''}</p></> },
          { key: 'c', header: 'Customer', render: (c) => c.customer.fullName },
          { key: 'k', header: 'Kitchen', render: (c) => c.kitchen?.name ?? '—' },
          { key: 'd', header: 'Raised', render: (c) => fmtDateTime(c.createdAt) },
          { key: 'p', header: 'Priority', render: (c) => <StatusBadge status={c.priority} /> },
          { key: 'st', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
        ]} />
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel?.subject} footer={<><button className="btn-ghost" onClick={() => setSel(null)}>Close</button><button className="btn-primary" onClick={save}>Save</button></>}>
        {sel && <div className="space-y-4 text-sm">
          <p className="rounded-xl bg-cream-100 p-3">{sel.description}</p>
          <p className="text-xs text-charcoal-400">{sel.customer.fullName} ({sel.customer.phone}) → {sel.kitchen?.name ?? 'Platform'} · {fmtDateTime(sel.createdAt)}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status"><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Priority"><select className="input" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>{['LOW', 'MEDIUM', 'HIGH'].map((s) => <option key={s}>{s}</option>)}</select></Field>
          </div>
          <Field label="Resolution / action taken"><textarea className="input min-h-[90px]" value={f.resolution} onChange={(e) => setF({ ...f, resolution: e.target.value })} /></Field>
        </div>}
      </Modal>
    </div>
  );
}
