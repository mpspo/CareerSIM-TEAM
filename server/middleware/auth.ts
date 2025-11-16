import { Request, Response, NextFunction } from 'express';
import { readDb } from '../utils/database';

export function requireToken(req: Request, res: Response, next: NextFunction) {
  const token =
    req.headers['authorization'] ||
    req.headers['x-auth-token'] ||
    (req.body && req.body.token) ||
    req.query.token;

  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'no token' });
  }

  const db = readDb();
  const sess = db.sessions[token];

  if (!sess) {
    return res.status(401).json({ error: 'invalid token' });
  }

  req.session = sess;
  req.db = db;
  req.token = token;
  next();
}
