import {useCallback, useState} from 'react';
import {Identity, SubmitIdentityPayload} from '@shared/types';
import * as identityService from './identityService';

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIdentity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const mapped = await identityService.fetchIdentity();
      setIdentity(mapped);
      return mapped;
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Failed to load KYC status';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitIdentity = useCallback(async (payload: SubmitIdentityPayload) => {
    setLoading(true);
    setError(null);
    try {
      const mapped = await identityService.submitIdentity(payload);
      setIdentity(mapped);
      return mapped;
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Failed to submit identity';
      setError(message);
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {identity, isLoading, error, fetchIdentity, submitIdentity};
}
