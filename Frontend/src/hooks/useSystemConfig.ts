import { useState, useEffect, useCallback } from 'react';
import { systemConfigApi } from '../api/endpoints/systemConfig';

interface SystemConfigCache {
  reservation_timeout_minutes: number;
  consultation_timeout_minutes: number;
  auto_refresh_interval_seconds: number;
  lastFetched: number;
}

const CACHE_DURATION = 30 * 1000; // 30 seconds - reduced for more frequent updates
const STORAGE_KEY = 'system_config_cache';

/**
 * Hook để quản lý system configs với cache
 */
export const useSystemConfig = () => {
  const [configs, setConfigs] = useState<SystemConfigCache | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Lấy configs từ localStorage cache
   */
  const getCachedConfigs = useCallback((): SystemConfigCache | null => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (!cached) return null;

      const parsedCache = JSON.parse(cached) as SystemConfigCache;
      const now = Date.now();

      // Check if cache is still valid
      if (now - parsedCache.lastFetched < CACHE_DURATION) {
        return parsedCache;
      }

      // Cache expired, remove it
      localStorage.removeItem(STORAGE_KEY);
      return null;
    } catch (error) {
      console.error('Error reading config cache:', error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  /**
   * Lưu configs vào localStorage cache
   */
  const setCachedConfigs = useCallback((newConfigs: Omit<SystemConfigCache, 'lastFetched'>) => {
    try {
      const cacheData: SystemConfigCache = {
        ...newConfigs,
        lastFetched: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
      setConfigs(cacheData);
    } catch (error) {
      console.error('Error saving config cache:', error);
    }
  }, []);

  /**
   * Fetch configs từ API
   */
  const fetchConfigs = useCallback(async (forceRefresh = false) => {
    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = getCachedConfigs();
      if (cached) {
        setConfigs(cached);
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch all configs in parallel
      const [
        reservationTimeout,
        consultationTimeout,
        autoRefreshInterval
      ] = await Promise.all([
        systemConfigApi.getReservationTimeout(),
        systemConfigApi.getConsultationTimeout(),
        systemConfigApi.getAutoRefreshInterval()
      ]);

      const newConfigs = {
        reservation_timeout_minutes: reservationTimeout,
        consultation_timeout_minutes: consultationTimeout,
        auto_refresh_interval_seconds: autoRefreshInterval
      };

      setCachedConfigs(newConfigs);
      return { ...newConfigs, lastFetched: Date.now() };

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi tải system configs';
      setError(errorMessage);
      console.error('Error fetching system configs:', err);

      // Return fallback values
      const fallbackConfigs = {
        reservation_timeout_minutes: 10,
        consultation_timeout_minutes: 15,
        auto_refresh_interval_seconds: 30,
        lastFetched: Date.now()
      };
      setConfigs(fallbackConfigs);
      return fallbackConfigs;

    } finally {
      setLoading(false);
    }
  }, [getCachedConfigs, setCachedConfigs]);

  /**
   * Clear cache và fetch lại
   */
  const refreshConfigs = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    return fetchConfigs(true);
  }, [fetchConfigs]);

  /**
   * Load configs khi component mount
   */
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  /**
   * Listen for config changes from admin dashboard
   */
  useEffect(() => {
    const handleConfigChange = () => {
      console.log('🔄 System config changed, force refreshing...');
      // Clear cache immediately and fetch new data
      localStorage.removeItem(STORAGE_KEY);
      setConfigs(null);
      fetchConfigs(true);
    };

    // Listen for custom event from admin dashboard
    window.addEventListener('systemConfigChanged', handleConfigChange);

    // Also listen for storage changes (if admin is in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'system_config_updated') {
        console.log('🔄 System config updated in another tab, force refreshing...');
        localStorage.removeItem(STORAGE_KEY);
        setConfigs(null);
        fetchConfigs(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('systemConfigChanged', handleConfigChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchConfigs]);

  /**
   * Helper functions để lấy từng config
   */
  const getReservationTimeout = useCallback(() => {
    const timeout = configs?.reservation_timeout_minutes || 10;
    console.log('🕐 getReservationTimeout called:', timeout, 'configs:', configs);
    return timeout;
  }, [configs]);

  const getConsultationTimeout = useCallback(() => {
    return configs?.consultation_timeout_minutes || 15;
  }, [configs]);

  const getAutoRefreshInterval = useCallback(() => {
    return configs?.auto_refresh_interval_seconds || 30;
  }, [configs]);

  return {
    configs,
    loading,
    error,
    fetchConfigs,
    refreshConfigs,
    // Helper functions
    getReservationTimeout,
    getConsultationTimeout,
    getAutoRefreshInterval
  };
};

export default useSystemConfig;
