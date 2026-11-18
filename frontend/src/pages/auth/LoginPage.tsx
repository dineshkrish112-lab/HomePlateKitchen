import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthShell from './AuthShell';
import { useAuth } from '../../context/AuthContext';
import { errMsg } from '../../api/client';
import { Spinner } from '../../components/ui';

const config = {
  customer: {
    image: '/images/veg-leaf-meal.jpg', eyebrow: 'Welcome back', title: 'Missing the taste of home?',
    text: 'Fresh homemade meals from verified home chefs, delivered from kitchens within 5 km of you.',
    heading: 'Login to HomePlate', demo: { u: 'user', p: 'user' }, home: '/',
    points: ['Order today\'s homemade menu', 'Request any dish your way', 'Track your order live'],
  },
  kitchen: {
    image: '/images/pan-cooking.jpg', eyebrow: 'Kitchen Partner', title: 'Turn your home kitchen into a business',
    text: 'Publish your daily menu, accept custom requests and grow your earnings - with a 30-day free trial.',
    heading: 'Kitchen partner login', demo: { u: 'kitchenowner', p: 'kitchenowner' }, home: '/kitchen',
    points: ['Daily menu & orders in one place', 'Custom request quotations', 'Earnings & subscription tracking'],
  },
  admin: {
    image: '/images/spices.jpg', eyebrow: 'Super Admin', title: 'Run the HomePlate platform',
    text: 'Verify kitchens, review cooking videos, manage subscriptions and monitor revenue.',
    heading: 'Admin login', demo: { u: 'owner', p: 'owner' }, home: '/admin',
    points: ['KYC & FSSAI verification', 'Cooking video reviews', 'Revenue & commission analytics'],
  },
} as const;

export default function LoginPage({ portal }: { portal: 'customer' | 'kitchen' | 'admin' }) {
  const c = config[portal];
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Enter username and password');
    setBusy(true);
    try {
      const u = await login(username, password, portal);
      toast.success(`Welcome, ${u.fullName.split(' ')[0]}!`);
      nav(params.get('next') || c.home, { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell image={c.image} eyebrow={c.eyebrow} title={c.title} text={c.text} points={[...c.points]}>
      <h1 className="font-display text-3xl font-semibold">{c.heading}</h1>
      <p className="mt-2 text-sm text-charcoal-500">
        {portal === 'customer' && <>New here? <Link to="/register" className="font-semibold text-brand-700">Create an account</Link></>}
        {portal === 'kitchen' && <>Not a partner yet? <Link to="/kitchen/register" className="font-semibold text-brand-700">Register your kitchen</Link></>}
        {portal === 'admin' && 'Restricted to HomePlate platform administrators.'}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label className="label">Username</label>
          <input className="input" autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input className="input pr-10" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400" aria-label="Show password">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? <Spinner className="h-4 w-4 text-white" /> : <LogIn className="h-4 w-4" />}Login</button>
      </form>
      <button onClick={() => { setUsername(c.demo.u); setPassword(c.demo.p); }}
        className="mt-6 w-full rounded-xl border border-dashed border-saffron-300 bg-saffron-50 px-4 py-3 text-left text-xs text-saffron-700 hover:bg-saffron-100">
        <b>Demo account:</b> {c.demo.u} / {c.demo.p} <span className="float-right font-semibold">Fill →</span>
      </button>
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-charcoal-400">
        {portal !== 'customer' && <Link to="/login" className="hover:text-brand-700">Customer login</Link>}
        {portal !== 'kitchen' && <Link to="/kitchen/login" className="hover:text-brand-700">Kitchen partner login</Link>}
        {portal !== 'admin' && <Link to="/admin/login" className="hover:text-brand-700">Admin login</Link>}
        <Link to="/" className="hover:text-brand-700">← Back to home</Link>
      </div>
    </AuthShell>
  );
}
