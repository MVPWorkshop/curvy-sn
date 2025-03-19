import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "failed";

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
    if (JWT_SECRET === "failed") {
        res.status(500).json({ error: "Server misconfigured at the moment" })
        return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({ error: "No token provided!" });
        return
    }

    jwt.verify(token, JWT_SECRET ?? "", (err: any) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token!" })
        }

        next();
    })
}