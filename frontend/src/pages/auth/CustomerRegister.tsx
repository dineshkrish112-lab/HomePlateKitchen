import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell';
import OtpField, { useOtpConfig } from './OtpField';
import { api, errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui';

export default function CustomerRegister() {
  const nav = useNavigate();
  const { setSession } = useAuth();
  const cfg = useOtpConfig();
  const [f, setF] = useState({ fullName: '', username: '', password: '', hometown: '' });
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phoneOk, setPhoneOk] = useState(false);
  const [emailOk, setEmailOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const emailNeeded = !!cfg?.emailRequired;
  const ready = phoneOk && (!emailNeeded || emailOk) && !!email;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOk) return toast.error('Please verify your mobile number');
    if (emailNeeded && !emailOk) return toast.error('Please verify your email address');
    if (f.password.length < 6) return toast.error('Password must be at least 6 characters');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register/customer', { ...f, phone, email });
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
        <div><label className="label">Full name</label><input className="input" required value={f.fullName} onChange={set('fullName')} placeholder="Your full name" /></div>
        <OtpField channel="sms" value={phone} setValue={setPhone} verified={phoneOk} setVerified={setPhoneOk} />
        {emailNeeded
          ? <OtpField channel="email" value={email} setValue={setEmail} verified={emailOk} setVerified={setEmailOk} />
          : <div><label className="label">Email</label><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value.trim())} placeholder="you@example.com" /></div>}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Username</label><input className="input" required minLength={3} autoComplete="username" value={f.username} onChange={set('username')} /></div>
          <div><label className="label">Password</label><input className="input" type="password" required minLength={6} autoComplete="new-password" value={f.password} onChange={set('password')} placeholder="Min 6 characters" /></div>
        </div>
        <div><label className="label">Hometown <span className="font-normal text-charcoal-400">(optional)</span></label><input className="input" value={f.hometown} onChange={set('hometown')} placeholder="e.g. Madurai" /></div>
        <button className="btn-primary w-full py-3" disabled={busy || !ready}>{busy && <Spinner className="h-4 w-4 text-white" />}Create account</button>
      </form>
    </AuthShell>
  );
}
