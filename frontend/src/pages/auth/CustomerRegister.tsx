import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell';
import OtpField from './OtpField';
import { api, errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui';

export default function CustomerRegister() {
  const nav = useNavigate();
  const { setSession } = useAuth();
  const [f, setF] = useState({ fullName: '', username: '', password: '', email: '', hometown: '' });
  const [phone, setPhone] = useState('');
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) return toast.error('Please verify your mobile number');
    if (f.password.length < 4) return toast.error('Password must be at least 4 characters');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register/customer', { ...f, phone, email: f.email || null });
      setSession(data);
      toast.success('Welcome to HomePlate!');
      nav('/kitchens');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <AuthShell image="/images/thali-chapati.jpg" eyebrow="Join HomePlate" title="A taste of home, just around the corner"
      text="Moved to Coimbatore for college or work? Find verified home kitchens near your hostel or PG."
      points={['Verified home kitchens within 5 km', 'Food from your hometown - Madurai, Kerala, Andhra…', 'Affordable everyday meals']}>
      <h1 className="font-display text-3xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-charcoal-500">Already have one? <Link to="/login" className="font-semibold text-brand-700">Login</Link></p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div><label className="label">Full name</label><input className="input" required value={f.fullName} onChange={set('fullName')} placeholder="Arun Kumar" /></div>
        <OtpField phone={phone} setPhone={setPhone} verified={verified} setVerified={setVerified} />
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Username</label><input className="input" required minLength={3} value={f.username} onChange={set('username')} /></div>
          <div><label className="label">Password</label><input className="input" type="password" required value={f.password} onChange={set('password')} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Email (optional)</label><input className="input" type="email" value={f.email} onChange={set('email')} /></div>
          <div><label className="label">Hometown</label><input className="input" value={f.hometown} onChange={set('hometown')} placeholder="e.g. Madurai" /></div>
        </div>
        <button className="btn-primary w-full py-3" disabled={busy || !verified}>{busy && <Spinner className="h-4 w-4 text-white" />}Create account</button>
      </form>
    </AuthShell>
  );
}
