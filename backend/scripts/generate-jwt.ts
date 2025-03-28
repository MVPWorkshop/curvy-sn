import jwt from "jsonwebtoken";
require("dotenv").config();
const JWT_SECRET: string = process.env.JWT_SECRET ?? "failed";

const generateToken = () => {
  if (JWT_SECRET === "failed") {
    console.log(
      "JWT_SECRET or JWT_DURATION not set properly in the environment!",
    );
    return;
  }

  const payload = {
    user: "frontend",
  };

  const token = jwt.sign(payload, JWT_SECRET);
  console.log("Generated token:", token);
};

generateToken();
