import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { api, errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useLocationCtx } from '../../context/LocationContext';
import { useFetch } from '../../components/useFetch';
import type { Complaint } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import { Avatar, Field, PageHeader, Spinner } from '../../components/ui';
import { fmtDate } from '../../utils/format';

export default function Profile() {
  const { user, refresh } = useAuth();
  const { location } = useLocationCtx();
  const complaints = useFetch<Complaint[]>('/customer/complaints');
  const [f, setF] = useState({ fullName: '', email: '', phone: '', address: '', hometown: '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setF({ fullName: user.fullName, email: user.email ?? '', phone: user.phone ?? '', address: user.address ?? '', hometown: user.hometown ?? '' });
  }, [user]);

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/customer/profile', { ...f, area: location.label, latitude: location.lat, longitude: location.lng });
      await refresh();
      toast.success('Profile saved');
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const changePw = async () => {
    try { await api.post('/auth/change-password', pw); setPw({ currentPassword: '', newPassword: '' }); toast.success('Password changed'); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="container-x py-8">
      <PageHeader title="My profile" />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card p-6">
          <div className="mb-6 flex items-center gap-4"><Avatar name={user?.fullName} size="h-16 w-16" /><div><p className="text-lg font-semibold">{user?.fullName}</p><p className="text-sm text-charcoal-400">@{user?.username} · joined {fmtDate(user?.createdAt)}</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><input className="input" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
            <Field label="Mobile"><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
            <Field label="Email"><input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Hometown"><input className="input" value={f.hometown} onChange={(e) => setF({ ...f, hometown: e.target.value })} /></Field>
            <Field label={`Default delivery address (${location.label})`} className="sm:col-span-2"><textarea className="input min-h-[80px]" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          </div>
          <button className="btn-primary mt-5" onClick={save} disabled={busy}>{busy ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}Save changes</button>
        </div>
        <div className="space-y-6">
          <div className="card space-y-3 p-6">
            <h3 className="font-semibold">Change password</h3>
            <input className="input" type="password" placeholder="Current password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            <input className="input" type="password" placeholder="New password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
            <button className="btn-outline w-full" onClick={changePw} disabled={!pw.currentPassword || pw.newPassword.length < 4}>Update password</button>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold">My complaints</h3>
            <div className="mt-3 space-y-3">
              {complaints.data?.length === 0 && <p className="text-sm text-charcoal-400">No complaints raised.</p>}
              {complaints.data?.map((c) => (
                <div key={c.id} className="rounded-xl bg-cream-50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><p className="font-medium">{c.subject}</p><StatusBadge status={c.status} /></div>
                  <p className="text-xs text-charcoal-400">{c.kitchen?.name} · {fmtDate(c.createdAt)}</p>
                  {c.resolution && <p className="mt-1 text-xs text-brand-700">{c.resolution}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
