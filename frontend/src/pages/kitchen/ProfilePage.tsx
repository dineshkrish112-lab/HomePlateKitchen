import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Badge, PageHeader, PageLoader, Spinner, Tabs } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { ComplianceSection, KitchenInfoSection, LocationSection, OperationsSection, toForm, toPayload, type KitchenFormState } from './KitchenForm';

type T = 'info' | 'location' | 'compliance' | 'operations';

export default function ProfilePage() {
  const { kitchen, refresh } = useAuth();
  const [f, setF] = useState<KitchenFormState | null>(null);
  const [tab, setTab] = useState<T>('info');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (kitchen) setF(toForm(kitchen)); }, [kitchen]);
  if (!kitchen || !f) return <PageLoader />;
  const set = <K extends keyof KitchenFormState>(k: K, v: KitchenFormState[K]) => setF((s) => (s ? { ...s, [k]: v } : s));

  const save = async () => {
    setBusy(true);
    try { await api.put('/kitchen/profile', toPayload(f)); await refresh(); toast.success('Kitchen profile saved'); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Kitchen profile" subtitle={<span className="flex flex-wrap items-center gap-2">{kitchen.name} <StatusBadge status={kitchen.status} />
        <Badge tone={kitchen.idProofStatus === 'VERIFIED' ? 'green' : 'yellow'}>ID {kitchen.idProofStatus.toLowerCase()}</Badge>
        <Badge tone={kitchen.fssaiStatus === 'VERIFIED' ? 'green' : 'yellow'}>FSSAI {kitchen.fssaiStatus.toLowerCase()}</Badge></span>}
        actions={<button className="btn-primary" onClick={save} disabled={busy}>{busy ? <Spinner className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}Save changes</button>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'info', label: 'Kitchen info' }, { value: 'location', label: 'Address & delivery' }, { value: 'compliance', label: 'Documents' }, { value: 'operations', label: 'Hours & capacity' }]} />
      <div className="card p-6 sm:p-8">
        {tab === 'info' && <>
          <KitchenInfoSection f={f} set={set} />
          <div className="mt-5"><label className="label">Today's special (shown on your card)</label><input className="input" value={f.todaySpecial} onChange={(e) => set('todaySpecial', e.target.value)} placeholder="Kongu Pepper Chicken with Rice" /></div>
        </>}
        {tab === 'location' && <LocationSection f={f} set={set} />}
        {tab === 'compliance' && <><ComplianceSection f={f} set={set} /><p className="mt-4 text-xs text-charcoal-400">Uploading a new document resets its status to pending until the admin re-verifies it.</p></>}
        {tab === 'operations' && <OperationsSection f={f} set={set} />}
      </div>
    </div>
  );
}
