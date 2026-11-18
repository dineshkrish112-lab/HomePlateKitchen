import { useState } from 'react';
import toast from 'react-hot-toast';
import { BellRing, KeyRound, LifeBuoy } from 'lucide-react';
import { api, errMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Field, PageHeader, Toggle } from '../../components/ui';

/** Account settings shared by the kitchen and admin portals. */
export default function SettingsPage() {
  const { user } = useAuth();
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('homeplate.notify') || '') as Record<string, boolean>; } catch { return { sms: true, email: true, sound: true }; }
  });
  const setPref = (k: string, v: boolean) => { const n = { ...prefs, [k]: v }; setPrefs(n); try { localStorage.setItem('homeplate.notify', JSON.stringify(n)); } catch { /* ignore */ } };

  const change = async () => {
    if (pw.newPassword !== pw.confirm) return toast.error('Passwords do not match');
    try { await api.post('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword }); toast.success('Password updated'); setPw({ currentPassword: '', newPassword: '', confirm: '' }); }
    catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle={`Signed in as @${user?.username} · ${user?.phone ?? ''}`} />
      <div className="space-y-6">
        <div className="card space-y-4 p-6">
          <h3 className="flex items-center gap-2 font-semibold"><KeyRound className="h-5 w-5 text-brand-600" />Change password</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Current"><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
            <Field label="New"><input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
            <Field label="Confirm"><input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          </div>
          <button className="btn-primary" onClick={change} disabled={!pw.currentPassword || pw.newPassword.length < 4}>Update password</button>
        </div>
        <div className="card space-y-4 p-6">
          <h3 className="flex items-center gap-2 font-semibold"><BellRing className="h-5 w-5 text-brand-600" />Notifications</h3>
          <Toggle checked={!!prefs.sms} onChange={(v) => setPref('sms', v)} label="SMS alerts for new orders & requests (via Twilio)" />
          <Toggle checked={!!prefs.email} onChange={(v) => setPref('email', v)} label="Email summaries" />
          <Toggle checked={!!prefs.sound} onChange={(v) => setPref('sound', v)} label="Sound alert on dashboard" />
          <p className="text-xs text-charcoal-400">SMS and email delivery activates once the platform's Twilio account is connected.</p>
        </div>
        <div className="card flex items-center gap-4 p-6">
          <LifeBuoy className="h-8 w-8 text-saffron-500" />
          <div className="text-sm"><p className="font-semibold">Need help?</p><p className="text-charcoal-500">Call +91 90000 00000 or email support@homeplate.in (9 AM – 9 PM)</p></div>
        </div>
      </div>
    </div>
  );
}
