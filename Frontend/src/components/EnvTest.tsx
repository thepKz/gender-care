import React from 'react';
import { env } from '../utils/env';

/**
 * Component để test environment variables
 * Chỉ hiển thị trong development mode
 */
const EnvTest: React.FC = () => {
  // Chỉ hiển thị trong development
  if (!env.DEV) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999
    }}>
      <h4>🔧 VITE_API_URL Test</h4>
      <div><strong>env.API_URL:</strong> {env.API_URL}</div>
      <div><strong>NODE_ENV:</strong> {env.NODE_ENV}</div>
      <div><strong>DEV Mode:</strong> {env.DEV ? 'true' : 'false'}</div>
      
      <h5>Raw import.meta.env:</h5>
      <div><strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL || 'undefined'}</div>
    </div>
  );
};

export default EnvTest; 