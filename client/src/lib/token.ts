import jwt from "jsonwebtoken";

export const generateToken = async () => {
  const token = jwt.sign({ isLoggedIn: true }, "your_secret_key_here");
  return token;
};
export const verifyToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, "your_secret_key_here");
    return decoded;
  } catch {
    return null;
  }
};
