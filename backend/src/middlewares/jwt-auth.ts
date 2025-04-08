import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function createAuthMiddleware(secret: string) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (secret === "") {
      res.status(500).json({ error: "Server misconfigured at the moment" });
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "No token provided!" });
      return;
    }

    jwt.verify(token, secret, (err: any) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token!" });
      }

      next();
    });
  }
}