import jwt from "jsonwebtoken";
import { initConfig } from "../src/config";
const config = initConfig();
const JWT_SECRET: string = config.jwtSecret;

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not set properly in the configuration!");
  process.exit(1);
}

const generateToken = (): void => {
  const payload = {
    user: "frontend",
  };

  const token = jwt.sign(payload, JWT_SECRET);
  console.log("Generated token:", token);
};

generateToken();
