/**
 * Debug utilities cho JWT tokens
 */

export const debugToken = (token: string, label: string = 'Token') => {
  console.group(`[DEBUG] ${label}`);
  
  try {
    console.log('Raw token:', token);
    console.log('Token type:', typeof token);
    console.log('Token length:', token?.length || 0);
    
    if (!token) {
      console.warn('Token is null/undefined');
      console.groupEnd();
      return;
    }
    
    const parts = token.split('.');
    console.log('Token parts count:', parts.length);
    
    if (parts.length !== 3) {
      console.error('Invalid JWT format - should have 3 parts');
      console.log('Parts:', parts);
      console.groupEnd();
      return;
    }
    
    // Decode header
    try {
      const header = JSON.parse(atob(parts[0]));
      console.log('Header:', header);
    } catch (e) {
      console.error('Cannot decode header:', e);
    }
    
    // Decode payload
    try {
      const payload = JSON.parse(atob(parts[1]));
      console.log('Payload:', payload);
      
      // Check expiration
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        console.log('Expires at:', expDate.toISOString());
        console.log('Is expired:', now > expDate);
        console.log('Time until expiry:', expDate.getTime() - now.getTime(), 'ms');
      }
    } catch (e) {
      console.error('Cannot decode payload:', e);
    }
    
    console.log('Signature (base64):', parts[2]);
    
  } catch (error) {
    console.error('Error debugging token:', error);
  }
  
  console.groupEnd();
};

export const debugAllTokens = () => {
  console.group('[DEBUG] All Tokens in localStorage');
  
  const tokenKeys = ['access_token', 'refresh_token', 'token'];
  
  tokenKeys.forEach(key => {
    const token = localStorage.getItem(key);
    if (token) {
      debugToken(token, key);
    } else {
      console.log(`${key}: not found`);
    }
  });
  
  console.groupEnd();
};

// Thêm vào window để có thể gọi từ console
if (typeof window !== 'undefined') {
  (window as any).debugToken = debugToken;
  (window as any).debugAllTokens = debugAllTokens;
} 