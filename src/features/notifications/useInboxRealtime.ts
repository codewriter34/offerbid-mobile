import {useEffect} from 'react';
import {getSocket, subscribeToEvent} from '@shared/lib/socket';
import {mapNotification} from '@api/mappers';
import {useNotificationStore} from './notificationStore';
import {displayNotification, getCachedFcmToken} from './pushService';
import {notificationBody, notificationTitle} from './notificationCopy';

export function useInboxRealtime(enabled: boolean) {
  const addNotification = useNotificationStore(s => s.addNotification);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let unsub: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const attach = () => {
      if (cancelled) return;
      if (!getSocket()) {
        timer = setTimeout(attach, 400);
        return;
      }
      unsub = subscribeToEvent('notification:new', (raw: unknown) => {
        const item = mapNotification(raw);
        addNotification(item);
        const token = getCachedFcmToken();
        const needsLocalBanner = !token || token.startsWith('ExponentPushToken');
        if (needsLocalBanner) {
          void displayNotification(
            notificationTitle(item.type),
            notificationBody(item),
            {type: item.type, id: item.id},
          );
        }
      });
    };

    attach();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsub?.();
    };
  }, [enabled, addNotification]);
}
