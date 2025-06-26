import { Request } from 'express';

/**
 * Lấy địa chỉ IP thật của client, xử lý reverse proxy
 * Ưu tiên: X-Forwarded-For > X-Real-IP > req.connection.remoteAddress
 */
export function getRealClientIP(req: Request): string {
  // Lấy từ X-Forwarded-For header (thường từ reverse proxy như nginx)
  const xForwardedFor = req.headers['x-forwarded-for'] as string;
  if (xForwardedFor) {
    // X-Forwarded-For có thể chứa nhiều IP, lấy IP đầu tiên (client thật)
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    const clientIP = ips[0];
    
    // Kiểm tra IP hợp lệ và không phải localhost/private
    if (isValidPublicIP(clientIP)) {
      return clientIP;
    }
  }

  // Lấy từ X-Real-IP header  
  const xRealIP = req.headers['x-real-ip'] as string;
  if (xRealIP && isValidPublicIP(xRealIP)) {
    return xRealIP;
  }

  // Lấy từ X-Client-IP header
  const xClientIP = req.headers['x-client-ip'] as string;
  if (xClientIP && isValidPublicIP(xClientIP)) {
    return xClientIP;
  }

  // Fallback về req.ip hoặc connection remote address
  const fallbackIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
  
  // Chuyển IPv6 localhost về IPv4 để dễ đọc hơn
  if (fallbackIP === '::1' || fallbackIP === '::ffff:127.0.0.1') {
    return '127.0.0.1'; // Localhost IPv4
  }

  return fallbackIP || 'unknown';
}

/**
 * Kiểm tra IP có phải là public IP hay không
 * Loại bỏ localhost, private network IPs
 */
export function isValidPublicIP(ip: string): boolean {
  if (!ip || ip === 'unknown') return false;

  // IPv6 localhost
  if (ip === '::1' || ip.startsWith('::ffff:127.')) return false;
  
  // IPv4 localhost và private networks
  if (ip.startsWith('127.')) return false; // localhost  
  if (ip.startsWith('10.')) return false; // private class A
  if (ip.startsWith('172.')) {
    const parts = ip.split('.');
    const secondOctet = parseInt(parts[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return false; // private class B
  }
  if (ip.startsWith('192.168.')) return false; // private class C
  if (ip.startsWith('169.254.')) return false; // link-local

  return true;
}

/**
 * Format IP address để hiển thị user-friendly
 */
export function formatIPForDisplay(ip: string): string {
  if (!ip || ip === 'unknown') return 'Không xác định';
  
  // Hiển thị localhost một cách thân thiện hơn
  if (ip === '127.0.0.1' || ip === '::1') {
    return `${ip} (Localhost)`;
  }

  // Kiểm tra nếu là private IP
  if (!isValidPublicIP(ip)) {
    return `${ip} (Mạng nội bộ)`;
  }

  return ip;
}

/**
 * Lấy thông tin user agent formatted
 */
export function formatUserAgent(userAgent: string | undefined): {
  browser: string;
  os: string;
  device: string;
} {
  if (!userAgent) {
    return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  }

  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10';
  else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS X')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

  // Detect device type
  let device = 'Desktop';
  if (userAgent.includes('Mobile')) device = 'Mobile';
  else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) device = 'Tablet';

  return { browser, os, device };
} 