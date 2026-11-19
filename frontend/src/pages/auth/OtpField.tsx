import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../api/client';
import { Spinner } from '../../components/ui';

export interface OtpConfig { sms: boolean; email: boolean; emailRequired: boolean; devMode: boolean }

/** Which OTP channels the backend can deliver right now. */
export function useOtpConfig() {
  const [cfg, setCfg] = useState<OtpConfig | null>(null);
  useEffect(() => {
    api.get('/auth/otp/config').then(({ data }) => setCfg(data))
      .catch(() => setCfg({ sms: false, email: false, emailRequired: false, devMode: false }));
  }, []);
  return cfg;
}

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

/**
 * Mobile (SMS via Twilio Verify) or email OTP verification.
 * A dev-mode OTP is shown only when the backend has no provider for the channel and dev-otp is on.
 */
export default function OtpField({ channel = 'sms', value, setValue, verified, setVerified, label, optional }: {
  channel?: 'sms' | 'email'; value: string; setValue: (v: string) => void;
  verified: boolean; setVerified: (v: boolean) => void; label?: string; optional?: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [cool, setCool] = useState(0);
  const sms = channel === 'sms';

  useEffect(() => { if (cool <= 0) return; const t = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(t); }, [cool]);

  const send = async () => {
    if (sms && !/^[6-9]\d{9}$/.test(value)) return toast.error('Enter a valid 10-digit Indian mobile number');
    if (!sms && !isEmail(value)) return toast.error('Enter a valid email address');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/otp/send', { channel, target: value });
      setSent(true); setCool(30); setCode(''); setDevOtp(data.devOtp ?? null);
      toast.success(data.message || 'OTP sent');
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const verify = async () => {
    setBusy(true);
    try {
      await api.post('/auth/otp/verify', { channel, target: value, code });
      setVerified(true);
      toast.success(sms ? 'Mobile number verified' : 'Email verified');
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <label className="label">{label ?? (sms ? 'Mobile number' : 'Email')}{optional && <span className="font-normal text-charcoal-400"> (optional)</span>}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          {sms && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-charcoal-500">+91</span>}
          <input className={`input ${sms ? 'pl-12' : ''} ${verified ? 'pr-10' : ''}`} inputMode={sms ? 'numeric' : 'email'} type={sms ? 'tel' : 'email'}
            maxLength={sms ? 10 : 120} value={value} disabled={verified} autoComplete={sms ? 'tel-national' : 'email'}
            onChange={(e) => { setValue(sms ? e.target.value.replace(/\D/g, '') : e.target.value.trim()); setSent(false); setDevOtp(null); }}
            placeholder={sms ? '98765 43210' : 'you@example.com'} />
          {verified && <CheckCircle2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />}
        </div>
        {!verified && <button type="button" onClick={send} disabled={busy || cool > 0 || !value} className="btn-outline whitespace-nowrap">
          {busy && !sent ? <Spinner className="h-4 w-4" /> : null}{cool > 0 ? `Resend in ${cool}s` : sent ? 'Resend' : 'Send OTP'}</button>}
      </div>
      {sent && !verified && (
        <div className="mt-3 animate-fade-up">
          <p className="mb-2 text-xs text-charcoal-500">Enter the 6-digit code sent to {sms ? `+91 ${value}` : value}{!sms && ' (check spam too)'}.</p>
          <div className="flex gap-2">
            <input className="input tracking-[.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" />
            <button type="button" onClick={verify} disabled={busy || code.length !== 6} className="btn-primary">Verify</button>
          </div>
          {devOtp && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Development mode ({sms ? 'SMS' : 'email'} provider not configured): OTP is <b className="tracking-widest">{devOtp}</b></p>}
        </div>
      )}
    </div>
  );
}
