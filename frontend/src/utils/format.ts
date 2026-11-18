export const rupee = (n?: number | null, decimals = 0) =>
  n == null ? '—' : '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const shortRupee = (n?: number | null) => {
  if (n == null) return '—';
  const v = Number(n);
  if (v >= 1e7) return '₹' + (v / 1e7).toFixed(1) + 'Cr';
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(1) + 'L';
  if (v >= 1e3) return '₹' + (v / 1e3).toFixed(1) + 'k';
  return '₹' + v.toFixed(0);
};

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';

export const fmtTime = (s?: string | null) => {
  if (!s) return '—';
  // Accepts "HH:mm:ss" (LocalTime) or ISO date-time
  if (/^\d{2}:\d{2}/.test(s)) {
    const [h, m] = s.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  return new Date(s).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
};

export const timeAgo = (s?: string | null) => {
  if (!s) return '';
  const diff = (Date.now() - new Date(s).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} days ago`;
  return fmtDate(s);
};

export const titleCase = (s?: string | null) =>
  (s || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const addDaysISO = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const mealLabel: Record<string, string> = { BREAKFAST: 'Breakfast', LUNCH: 'Lunch', SNACKS: 'Evening Snacks', DINNER: 'Dinner' };

export const effPrice = (i: { price: number; offerPrice?: number | null }) => (i.offerPrice != null ? i.offerPrice : i.price);

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
