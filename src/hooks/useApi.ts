import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';

interface UseApiState {
  data: unknown;
  loading: boolean;
  error: AxiosError | null;
}

export const useApi = () => {
  const [state, setState] = useState<UseApiState>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (promise: Promise<unknown>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await promise;
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      const axiosError = error as AxiosError;
      setState({ data: null, loading: false, error: axiosError });
      throw error;
    }
  }, []);

  return { ...state, execute };
};
