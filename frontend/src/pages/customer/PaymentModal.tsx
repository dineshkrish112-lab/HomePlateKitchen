import { useState } from 'react';
import { CreditCard, Landmark, Lock, Smartphone, Wallet } from 'lucide-react';
import { Modal, Spinner, cx } from '../../components/ui';
import { rupee } from '../../utils/format';
import type { PaymentMethod } from '../../types';

/**
 * Simulated payment gateway screen. When Razorpay/Stripe keys are available,
 * replace onPay with the gateway checkout and confirm the signature on the backend.
 */
export default function PaymentModal({ open, amount, onClose, onPay, allowCod = true }:
  { open: boolean; amount: number; onClose: () => void; onPay: (m: PaymentMethod) => Promise<void>; allowCod?: boolean }) {
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [busy, setBusy] = useState(false);
  const methods: { v: PaymentMethod; label: string; sub: string; icon: typeof Wallet }[] = [
    { v: 'UPI', label: 'UPI', sub: 'GPay, PhonePe, Paytm', icon: Smartphone },
    { v: 'CARD', label: 'Credit / Debit card', sub: 'Visa, Mastercard, RuPay', icon: CreditCard },
    { v: 'NET_BANKING', label: 'Net banking', sub: 'All major banks', icon: Landmark },
    ...(allowCod ? [{ v: 'COD' as PaymentMethod, label: 'Cash on delivery', sub: 'Pay the home chef', icon: Wallet }] : []),
  ];
  const pay = async () => { setBusy(true); try { await onPay(method); } finally { setBusy(false); } };

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title="Complete payment" size="sm">
      <div className="rounded-2xl bg-brand-50 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Amount to pay</p>
        <p className="mt-1 text-3xl font-bold text-brand-800">{rupee(amount, 2)}</p>
      </div>
      <div className="mt-4 space-y-2">
        {methods.map((m) => (
          <button key={m.v} onClick={() => setMethod(m.v)} className={cx('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition',
            method === m.v ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-100' : 'border-cream-300 hover:border-brand-300')}>
            <m.icon className="h-5 w-5 text-brand-600" />
            <span className="flex-1"><span className="block text-sm font-semibold">{m.label}</span><span className="block text-xs text-charcoal-400">{m.sub}</span></span>
            <span className={cx('h-4 w-4 rounded-full border-2', method === m.v ? 'border-brand-600 bg-brand-600 ring-2 ring-inset ring-white' : 'border-cream-300')} />
          </button>
        ))}
      </div>
      <button className="btn-primary mt-5 w-full py-3" onClick={pay} disabled={busy}>
        {busy ? <Spinner className="h-4 w-4 text-white" /> : <Lock className="h-4 w-4" />}
        {method === 'COD' ? 'Confirm order' : `Pay ${rupee(amount, 2)}`}
      </button>
      <p className="mt-3 text-center text-[11px] text-charcoal-400">Test mode — no real money is charged. Payment gateway integration ready.</p>
    </Modal>
  );
}
