import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { readDb, writeDb, findUser } from '../utils/database';
import { LoginRequest, RegisterRequest, LoginResponse } from '../types/auth';

const router = Router();

// Register
router.post('/register', (req, res) => {
  const { username, password, study, target } = req.body as RegisterRequest;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const db = readDb();

  if (findUser(db, username)) {
    return res.status(400).json({ error: 'user exists' });
  }

  const hashed = bcrypt.hashSync(password, 8);
  const user = {
    id: uuidv4(),
    username,
    password: hashed,
    study: study || '',
    target: target || '',
  };

  db.users.push(user);
  writeDb(db);

  return res.json({ ok: true });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const db = readDb();
  const user = findUser(db, username);

  if (!user) {
    return res.status(400).json({ error: 'invalid credentials' });
  }

  const match = bcrypt.compareSync(password, user.password);

  if (!match) {
    return res.status(400).json({ error: 'invalid credentials' });
  }

  const token = uuidv4();
  db.sessions[token] = { username: user.username, created: Date.now() };
  writeDb(db);

  const response: LoginResponse = {
    token,
    username: user.username,
    study: user.study,
    target: user.target,
  };

  return res.json(response);
});

export default router;
