import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
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
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as {
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

