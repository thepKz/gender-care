import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { Request } from 'express';
dotenv.config();

// Debug log để kiểm tra SECRET_KEY
const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
  console.error("ERROR: SECRET_KEY không tồn tại trong biến môi trường!");
} else {
  console.log("SECRET_KEY đã được tìm thấy (độ dài):", secretKey.length);
}

export const isStrongPassword = (password: string): boolean => {
  const strongPasswordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/;
  return strongPasswordRegex.test(password);
};

export const isValidFullName = (fullName: string): boolean => {
  // Kiểm tra độ dài tên (3-50 ký tự) và không chứa ký tự đặc biệt ngoại trừ dấu cách
  const fullNameRegex = /^[A-Za-zÀ-ỹ\s]{3,50}$/;
  return fullNameRegex.test(fullName);
};

export const signToken = async (payload: {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  role: string;
}) => {
  // Kiểm tra SECRET_KEY trước khi tạo token
  if (!process.env.SECRET_KEY) {
    throw new Error("SECRET_KEY không được định nghĩa trong biến môi trường!");
  }
  
  // Tạo access token với thời hạn 7 ngày
  const token = jwt.sign(
    payload, 
    process.env.SECRET_KEY,
    { expiresIn: '7d' }
  );
  return token;
};

export const signRefreshToken = async (payload: {
  _id: Types.ObjectId;
  email: string;
}) => {
  // Kiểm tra REFRESH_TOKEN_SECRET, nếu không có sẽ dùng SECRET_KEY
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY;
  
  if (!refreshSecret) {
    throw new Error("Không tìm thấy secret key cho refresh token!");
  }
  
  // Tạo refresh token với thời hạn 7 ngày
  const refreshToken = jwt.sign(
    payload, 
    refreshSecret,
    { expiresIn: '7d' }
  );
  return refreshToken;
};

export const verifyRefreshToken = async (token: string) => {
  try {
    // Sử dụng cùng logic như signRefreshToken
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || process.env.SECRET_KEY;
    
    if (!refreshSecret) {
      throw new Error("Không tìm thấy secret key cho refresh token!");
    }
    
    const decoded = jwt.verify(token, refreshSecret) as {
      _id: string;
      email: string;
    };
    return { valid: true, expired: false, decoded };
  } catch (error: any) {
    return {
      valid: false,
      expired: error.message === "jwt expired",
      decoded: null
    };
  }
};

export const replaceName = (str: string) => {
  return str
    .normalize("NFD")
    .toLocaleLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/ /g, "-")
    .replace(/[:!@#$%^&*()?;/]/g, "");
};

export const randomText = (num: number) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";

  for (let index = 0; index < characters.length; index++) {
    if (text.length <= (num ? num : 10)) {
      const str = characters[Math.floor(Math.random() * characters.length)];
      text += str;
    }
  }
  return text;
};

/**
 * Generate a random strong password
 * Password will contain uppercase, lowercase, numbers and special characters
 */
export const generateRandomPassword = (length: number = 12): string => {
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Ensure password contains at least one character from each category
  let password = '';
  password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
  password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
  password += numberChars[Math.floor(Math.random() * numberChars.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest with random characters from all categories
  const allChars = lowercaseChars + uppercaseChars + numberChars + specialChars;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to randomize the order
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Extract real IP address từ request
 */
export const getRealIP = (req: Request): string => {
  return req.realIP || 
    req.ip || 
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.headers['x-real-ip']?.toString() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown';
};

/**
 * Interface cho IP geolocation response
 */
export interface GeolocationData {
  ip: string;
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  isp?: string;
  location?: string; // Formatted location string
}

/**
 * Get location from IP address using free IP geolocation service
 * Sử dụng ip-api.com (free, no API key required, 1000 requests/month)
 */
export const getLocationFromIP = async (ip: string): Promise<GeolocationData> => {
  try {
    // Skip geolocation cho localhost/development IPs
    if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === 'localhost' || 
        ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {
        ip,
        location: 'Local Network'
      };
    }

    console.log(`Getting location for IP: ${ip}`);
    
    // Sử dụng ip-api.com (free service)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,timezone,isp,query`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'success') {
      const location = [data.city, data.regionName, data.country]
        .filter(Boolean)
        .join(', ');
      
      return {
        ip: data.query || ip,
        country: data.country,
        city: data.city,
        region: data.regionName,
        timezone: data.timezone,
        isp: data.isp,
        location: location || 'Unknown Location'
      };
    } else {
      console.warn(`Geolocation failed for IP ${ip}:`, data.message);
      return {
        ip,
        location: 'Unknown Location'
      };
    }
  } catch (error) {
    console.error(`Error getting location for IP ${ip}:`, error);
    return {
      ip,
      location: 'Unknown Location'
    };
  }
};

/**
 * Get user agent info
 */
export const parseUserAgent = (userAgent?: string) => {
  if (!userAgent) return {
    browser: 'Unknown',
    os: 'Unknown',
    device: 'Unknown'
  };

  const browser = getBrowserFromUserAgent(userAgent);
  const os = getOSFromUserAgent(userAgent);
  const device = getDeviceFromUserAgent(userAgent);

  return { browser, os, device };
};

export const getBrowserFromUserAgent = (userAgent: string): string => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

export const getOSFromUserAgent = (userAgent: string): string => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

export const getDeviceFromUserAgent = (userAgent: string): string => {
  if (/Mobile|Android|iPhone/.test(userAgent)) return 'Mobile';
  if (/Tablet|iPad/.test(userAgent)) return 'Tablet';
  return 'Desktop';
};

