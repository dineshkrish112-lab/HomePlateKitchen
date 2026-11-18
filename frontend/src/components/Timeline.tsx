import { Check } from 'lucide-react';
import { cx } from './ui';
import { fmtDateTime } from '../utils/format';

export interface TimelineStep { key: string; label: string; time?: string | null; description?: string; }

/** Horizontal (desktop) / vertical (mobile) progress timeline. */
export default function Timeline({ steps, currentIndex, failed }: { steps: TimelineStep[]; currentIndex: number; failed?: string }) {
  return (
    <ol className="relative flex flex-col gap-0 md:flex-row md:gap-0">
      {steps.map((s, i) => {
        const done = i < currentIndex || (i === currentIndex && i === steps.length - 1);
        const current = i === currentIndex && !done;
        return (
          <li key={s.key} className="relative flex flex-1 gap-3 pb-6 md:flex-col md:items-center md:pb-0 md:text-center">
            {i < steps.length - 1 && (
              <span className={cx('absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 md:left-[calc(50%+18px)] md:top-[15px] md:h-0.5 md:w-[calc(100%-36px)]',
                i < currentIndex ? 'bg-brand-500' : 'bg-cream-300')} />
            )}
            <span className={cx('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white transition',
              done ? 'bg-brand-600 text-white' : current ? (failed ? 'bg-red-600 text-white' : 'bg-saffron-500 text-white') : 'bg-cream-200 text-charcoal-400')}>
              {done ? <Check className="h-4 w-4" /> : i + 1}
              {current && !failed && <span className="absolute inset-0 animate-ping rounded-full bg-saffron-400/40" />}
            </span>
            <div className="md:mt-2 md:px-1">
              <p className={cx('text-sm font-semibold', done || current ? 'text-charcoal-900' : 'text-charcoal-400')}>{current && failed ? failed : s.label}</p>
              {s.time && <p className="text-xs text-charcoal-400">{fmtDateTime(s.time)}</p>}
              {s.description && <p className="text-xs text-charcoal-500">{s.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
