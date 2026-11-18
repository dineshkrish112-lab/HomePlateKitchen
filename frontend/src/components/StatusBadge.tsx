import { Badge, type Tone } from './ui';
import { titleCase } from '../utils/format';

const map: Record<string, Tone> = {
  // orders
  PAYMENT_PENDING: 'yellow', PLACED: 'blue', CONFIRMED: 'purple', PREPARING: 'orange', READY: 'orange',
  OUT_FOR_DELIVERY: 'blue', DELIVERED: 'green', CANCELLED: 'red', REJECTED: 'red',
  // kitchens
  PENDING: 'gray', UNDER_REVIEW: 'yellow', APPROVED: 'blue', ACTIVE: 'green', SUSPENDED: 'red', DOCS_REQUESTED: 'orange',
  // requests
  SUBMITTED: 'blue', OFFERS_RECEIVED: 'purple', OFFER_SELECTED: 'orange', EXPIRED: 'gray',
  // quotes
  SELECTED: 'green', NOT_SELECTED: 'gray', DECLINED: 'red',
  // videos
  PENDING_REVIEW: 'yellow', RESUBMISSION_REQUIRED: 'orange',
  // subscriptions
  TRIAL: 'purple', NONE: 'gray',
  // payment
  PAID: 'green', COD_PENDING: 'yellow', REFUNDED: 'gray', FAILED: 'red',
  // documents & complaints
  VERIFIED: 'green', OPEN: 'red', IN_PROGRESS: 'yellow', RESOLVED: 'green', CLOSED: 'gray',
  HIGH: 'red', MEDIUM: 'yellow', LOW: 'gray',
};

const labels: Record<string, string> = {
  OUT_FOR_DELIVERY: 'Out for delivery', PAYMENT_PENDING: 'Payment pending', OFFERS_RECEIVED: 'Offers received',
  OFFER_SELECTED: 'Offer selected', COD_PENDING: 'Pay on delivery', DOCS_REQUESTED: 'Docs requested',
  RESUBMISSION_REQUIRED: 'Resubmit', PENDING_REVIEW: 'Pending review', PENDING: 'Pending',
};

export default function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return null;
  return <Badge tone={map[status] ?? 'gray'} className={className}>{labels[status] ?? titleCase(status)}</Badge>;
}
