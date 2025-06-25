import { useState, useCallback } from 'react';
import { handleApiError, showSuccessNotification } from '../utils/apiErrorHandler';

interface UseApiStateOptions {
  successMessage?: string;
  errorMessage?: string;
}

export const useApiState = (options: UseApiStateOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(
    apiCall: () => Promise<T>,
    onSuccess?: (data: T) => void
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall();
      
      if (options.successMessage) {
        showSuccessNotification(options.successMessage);
      }
      
      onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = options.errorMessage || err?.response?.data?.message || 'Có lỗi xảy ra';
      setError(errorMessage);
      handleApiError(err, options.errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [options.successMessage, options.errorMessage]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset
  };
}; 