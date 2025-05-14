import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
dotenv.config();

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
  const token = jwt.sign(payload, process.env.SECRET_KEY as string);
  return token;
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

