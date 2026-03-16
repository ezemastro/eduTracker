import { JWT_SECRET } from "@/constants/env";
import jwt from "jsonwebtoken";

export const generateToken = async () => {
  const token = jwt.sign({ isLoggedIn: true }, JWT_SECRET);
  return token;
};
export const verifyToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
};
