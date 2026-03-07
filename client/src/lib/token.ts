import jwt from "jsonwebtoken";

export const generateToken = async () => {
  const token = jwt.sign({ isLoggedIn: true }, "your_secret_key_here");
  return token;
};
