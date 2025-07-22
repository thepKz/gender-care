import SystemConfigs, { ISystemConfigs } from '../models/SystemConfigs';

interface ConfigCache {
  [key: string]: {
    value: string;
    timestamp: number;
  };
}

class SystemConfigService {
  private cache: ConfigCache = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Lấy giá trị config theo key với cache
   */
  async getConfig(key: string, defaultValue?: string): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.cache[key];
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return cached.value;
      }

      // Query from database
      const config = await SystemConfigs.findOne({ key });
      const value = config?.value || defaultValue || null;

      // Update cache
      if (value !== null) {
        this.cache[key] = {
          value,
          timestamp: Date.now()
        };
      }

      return value;
    } catch (error) {
      console.error(`Error getting config ${key}:`, error);
      return defaultValue || null;
    }
  }

  /**
   * Lấy giá trị config dạng số
   */
  async getConfigAsNumber(key: string, defaultValue?: number): Promise<number | null> {
    const value = await this.getConfig(key, defaultValue?.toString());
    if (value === null) return defaultValue || null;
    
    const numValue = parseInt(value, 10);
    return isNaN(numValue) ? (defaultValue || null) : numValue;
  }

  /**
   * Lấy timeout cho reservation (phút)
   */
  async getReservationTimeoutMinutes(): Promise<number> {
    const timeout = await this.getConfigAsNumber('reservation_timeout_minutes', 10);
    return timeout || 10; // Fallback to 10 minutes
  }

  /**
   * Lấy timeout cho consultation (phút)
   */
  async getConsultationTimeoutMinutes(): Promise<number> {
    const timeout = await this.getConfigAsNumber('consultation_timeout_minutes', 15);
    return timeout || 15; // Fallback to 15 minutes
  }

  /**
   * Tạo hoặc cập nhật config
   */
  async setConfig(key: string, value: string): Promise<ISystemConfigs> {
    try {
      const config = await SystemConfigs.findOneAndUpdate(
        { key },
        { value },
        { upsert: true, new: true }
      );

      // Clear cache for this key
      delete this.cache[key];

      return config;
    } catch (error) {
      console.error(`Error setting config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Lấy tất cả configs
   */
  async getAllConfigs(): Promise<ISystemConfigs[]> {
    try {
      return await SystemConfigs.find({}).sort({ key: 1 });
    } catch (error) {
      console.error('Error getting all configs:', error);
      throw error;
    }
  }

  /**
   * Xóa config
   */
  async deleteConfig(key: string): Promise<boolean> {
    try {
      const result = await SystemConfigs.deleteOne({ key });
      
      // Clear cache for this key
      delete this.cache[key];
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error(`Error deleting config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Lấy multiple configs cùng lúc
   */
  async getMultipleConfigs(keys: string[]): Promise<{ [key: string]: string | null }> {
    const result: { [key: string]: string | null } = {};
    
    for (const key of keys) {
      result[key] = await this.getConfig(key);
    }
    
    return result;
  }
}

// Export singleton instance
export default new SystemConfigService();
