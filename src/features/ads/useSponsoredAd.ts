import {useCallback, useEffect, useRef, useState} from 'react';
import {useAuthStore} from '@features/auth/authStore';
import {SponsoredAd} from '@shared/types';
import {fetchSponsoredFeedAd, viewerAdParams} from './adService';

export function useSponsoredAd() {
  const user = useAuthStore(s => s.user);
  const hub = useAuthStore(s => s.selectedHub);
  const params = viewerAdParams(user, hub);
  const country = params.country ?? '';
  const city = params.city ?? '';
  const requestRef = useRef(0);
  const [ad, setAd] = useState<SponsoredAd | null>(null);

  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    const nextParams = viewerAdParams(
      useAuthStore.getState().user,
      useAuthStore.getState().selectedHub,
    );
    const next = await fetchSponsoredFeedAd(nextParams);
    if (requestId !== requestRef.current) return;
    setAd(next);
  }, []);

  useEffect(() => {
    void refresh();
  }, [country, city, refresh]);

  return {ad, refresh};
}
