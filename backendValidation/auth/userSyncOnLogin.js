import pool from '../db/index.js';
import { sanitizeUserInput } from '../utils/sanitizeUserInput.js';

export async function syncUserIfNeeded(req, res, next) {
  const { oid, displayName, principalName, roles } = req.user;

  const existing = await pool.query('SELECT id FROM users WHERE oid = $1', [oid]);
  if (existing.rowCount === 0) {
    const clean = sanitizeUserInput({ displayName, principalName, role: roles?.[0] || 'user' });
    await pool.query('INSERT INTO users (oid, display_name, email, role) VALUES ($1, $2, $3, $4)', [
      oid, clean.display_name, clean.email, clean.role
    ]);
  }
  next();
}
