/**
 * Environment Variables Utility
 * Provides type-safe access to environment variables with validation
 */

export const env = {
  // API Configuration
  API_URL: `${import.meta.env.VITE_API_URL}/api`,
  
  // Environment info
  NODE_ENV: import.meta.env.MODE || 'development',
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
} as const;

/**
 * Validate that required environment variables are present
 */
export function validateEnv(): void {
  const requiredVars = ['API_URL'] as const;
  
  for (const varName of requiredVars) {
    if (!env[varName as keyof typeof env]) {
      console.warn(`⚠️ Environment variable VITE_${varName} is not set`);
    }
  }
  
  // Log current environment configuration in development
  if (env.DEV) {
    console.log('🌍 Environment Configuration:', {
      API_URL: env.API_URL,
      NODE_ENV: env.NODE_ENV,
    });
  }
}

/**
 * Helper function to get environment variable with fallback
 */
export function getEnvVar(key: string, fallback: string = ''): string {
  return import.meta.env[key] || fallback;
}

// Validate environment on module load
validateEnv();

export default env; 