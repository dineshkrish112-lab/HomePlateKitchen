import { useState } from 'react';
import { Camera, CheckCircle2, Upload, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, errMsg } from '../../api/client';
import { useFetch } from '../../components/useFetch';
import type { CookingVideo } from '../../types';
import FileUpload from '../../components/FileUpload';
import VideoCard from '../../components/VideoCard';
import { EmptyState, ErrorState, Field, PageHeader, PageLoader, Spinner } from '../../components/ui';
import { todayISO } from '../../utils/format';

export default function VideosPage() {
  const { data, loading, error, reload } = useFetch<CookingVideo[]>('/kitchen/videos');
  const [f, setF] = useState({ videoUrl: '', preparationDate: todayISO(), description: '', durationSeconds: 0 });
  const [busy, setBusy] = useState(false);

  const onVideo = (url: string) => {
    setF((s) => ({ ...s, videoUrl: url }));
    if (url) { const el = document.createElement('video'); el.src = url; el.onloadedmetadata = () => setF((s) => ({ ...s, durationSeconds: Math.round(el.duration) })); }
  };

  const submit = async () => {
    if (!f.videoUrl) return toast.error('Upload or record a video first');
    setBusy(true);
    try {
      await api.post('/kitchen/videos', { ...f, durationSeconds: f.durationSeconds || null });
      toast.success('Video submitted for admin review');
      setF({ videoUrl: '', preparationDate: todayISO(), description: '', durationSeconds: 0 });
      reload(true);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Cooking videos" subtitle="Upload a short daily video of your kitchen and food preparation. Approved videos build customer trust." />
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <h3 className="flex items-center gap-2 font-semibold"><Upload className="h-5 w-5 text-brand-600" />Submit today's video</h3>
          <FileUpload kind="video" value={f.videoUrl} onChange={onVideo} label="Record or upload video" />
          <p className="flex items-center gap-1.5 text-xs text-charcoal-400"><Camera className="h-3.5 w-3.5" />On mobile, tapping upload lets you record directly with the camera.</p>
          <Field label="Preparation date"><input className="input" type="date" max={todayISO()} value={f.preparationDate} onChange={(e) => setF({ ...f, preparationDate: e.target.value })} /></Field>
          <Field label="Short description"><textarea className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Preparing today's sambar and chicken gravy" /></Field>
          <button className="btn-primary w-full" onClick={submit} disabled={busy}>{busy && <Spinner className="h-4 w-4 text-white" />}Submit for review</button>
          <div className="rounded-xl bg-cream-100 p-3 text-xs text-charcoal-600">
            <p className="mb-1 font-semibold">What reviewers check</p>
            {['Clean cooking area & utensils', 'Food storage (fridge / dry storage)', 'Hand hygiene, hair covered', 'Actual cooking process'].map((x) => <p key={x} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />{x}</p>)}
          </div>
        </div>
        <div>
          {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.length
            ? <EmptyState icon={Video} title="No videos yet" text="Your submitted videos and review status will appear here." />
            : <div className="grid gap-4 sm:grid-cols-2">{data.map((v) => <VideoCard key={v.id} v={v} />)}</div>}
        </div>
      </div>
    </div>
  );
}
