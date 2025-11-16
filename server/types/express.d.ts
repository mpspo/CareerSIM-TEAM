import { Database } from './database';
import { Session } from './auth';

declare global {
  namespace Express {
    interface Request {
      session?: Session;
      db?: Database;
      token?: string;
    }
  }
}

export {};
