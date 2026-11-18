import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../api/client';
import { Spinner } from '../../components/ui';

/** Mobile number + OTP verification. Twilio sends the SMS once configured; until then the dev OTP is shown. */
export default function OtpField({ phone, setPhone, verified, setVerified }:
  { phone: string; setPhone: (v: string) => void; verified: boolean; setVerified: (v: boolean) => void }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [cool, setCool] = useState(0);

  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);

  const send = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error('Enter a valid 10-digit Indian mobile number');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/otp/send', { phone });
      setSent(true); setCool(30); setDevOtp(data.devOtp ?? null);
      toast.success('OTP sent');
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true);
    try {
      await api.post('/auth/otp/verify', { phone, code });
      setVerified(true);
      toast.success('Mobile number verified');
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <label className="label">Mobile number</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-charcoal-500">+91</span>
          <input className="input pl-12" inputMode="numeric" maxLength={10} value={phone} disabled={verified}
            onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setSent(false); }} placeholder="98765 43210" />
          {verified && <CheckCircle2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />}
        </div>
        {!verified && <button type="button" onClick={send} disabled={busy || cool > 0} className="btn-outline whitespace-nowrap">
          {busy && !sent ? <Spinner className="h-4 w-4" /> : null}{cool > 0 ? `Resend in ${cool}s` : sent ? 'Resend' : 'Send OTP'}</button>}
      </div>
      {sent && !verified && (
        <div className="mt-3 animate-fade-up">
          <div className="flex gap-2">
            <input className="input tracking-[.5em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="6-digit OTP" />
            <button type="button" onClick={verify} disabled={busy || code.length !== 6} className="btn-primary">Verify</button>
          </div>
          {devOtp && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Development mode (SMS not configured yet): your OTP is <b className="tracking-widest">{devOtp}</b></p>}
        </div>
      )}
    </div>
  );
}
