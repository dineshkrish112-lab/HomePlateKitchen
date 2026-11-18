import { useCallback, useEffect, useState } from 'react';
import { api, errMsg } from '../api/client';

/** Small data hook: GET `url` with loading / error / reload. Pass null to skip. */
export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!url) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<T>(url);
      setData(data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { load(); }, [load, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, setData, loading, error, reload: load };
}
